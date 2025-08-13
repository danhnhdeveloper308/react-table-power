import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { 
  useForm, 
  FormProvider, 
  UseFormReturn,
  FieldValues,
  DefaultValues,
  UseFormProps,
  FieldPath,
  FieldError
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  FormAdapter, 
  FormAdapterResult, 
  FormAPI, 
  FormState, 
  DialogFormMode,
  FormValidationError 
} from '../types/forms';

/**
 * React Hook Form specific configuration
 */
export interface RHFAdapterConfig<TData extends FieldValues = FieldValues> {
  /**
   * Zod schema for validation
   */
  schema?: z.ZodType<TData, any, any>;
  
  /**
   * Default form values
   */
  defaultValues?: DefaultValues<TData> | (() => Promise<DefaultValues<TData>>);
  
  /**
   * Form mode
   */
  mode?: DialogFormMode;
  
  /**
   * When to validate
   */
  validationMode?: 'onSubmit' | 'onBlur' | 'onChange' | 'onTouched' | 'all';
  
  /**
   * When to re-validate
   */
  reValidateMode?: 'onSubmit' | 'onBlur' | 'onChange';
  
  /**
   * Validation criteria
   */
  criteriaMode?: 'firstError' | 'all';
  
  /**
   * Whether to focus error on validation failure
   */
  shouldFocusError?: boolean;
  
  /**
   * Whether to unregister fields on unmount
   */
  shouldUnregister?: boolean;
  
  /**
   * Additional useForm options
   */
  formOptions?: Omit<UseFormProps<TData>, 'resolver' | 'defaultValues' | 'mode'>;
}

/**
 * Extended form state for React Hook Form
 */
interface RHFFormState extends FormState {
  isLoaded: boolean;
  isSubmitSuccessful: boolean;
  disabled: boolean;
}

/**
 * React Hook Form API implementation
 */
class ReactHookFormAPI<TData extends FieldValues = FieldValues> implements FormAPI<TData> {
  constructor(
    private form: UseFormReturn<TData>,
    private schema?: z.ZodType<TData, any, any>
  ) {}

  getValues(): TData {
    return this.form.getValues();
  }

  async getValidatedValues(): Promise<TData> {
    const isValid = await this.form.trigger();
    if (!isValid) {
      const errors = this.form.formState.errors;
      throw {
        name: 'ValidationError',
        errors: this.convertRHFErrorsToValidationErrors(errors),
        formErrors: errors
      };
    }
    return this.form.getValues();
  }

  setValues(values: Partial<TData>): void {
    Object.entries(values).forEach(([key, value]) => {
      this.form.setValue(key as FieldPath<TData>, value, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });
    });
  }

  reset(values?: Partial<TData>): void {
    this.form.reset(values as DefaultValues<TData>);
  }

  async validate(fieldNames?: string | string[]): Promise<boolean> {
    if (fieldNames) {
      const fields = Array.isArray(fieldNames) ? fieldNames : [fieldNames];
      return await this.form.trigger(fields as FieldPath<TData>[]);
    }
    return await this.form.trigger();
  }

  async submit(): Promise<boolean> {
    try {
      const isValid = await this.form.trigger();
      if (!isValid) return false;
      
      // This is handled by the form's handleSubmit
      return true;
    } catch (error) {
      console.error('[RHF] Submit error:', error);
      return false;
    }
  }

  setError(path: string, message: string): void {
    this.form.setError(path as FieldPath<TData>, {
      type: 'manual',
      message
    });
  }

  setErrors(errors: Record<string, string>): void {
    Object.entries(errors).forEach(([path, message]) => {
      this.setError(path, message);
    });
  }

  clearErrors(): void {
    this.form.clearErrors();
  }

  getErrors(): Record<string, any> {
    return this.form.formState.errors;
  }

  isDirty(): boolean {
    return this.form.formState.isDirty;
  }

  isValid(): boolean {
    return this.form.formState.isValid;
  }

  isSubmitting(): boolean {
    return this.form.formState.isSubmitting;
  }

  watch(fieldNames?: string | string[]): any {
    if (fieldNames) {
      return this.form.watch(fieldNames as FieldPath<TData> | FieldPath<TData>[]);
    }
    return this.form.watch();
  }

  subscribe(callback: (state: FormState) => void): () => void {
    // React Hook Form doesn't have a direct subscribe method
    // This would need to be implemented using useEffect in the component
    console.warn('[RHF] Subscribe method should be implemented at component level');
    return () => {};
  }

  /**
   * Convert React Hook Form errors to our validation error format
   */
  private convertRHFErrorsToValidationErrors(errors: Record<string, FieldError | undefined>): FormValidationError[] {
    const validationErrors: FormValidationError[] = [];
    
    Object.entries(errors).forEach(([field, error]) => {
      if (error) {
        validationErrors.push({
          field,
          message: error.message || 'Invalid value',
          code: error.type,
          value: undefined // RHF doesn't provide the value in the error
        });
      }
    });
    
    return validationErrors;
  }

  /**
   * Get the raw React Hook Form instance
   */
  getRawForm(): UseFormReturn<TData> {
    return this.form;
  }
}

