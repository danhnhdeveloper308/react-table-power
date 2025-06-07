import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
// Make sure we import the full DialogMode type
import { DialogMode, BaseTableData } from '../types';
import { getFormErrors as getFormErrorsUtil, getFormValues as getFormValuesUtil, checkFormValidity, setFormErrors as setFormErrorsUtil } from '../utils/formHelpers';

export type FormRef = React.MutableRefObject<any>;

export interface FormHandlingContextType {
  /**
   * Get form validation errors
   */
  getFormErrors: (type?: DialogMode) => Record<string, any>;
  
  /**
   * Check if form is valid - returns promise for async validation
   */
  isFormValid: (type?: DialogMode) => Promise<boolean>;
  
  /**
   * Get current form values
   */
  getFormValues: (type?: DialogMode) => Record<string, any> | null;
  
  /**
   * Register a form with the context
   */
  registerForm: (formRef: FormRef, type: DialogMode) => void;
  
  /**
   * Unregister a form
   */
  unregisterForm: (type: DialogMode) => void;
  
  /**
   * Reset form to initial state
   */
  resetForm: (type?: DialogMode) => void;
  
  /**
   * Submit form programmatically
   */
  submitForm: (type?: DialogMode) => Promise<Record<string, any> | null>;
  
  /**
   * Set form values programmatically
   */
  setFormValues: (values: Record<string, any>, type?: DialogMode) => void;
  
  /**
   * Set form errors programmatically
   */
  setFormErrors: (errors: Record<string, any>, type?: DialogMode) => void;
  
  /**
   * Update form status
   */
  updateFormStatus: (type: DialogMode, status: { 
    isValid?: boolean;
    isDirty?: boolean;
    isSubmitting?: boolean;
  }) => void;
  
  /**
   * Get current registered form ref
   */
  getFormRef: (type?: DialogMode) => FormRef | null;
  
  /**
   * Check if form is dirty (has changes)
   */
  isFormDirty: (type?: DialogMode) => boolean;
  
  /**
   * Check if form is submitting
   */
  isFormSubmitting: (type?: DialogMode) => boolean;

  /**
   * Validate form and get form data if valid
   * Combines validation and data retrieval in one method
   */
  validateAndGetFormData: (type?: DialogMode) => Promise<{
    isValid: boolean;
    data: Record<string, any> | null;
    errors: Record<string, any>;
  }>;

  /**
   * Check if a form is initialized
   */
  isFormInitialized: (type?: DialogMode) => boolean;
  
  /**
   * Clear all form errors
   */
  clearFormErrors: (type?: DialogMode) => void;
}

interface FormRegistryItem {
  formRef: FormRef;
  isValid?: boolean;
  isDirty?: boolean;
  isSubmitting?: boolean;
}

interface FormHandlingProviderProps {
  children: React.ReactNode;
  defaultMode?: DialogMode;
}

const FormHandlingContext = createContext<FormHandlingContextType | null>(null);

/**
 * Provider component for form handling functionality
 */
