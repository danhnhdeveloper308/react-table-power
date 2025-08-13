import { useMemo, useCallback } from 'react';
import { z } from 'zod';
import { DialogFormMode, FormAdapterResult } from '../types/forms';
import { reactHookFormAdapter } from '../adapters';

/**
 * Configuration for form with schema
 */
export interface FormWithSchemaConfig<TSchema extends z.ZodType<any, any, any>> {
  /**
   * Zod schema for validation
   */
  schema: TSchema;
  
  /**
   * Default values for the form
   */
  defaultValues?: Partial<z.infer<TSchema>> | (() => Promise<Partial<z.infer<TSchema>>>);
  
  /**
   * Form mode
   */
  mode?: DialogFormMode;
  
  /**
   * Validation mode
   */
  validationMode?: 'onSubmit' | 'onBlur' | 'onChange' | 'onTouched' | 'all';
  
  /**
   * Re-validation mode
   */
  reValidateMode?: 'onSubmit' | 'onBlur' | 'onChange';
  
  /**
   * Whether to focus first error on validation failure
   */
  shouldFocusError?: boolean;
  
  /**
   * Custom form adapter (defaults to React Hook Form)
   */
  formAdapter?: any;
}

/**
 * Enhanced form result with type safety
 */
export interface FormWithSchemaResult<TSchema extends z.ZodType<any, any, any>> 
  extends FormAdapterResult<z.infer<TSchema>> {
  /**
   * The original schema
   */
  schema: TSchema;
  
  /**
   * Type-safe form data type
   */
  FormData: z.infer<TSchema>;
  
  /**
   * Validate specific fields
   */
  validateFields: (fields: (keyof z.infer<TSchema>)[]) => Promise<boolean>;
  
  /**
   * Set field value with type safety
   */
  setFieldValue: <K extends keyof z.infer<TSchema>>(
    field: K,
    value: z.infer<TSchema>[K]
  ) => void;
  
  /**
   * Get field value with type safety
   */
  getFieldValue: <K extends keyof z.infer<TSchema>>(
    field: K
  ) => z.infer<TSchema>[K] | undefined;
  
  /**
   * Watch specific fields with type safety
   */
  watchFields: <K extends keyof z.infer<TSchema>>(
    fields: K[]
  ) => Partial<Pick<z.infer<TSchema>, K>>;
  
  /**
   * Submit with type-safe callback
   */
  submitWithCallback: (
    callback: (data: z.infer<TSchema>) => Promise<void> | void
  ) => (e?: React.FormEvent) => Promise<void>;
}

/**
 * Hook for creating type-safe forms with Zod schemas
 * Provides full type safety for form data and operations
 * 
 * @example
 * ```tsx
 * const userSchema = z.object({
 *   name: z.string().min(1),
 *   email: z.string().email(),
 *   age: z.number().min(18)
 * });
 * 
 * const form = useFormWithSchema({
 *   schema: userSchema,
 *   defaultValues: { age: 18 },
 *   mode: 'create'
 * });
 * 
 * // Type-safe operations
 * form.setFieldValue('name', 'John'); // ✅ Type-safe
 * form.setFieldValue('name', 123);    // ❌ Type error
 * 
 * const name = form.getFieldValue('name'); // string | undefined
 * ```
 */