/**
 * React Hook Form adapter implementation
 */
export class ReactHookFormAdapter<TData extends FieldValues = FieldValues> implements FormAdapter<TData> {
  useCreate<TSchemaInput extends FieldValues = TData>(
    params: RHFAdapterConfig<TSchemaInput>
  ): FormAdapterResult<TSchemaInput> {
    const {
      schema,
      defaultValues,
      mode = 'create',
      validationMode = 'onSubmit',
      reValidateMode = 'onChange',
      criteriaMode = 'firstError',
      shouldFocusError = true,
      shouldUnregister = false,
      formOptions = {}
    } = params;

    // State for loading async default values
    const [isLoadingDefaults, setIsLoadingDefaults] = useState(false);
    const [loadedDefaults, setLoadedDefaults] = useState<DefaultValues<TSchemaInput> | undefined>();
    const isLoadingRef = useRef(false);

    // Resolve async default values
    useEffect(() => {
      const loadDefaults = async () => {
        if (typeof defaultValues === 'function' && !isLoadingRef.current) {
          isLoadingRef.current = true;
          setIsLoadingDefaults(true);
          
          try {
            const resolved = await (defaultValues as () => Promise<DefaultValues<TSchemaInput>>)();
            setLoadedDefaults(resolved);
          } catch (error) {
            console.error('[RHF] Error loading default values:', error);
            setLoadedDefaults({} as DefaultValues<TSchemaInput>);
          } finally {
            setIsLoadingDefaults(false);
            isLoadingRef.current = false;
          }
        } else if (typeof defaultValues === 'object') {
          setLoadedDefaults(defaultValues);
        }
      };

      loadDefaults();
    }, [defaultValues]);

    // React Hook Form configuration
    const formConfig: UseFormProps<TSchemaInput> = {
      mode: validationMode,
      reValidateMode,
      criteriaMode,
      shouldFocusError,
      shouldUnregister,
      defaultValues: loadedDefaults,
      resolver: schema ? zodResolver(schema) : undefined,
      ...formOptions
    };

    // Create form instance
    const form = useForm<TSchemaInput>(formConfig);

    // Create our API wrapper
    const api = useMemo(
      () => new ReactHookFormAPI(form, schema),
      [form, schema]
    );

    // Create form state
    const formState: RHFFormState = useMemo(() => ({
      isDirty: form.formState.isDirty,
      isValid: form.formState.isValid,
      isSubmitting: form.formState.isSubmitting,
      isLoading: isLoadingDefaults,
      submitCount: form.formState.submitCount,
      errors: form.formState.errors,
      touchedFields: form.formState.touchedFields,
      dirtyFields: form.formState.dirtyFields,
      isSubmitted: form.formState.isSubmitted,
      isSubmitSuccessful: form.formState.isSubmitSuccessful,
      isValidating: form.formState.isValidating,
      isLoaded: !isLoadingDefaults,
      disabled: false
    }), [
      form.formState.isDirty,
      form.formState.isValid,
      form.formState.isSubmitting,
      form.formState.submitCount,
      form.formState.errors,
      form.formState.touchedFields,
      form.formState.dirtyFields,
      form.formState.isSubmitted,
      form.formState.isSubmitSuccessful,
      form.formState.isValidating,
      isLoadingDefaults
    ]);

    // Handle form submission
    const handleSubmit = useCallback(
      (onValid: (values: TSchemaInput) => Promise<void> | void) => {
        return form.handleSubmit(async (data) => {
          try {
            await onValid(data);
          } catch (error) {
            console.error('[RHF] Submit error:', error);
            
            // Handle server validation errors
            if (error && typeof error === 'object' && 'errors' in error) {
              const serverErrors = error.errors as Record<string, string>;
              Object.entries(serverErrors).forEach(([field, message]) => {
                form.setError(field as FieldPath<TSchemaInput>, {
                  type: 'server',
                  message
                });
              });
            }
            
            throw error;
          }
        });
      },
      [form]
    );

    // Set field error
    const setError = useCallback(
      (path: string, message: string) => {
        form.setError(path as FieldPath<TSchemaInput>, {
          type: 'manual',
          message
        });
      },
      [form]
    );

    // Set multiple errors
    const setErrors = useCallback(
      (errors: Record<string, string>) => {
        Object.entries(errors).forEach(([path, message]) => {
          setError(path, message);
        });
      },
      [setError]
    );

    // Clear all errors
    const clearErrors = useCallback(() => {
      form.clearErrors();
    }, [form]);

    // Reset form
    const reset = useCallback(
      (values?: Partial<TSchemaInput>) => {
        form.reset(values as DefaultValues<TSchemaInput>);
      },
      [form]
    );

    // Get values
    const getValues = useCallback(() => {
      return form.getValues();
    }, [form]);

    // Set values
    const setValues = useCallback(
      (values: Partial<TSchemaInput>) => {
        Object.entries(values).forEach(([key, value]) => {
          form.setValue(key as FieldPath<TSchemaInput>, value, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true
          });
        });
      },
      [form]
    );