export const FormHandlingProvider: React.FC<FormHandlingProviderProps> = ({ 
  children,
  defaultMode = 'create' 
}) => {
  const [currentMode, setCurrentMode] = useState<DialogMode>(defaultMode);
  const formRegistry = useRef<Record<DialogMode, FormRegistryItem | undefined>>({
    create: undefined,
    edit: undefined,
    delete: undefined, // Ensure 'delete' is included here
    view: undefined,
    custom: undefined
  });

  // Register a form with the context
  const registerForm = useCallback((formRef: FormRef, type: DialogMode) => {
    formRegistry.current[type] = { formRef, isValid: false, isDirty: false, isSubmitting: false };
    setCurrentMode(type);
  }, []);

  // Unregister a form from the context
  const unregisterForm = useCallback((type: DialogMode) => {
    formRegistry.current[type] = undefined;
  }, []);

  // Get the current form ref based on type
  const getFormRef = useCallback((type?: DialogMode): FormRef | null => {
    const modeToUse = type || currentMode;
    const registration = formRegistry.current[modeToUse];
    return registration?.formRef || null;
  }, [currentMode]);

  // Update form status - moved up before it's used
  const updateFormStatus = useCallback((type: DialogMode, status: {
    isValid?: boolean;
    isDirty?: boolean;
    isSubmitting?: boolean;
  }) => {
    const registration = formRegistry.current[type];
    if (!registration) return;
    
    formRegistry.current[type] = {
      ...registration,
      ...status
    };
  }, []);

  // Get form errors for the specified form type
  const getFormErrors = useCallback((type?: DialogMode): Record<string, any> => {
    const formRef = getFormRef(type);
    if (!formRef) return {};
    
    // Fix: Pass only formRef to getFormErrorsUtil
    return getFormErrorsUtil(formRef);
  }, [getFormRef]);

  // Check if form is valid
  const isFormValid = useCallback(async (type?: DialogMode): Promise<boolean> => {
    const formRef = getFormRef(type);
    if (!formRef) return true; // If no form, consider it valid
    
    try {
      // Fix: Pass only formRef to checkFormValidity
      return await checkFormValidity(formRef);
    } catch (error) {
      console.error('Error checking form validity:', error);
      return false;
    }
  }, [getFormRef]);

  // Get form values
  const getFormValues = useCallback((type?: DialogMode): Record<string, any> | null => {
    const formRef = getFormRef(type);
    if (!formRef) return null;
    
    // Fix: Pass only formRef to getFormValuesUtil
    return getFormValuesUtil(formRef);
  }, [getFormRef]);

  // Reset form to initial state
  const resetForm = useCallback((type?: DialogMode) => {
    const formRef = getFormRef(type);
    if (!formRef || !formRef.current) return;
    
    try {
      // Try using specific reset method based on form library
      if (typeof formRef.current.reset === 'function') {
        formRef.current.reset();
      }
      
      // React Hook Form
      if (typeof formRef.current.resetForm === 'function') {
        formRef.current.resetForm();
      }
      
      // Formik
      if (formRef.current.resetForm) {
        formRef.current.resetForm();
      }
    } catch (error) {
      console.error('Error resetting form:', error);
    }
  }, [getFormRef]);

  // Submit form programmatically
  const submitForm = useCallback(async (type?: DialogMode): Promise<Record<string, any> | null> => {
    const formRef = getFormRef(type);
    if (!formRef || !formRef.current) return null;
    
    try {
      const modeToUse = type || currentMode;
      updateFormStatus(modeToUse, { isSubmitting: true });
      
      // Try various submission methods based on form library
      
      // Custom handleSubmit method
      if (typeof formRef.current.handleSubmit === 'function') {
        await formRef.current.handleSubmit();
        return getFormValues(modeToUse);
      }
      
      // React Hook Form - returns values on success
      if (formRef.current.handleSubmit && typeof formRef.current.getValues === 'function') {
        const onSubmit = (data: Record<string, any>) => data;
        await formRef.current.handleSubmit(onSubmit)();
        return formRef.current.getValues();
      }
      
      // Formik
      if (formRef.current.submitForm && typeof formRef.current.submitForm === 'function') {
        await formRef.current.submitForm();
        return formRef.current.values;
      }
      
      // Native form submission
      if (formRef.current.submit && typeof formRef.current.submit === 'function') {
        formRef.current.submit();
      }
      
      return null;
    } catch (error) {
      console.error('Error submitting form:', error);
      return null;
    } finally {
      const modeToUse = type || currentMode;
      updateFormStatus(modeToUse, { isSubmitting: false });
    }
  }, [getFormRef, currentMode, updateFormStatus, getFormValues]);

  // Set form values programmatically
  const setFormValues = useCallback((values: Record<string, any>, type?: DialogMode) => {
    const formRef = getFormRef(type);
    if (!formRef || !formRef.current) return;
    
    try {
      // Try various methods based on form library
      
      // Custom setValues method
      if (typeof formRef.current.setValues === 'function') {
        formRef.current.setValues(values);
        return;
      }
      
      // React Hook Form
      if (typeof formRef.current.reset === 'function') {
        formRef.current.reset(values);
        return;
      }
      
      // Formik
      if (typeof formRef.current.setValues === 'function') {
        formRef.current.setValues(values);
        return;
      }
    } catch (error) {
      console.error('Error setting form values:', error);
    }
  }, [getFormRef]);

  // Set form errors programmatically
  const setFormErrorsCallback = useCallback((errors: Record<string, any>, type?: DialogMode) => {
    const formRef = getFormRef(type);
    if (!formRef) return;
    
    // Fix: Make sure we're calling with the correct number of arguments
    setFormErrorsUtil(formRef, errors);
  }, [getFormRef]);

  // Check if form is dirty (has changes)
  const isFormDirty = useCallback((type?: DialogMode): boolean => {
    const modeToUse = type || currentMode;
    const registration = formRegistry.current[modeToUse];
    
    if (!registration) return false;
    
    // Check if we have an explicit isDirty value
    if (registration.isDirty !== undefined) {
      return registration.isDirty;
    }
    
    // Try to get the value from the form library
    const formRef = registration.formRef;
    if (!formRef || !formRef.current) return false;
    
    // React Hook Form
    if (formRef.current.formState && formRef.current.formState.isDirty !== undefined) {
      return formRef.current.formState.isDirty;
    }
    
    // Formik
    if (formRef.current.dirty !== undefined) {
      return formRef.current.dirty;
    }
    
    return false;
  }, [currentMode]);

  // Check if form is submitting
  const isFormSubmitting = useCallback((type?: DialogMode): boolean => {
    const modeToUse = type || currentMode;
    const registration = formRegistry.current[modeToUse];
    
    if (!registration) return false;
    
    // Check if we have an explicit isSubmitting value
    if (registration.isSubmitting !== undefined) {
      return registration.isSubmitting;
    }
    
    // Try to get the value from the form library
    const formRef = registration.formRef;
    if (!formRef || !formRef.current) return false;
    
    // React Hook Form
    if (formRef.current.formState && formRef.current.formState.isSubmitting !== undefined) {
      return formRef.current.formState.isSubmitting;
    }
    
    // Formik
    if (formRef.current.isSubmitting !== undefined) {
      return formRef.current.isSubmitting;
    }
    
    return false;
  }, [currentMode]);

  // Validate form and get data if valid - combines validation and data retrieval
  const validateAndGetFormData = useCallback(async (type?: DialogMode) => {
    // Special handling for delete operations - always return valid
    if (type === 'delete') { // This comparison should now work correctly
      console.log("Delete operation detected in validateAndGetFormData - bypassing validation");
      return {
        isValid: true,
        data: {} as Record<string, any>,
        errors: {}
      };
    }
    
    const formRef = getFormRef(type);
    const result = {
      isValid: false,
      data: null as Record<string, any> | null,
      errors: {} as Record<string, any>
    };
    
    if (!formRef) {
      console.warn("No form reference found for validation");
      return result;
    }
    
    try {
      if (!formRef.current) {
        console.warn("Form reference exists but current is null");
        return result;
      }
      
      // First try with form's built-in validation methods
      if (typeof formRef.current.getValidatedValues === 'function') {
        try {
          // This is the preferred way - get validated data in one call
          result.data = await formRef.current.getValidatedValues();
          result.isValid = true;
          return result;
        } catch (validationError: any) {
          console.log("Form validation failed using getValidatedValues", validationError);
          // Extract validation errors - ensure we handle undefined values
          if (validationError && typeof validationError === 'object') {
            if (validationError.errors && typeof validationError.errors === 'object') {
              result.errors = validationError.errors;
            } else {
              result.errors = getFormErrorsUtil(formRef);
            }
          } else {
            result.errors = getFormErrorsUtil(formRef);
          }
          return result;
        }
      }
      
      // Try React Hook Form pattern
      if (typeof formRef.current.handleSubmit === 'function' && typeof formRef.current.getValues === 'function') {
        try {
          // Execute validation manually
          const isValid = await new Promise<boolean>(resolve => {
            formRef.current.handleSubmit(() => resolve(true))(() => resolve(false));
          });
          
          result.isValid = isValid;
          
          if (isValid) {
            result.data = formRef.current.getValues();
          } else {
            // Ensure formState exists and has errors property before accessing
            if (formRef.current.formState && typeof formRef.current.formState === 'object') {
              if (formRef.current.formState.errors && typeof formRef.current.formState.errors === 'object') {
                result.errors = formRef.current.formState.errors;
              }
            }
          }
          
          return result;
        } catch (error) {
          console.error("Error using React Hook Form validation", error);
          // Safely access formState.errors with proper type checking
          if (formRef.current.formState && typeof formRef.current.formState === 'object') {
            if (formRef.current.formState.errors && typeof formRef.current.formState.errors === 'object') {
              result.errors = formRef.current.formState.errors;
            }
          }
          return result;
        }
      }
      
      // Try Formik pattern
      if (formRef.current.validateForm && typeof formRef.current.validateForm === 'function') {
        try {
          const errors = await formRef.current.validateForm();
          result.isValid = !errors || Object.keys(errors || {}).length === 0;
          
          if (result.isValid) {
            result.data = formRef.current.values;
          } else {
            // Ensure errors is an object before assigning
            result.errors = errors && typeof errors === 'object' ? errors : {};
          }
          
          return result;
        } catch (error) {
          console.error("Error using Formik validation", error);
          // Safely access errors with proper type checking
          if (formRef.current.errors && typeof formRef.current.errors === 'object') {
            result.errors = formRef.current.errors;
          }
          return result;
        }
      }
      
      // Generic approach - still try to get data even if validation isn't available
      result.errors = getFormErrorsUtil(formRef);
      result.isValid = Object.keys(result.errors).length === 0;
      result.data = getFormValuesUtil(formRef);
      
      // If we have data but no validation method was found, consider it valid
      if (result.data && Object.keys(result.data).length > 0) {
        result.isValid = true;
      }
      
      return result;
    } catch (error) {
      console.error('Error in validateAndGetFormData:', error);
      result.errors = { _error: error instanceof Error ? error.message : 'Unknown validation error' };
      return result;
    }
  }, [getFormRef]);

  // Check if form is initialized
  const isFormInitialized = useCallback((type?: DialogMode): boolean => {
    const formRef = getFormRef(type);
    return !!formRef && !!formRef.current;
  }, [getFormRef]);

  // Clear form errors
  const clearFormErrors = useCallback((type?: DialogMode): void => {
    const formRef = getFormRef(type);
    if (!formRef || !formRef.current) return;
    
    try {
      // Try various methods based on form library
      
      // Custom clearErrors method
      if (typeof formRef.current.clearErrors === 'function') {
        formRef.current.clearErrors();
        return;
      }
      
      // React Hook Form
      if (typeof formRef.current.clearErrors === 'function') {
        formRef.current.clearErrors();
        return;
      }
      
      // Formik
      if (formRef.current.setErrors) {
        formRef.current.setErrors({});
        return;
      }
      
      // Generic approach - set empty object
      setFormErrorsCallback({}, type);
    } catch (error) {
      console.error('Error clearing form errors:', error);
    }
  }, [getFormRef, setFormErrorsCallback]);

  const contextValue = {
    getFormErrors,
    isFormValid,
    getFormValues,
    registerForm,
    unregisterForm,
    resetForm,
    submitForm,
    setFormValues,
    setFormErrors: setFormErrorsCallback,
    updateFormStatus,
    getFormRef,
    isFormDirty,
    isFormSubmitting,
    validateAndGetFormData,
    isFormInitialized,
    clearFormErrors
  };

  return (
    <FormHandlingContext.Provider value={contextValue}>
      {children}
    </FormHandlingContext.Provider>
  );
};