export function useFormWithSchema<TSchema extends z.ZodType<any, any, any>>({
  schema,
  defaultValues,
  mode = 'create',
  validationMode = 'onSubmit',
  reValidateMode = 'onChange',
  shouldFocusError = true,
  formAdapter = reactHookFormAdapter
}: FormWithSchemaConfig<TSchema>): FormWithSchemaResult<TSchema> {
  
  type FormData = z.infer<TSchema>;
  
  // Create form adapter result
  const adapterResult = useMemo(() => {
    return formAdapter.useCreate<FormData>({
      schema,
      defaultValues,
      mode,
      validationMode,
      reValidateMode,
      shouldFocusError
    });
  }, [schema, defaultValues, mode, validationMode, reValidateMode, shouldFocusError, formAdapter]);
  
  // Type-safe field validation
  const validateFields = useCallback(async (fields: (keyof FormData)[]): Promise<boolean> => {
    return await adapterResult.trigger(fields as string[]);
  }, [adapterResult]);
  
  // Type-safe field value setter
  const setFieldValue = useCallback(<K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    const currentValues = adapterResult.getValues();
    adapterResult.setValues({
      ...currentValues,
      [field]: value
    });
  }, [adapterResult]);
  
  // Type-safe field value getter
  const getFieldValue = useCallback(<K extends keyof FormData>(
    field: K
  ): FormData[K] | undefined => {
    const values = adapterResult.getValues();
    return values[field];
  }, [adapterResult]);
  
  // Type-safe field watching
  const watchFields = useCallback(<K extends keyof FormData>(
    fields: K[]
  ): Partial<Pick<FormData, K>> => {
    const watchedValues = adapterResult.watch(fields as string[]);
    
    // Convert to type-safe object
    const result: Partial<Pick<FormData, K>> = {};
    fields.forEach((field, index) => {
      if (Array.isArray(watchedValues)) {
        result[field] = watchedValues[index];
      } else if (typeof watchedValues === 'object' && watchedValues !== null) {
        result[field] = watchedValues[field as string];
      }
    });
    
    return result;
  }, [adapterResult]);
  
  // Type-safe submit with callback
  const submitWithCallback = useCallback((
    callback: (data: FormData) => Promise<void> | void
  ) => {
    return adapterResult.handleSubmit(async (data: FormData) => {
      await callback(data);
    });
  }, [adapterResult]);
  
  // Create enhanced result
  const enhancedResult: FormWithSchemaResult<TSchema> = useMemo(() => ({
    ...adapterResult,
    schema,
    FormData: {} as FormData, // Type placeholder
    validateFields,
    setFieldValue,
    getFieldValue,
    watchFields,
    submitWithCallback
  }), [
    adapterResult,
    schema,
    validateFields,
    setFieldValue,
    getFieldValue,
    watchFields,
    submitWithCallback
  ]);
  
  return enhancedResult;
}

/**
 * Create a reusable form hook for a specific schema
 * Useful for creating domain-specific form hooks
 * 
 * @example
 * ```tsx
 * const userSchema = z.object({
 *   name: z.string().min(1),
 *   email: z.string().email()
 * });
 * 
 * const useUserForm = createFormHook(userSchema);
 * 
 * // In component:
 * const userForm = useUserForm({
 *   mode: 'create',
 *   defaultValues: { name: '' }
 * });
 * ```
 */
export function createFormHook<TSchema extends z.ZodType<any, any, any>>(
  schema: TSchema
) {
  return function useSchemaForm(
    config?: Omit<FormWithSchemaConfig<TSchema>, 'schema'>
  ) {
    return useFormWithSchema({
      schema,
      ...config
    });
  };
}

/**
 * Utility for creating typed default values
 * Ensures default values match the schema type
 */
export function createDefaultValues<TSchema extends z.ZodType<any, any, any>>(
  schema: TSchema,
  values: Partial<z.infer<TSchema>>
): Partial<z.infer<TSchema>> {
  // You could add runtime validation here if needed
  return values;
}

/**
 * Utility for creating async default values loader
 * Useful for loading data from APIs
 */
export function createAsyncDefaultValues<TSchema extends z.ZodType<any, any, any>>(
  schema: TSchema,
  loader: () => Promise<Partial<z.infer<TSchema>>>
): () => Promise<Partial<z.infer<TSchema>>> {
  return async () => {
    const values = await loader();
    // You could add runtime validation here if needed
    return values;
  };
}

/**
 * Hook for form with conditional schema
 * Allows changing schema based on conditions
 */
export function useConditionalFormWithSchema<TSchema extends z.ZodType<any, any, any>>(
  getSchema: () => TSchema,
  config: Omit<FormWithSchemaConfig<TSchema>, 'schema'>,
  dependencies: React.DependencyList
) {
  const schema = useMemo(getSchema, dependencies);
  
  return useFormWithSchema({
    schema,
    ...config
  });
}

export default useFormWithSchema;