    // Trigger validation
    const trigger = useCallback(
      async (fieldNames?: string | string[]) => {
        if (fieldNames) {
          const fields = Array.isArray(fieldNames) ? fieldNames : [fieldNames];
          return await form.trigger(fields as FieldPath<TSchemaInput>[]);
        }
        return await form.trigger();
      },
      [form]
    );

    // Watch values
    const watch = useCallback(
      (fieldNames?: string | string[]) => {
        if (fieldNames) {
          return form.watch(fieldNames as FieldPath<TSchemaInput> | FieldPath<TSchemaInput>[]);
        }
        return form.watch();
      },
      [form]
    );

    // Subscribe to changes (implemented via useEffect in components)
    const subscribe = useCallback(
      (callback: (state: FormState) => void) => {
        // This is a placeholder - actual subscription should be done in components
        // using useEffect to watch form.formState
        console.warn('[RHF] Subscribe should be implemented in component using useEffect');
        return () => {};
      },
      []
    );

    // Form Provider component
    const Provider = useCallback(
      ({ children }: { children: React.ReactNode }) => {
        return React.createElement(FormProvider, { ...form }, children);
      },
      [form]
    );

    return {
      Provider,
      api,
      handleSubmit,
      setError,
      setErrors,
      clearErrors,
      reset,
      getValues,
      setValues,
      trigger,
      formState,
      watch,
      subscribe
    };
  }
}

/**
 * Create a React Hook Form adapter instance
 */
export const createReactHookFormAdapter = <TData extends FieldValues = FieldValues>(): ReactHookFormAdapter<TData> => {
  return new ReactHookFormAdapter<TData>();
};

/**
 * Default React Hook Form adapter instance
 */
export const reactHookFormAdapter = createReactHookFormAdapter();

/**
 * Utility hook for using React Hook Form with Zod schema
 */
export const useRHFWithZod = <TData extends FieldValues = FieldValues>(
  schema: z.ZodType<TData, any, any>,
  defaultValues?: DefaultValues<TData>,
  options?: Omit<UseFormProps<TData>, 'resolver' | 'defaultValues'>
) => {
  const adapter = useMemo(() => createReactHookFormAdapter<TData>(), []);
  
  return adapter.useCreate({
    schema,
    defaultValues,
    formOptions: options
  });
};

/**
 * Type-safe form creation with automatic schema inference
 */
export const createTypedRHFAdapter = <TSchema extends z.ZodType<any, any, any>>(
  schema: TSchema
) => {
  type SchemaType = z.infer<TSchema>;
  
  return {
    create: (
      defaultValues?: DefaultValues<SchemaType>,
      options?: RHFAdapterConfig<SchemaType>
    ) => {
      const adapter = createReactHookFormAdapter<SchemaType>();
      return adapter.useCreate({
        schema,
        defaultValues,
        ...options
      });
    }
  };
};

export default ReactHookFormAdapter;