/**
 * Hook to access the form handling context
 * @throws Error if used outside FormHandlingProvider
 */
export const useFormHandling = (): FormHandlingContextType => {
  const context = useContext(FormHandlingContext);

  if (context === null) {
    throw new Error('useFormHandling must be used within a FormHandlingProvider');
  }
  
  return context;
};

/**
 * Safe version of useFormHandling that doesn't throw if outside provider
 * @returns FormHandlingContextType | null
 */
export const useSafeFormHandling = (): FormHandlingContextType | null => {
  return useContext(FormHandlingContext);
};

/**
 * Higher-order component that provides form handling functionality
 * @param Component The component to wrap
 * @param dialogType Optional dialog type to register with the form handling context
 * @returns A new component with form handling props
 */
export function withFormHandling<P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  dialogType?: DialogMode
): React.FC<Omit<P, keyof FormHandlingContextType>> {
  const WithFormHandling: React.FC<Omit<P, keyof FormHandlingContextType>> = (props) => {
    const formHandling = useFormHandling();
    const formRef = React.useRef(null);
    
    // Register form with context if dialogType is provided
    React.useEffect(() => {
      if (dialogType && formRef.current) {
        formHandling.registerForm({ current: formRef.current }, dialogType);
        
        return () => {
          formHandling.unregisterForm(dialogType);
        };
      }
      return undefined;
    }, [formHandling, dialogType]);
    
    return <Component 
      {...(props as P)} 
      {...formHandling} 
      ref={formRef}
    />;
  };
  
  WithFormHandling.displayName = `WithFormHandling(${
    Component.displayName || Component.name || 'Component'
  })${dialogType ? `-${dialogType}` : ''}`;
  
  return WithFormHandling;
}

/**
 * Hook to integrate React Hook Form with the FormHandlingContext
 * @param methods The React Hook Form methods object from useForm()
 * @param type Optional dialog type to register with
 */
export function useReactHookFormAdapter(methods: any, type?: DialogMode) {
  const formHandling = useFormHandling();
  const { control, formState, getValues, handleSubmit, reset, setError, clearErrors } = methods;
  const formRef = React.useRef({ ...methods });
  
  // Update formRef when methods change
  React.useEffect(() => {
    formRef.current = { ...methods };
  }, [methods]);
  
  // Register the form with FormHandlingContext when type changes
  React.useEffect(() => {
    if (type) {
      formHandling.registerForm(formRef, type);
      
      return () => {
        formHandling.unregisterForm(type);
      };
    }
    return undefined;
  }, [formHandling, type]);
  
  // Update form status when form state changes
  React.useEffect(() => {
    if (type && formState) {
      formHandling.updateFormStatus(type, {
        isDirty: formState.isDirty,
        isSubmitting: formState.isSubmitting,
        isValid: !formState.errors || Object.keys(formState.errors).length === 0
      });
    }
  }, [formHandling, formState, type]);
  
  return {
    formRef,
    control,
    formState,
    getValues,
    handleSubmit,
    reset,
    setError,
    clearErrors
  };
}

/**
 * Hook to integrate Formik with the FormHandlingContext
 * @param formikProps The Formik props or instance
 * @param type Optional dialog type to register with
 */
export function useFormikAdapter(formikProps: any, type?: DialogMode) {
  const formHandling = useFormHandling();
  const formRef = React.useRef(formikProps);
  
  // Update formRef when formikProps change
  React.useEffect(() => {
    formRef.current = formikProps;
  }, [formikProps]);
  
  // Register the form with FormHandlingContext
  React.useEffect(() => {
    if (type) {
      formHandling.registerForm(formRef, type);
      
      return () => {
        formHandling.unregisterForm(type);
      };
    }
    return undefined;
  }, [formHandling, type]);
  
  // Update form status when Formik state changes
  React.useEffect(() => {
    if (type) {
      formHandling.updateFormStatus(type, {
        isDirty: formikProps.dirty,
        isSubmitting: formikProps.isSubmitting,
        isValid: !formikProps.errors || Object.keys(formikProps.errors).length === 0
      });
    }
  }, [formHandling, formikProps.dirty, formikProps.isSubmitting, formikProps.errors, type]);
  
  return {
    formRef,
    ...formikProps
  };
}

/**
 * Hook to integrate Final Form with the FormHandlingContext
 * @param formProps The Final Form form instance
 * @param type Optional dialog type to register with
 */
export function useFinalFormAdapter(formProps: any, type?: DialogMode) {
  const formHandling = useFormHandling();
  const formRef = React.useRef(formProps);
  
  // Update formRef when formProps change
  React.useEffect(() => {
    formRef.current = formProps;
  }, [formProps]);
  
  // Register the form with FormHandlingContext
  React.useEffect(() => {
    if (type) {
      formHandling.registerForm(formRef, type);
      
      return () => {
        formHandling.unregisterForm(type);
      };
    }
    return undefined;
  }, [formHandling, type]);
  
  // Update form status when form state changes
  React.useEffect(() => {
    if (type && formProps.form) {
      const state = formProps.form.getState();
      formHandling.updateFormStatus(type, {
        isDirty: state.dirty,
        isSubmitting: state.submitting,
        isValid: !state.hasValidationErrors
      });
    }
  }, [formHandling, formProps, type]);
  
  return {
    formRef,
    ...formProps
  };
}

export default FormHandlingContext;
