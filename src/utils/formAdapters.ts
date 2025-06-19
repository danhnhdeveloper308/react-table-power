import { FormRef } from '../contexts/FormHandlingContext';
import { DialogMode } from '../types';

/**
 * Form adapter interface to standardize interactions with different form libraries
 */
export interface FormAdapter {
  /**
   * Get form values without validation
   */
  getValues: () => Record<string, any> | null;
  
  /**
   * Validate form and return errors if any
   */
  validate: () => Promise<Record<string, any>>;
  
  /**
   * Get validated form values (throws if validation fails)
   */
  getValidatedValues: () => Promise<Record<string, any>>;
  
  /**
   * Reset form to initial values or new values
   */
  reset: (values?: Record<string, any>) => void;
  
  /**
   * Submit form programmatically
   */
  submit: () => Promise<boolean>;
  
  /**
   * Set form values programmatically
   */
  setValues: (values: Record<string, any>) => void;
  
  /**
   * Set form errors programmatically
   */
  setErrors: (errors: Record<string, any>) => void;
  
  /**
   * Clear all form errors
   */
  clearErrors: () => void;
  
  /**
   * Get current form errors
   */
  getErrors: () => Record<string, any>;
  
  /**
   * Check if form is dirty (has changes)
   */
  isDirty: () => boolean;
  
  /**
   * Check if form is currently submitting
   */
  isSubmitting: () => boolean;
  
  /**
   * Check if form is valid
   */
  isValid: () => boolean;
}

/**
 * Create an adapter for React Hook Form
 */
export function createReactHookFormAdapter(formRef: FormRef): FormAdapter {
  return {
    getValues: () => {
      if (!formRef.current || typeof formRef.current.getValues !== 'function') return null;
      return formRef.current.getValues();
    },
    
    validate: async () => {
      if (!formRef.current) return {};
      
      try {
        const isValid = typeof formRef.current.trigger === 'function' 
          ? await formRef.current.trigger() 
          : false;
          
        if (!isValid && formRef.current.formState?.errors) {
          return formRef.current.formState.errors;
        }
        return {};
      } catch (err) {
        console.error('[FormAdapter] RHF validation error:', err);
        return typeof err === 'object' && err !== null && 'errors' in err
          ? (err as any).errors || {}
          : {};
      }
    },
    
    getValidatedValues: async () => {
      if (!formRef.current || typeof formRef.current.trigger !== 'function') {
        throw new Error('Form reference is invalid or missing trigger method');
      }
      
      const isValid = await formRef.current.trigger();
      if (!isValid) {
        throw { errors: formRef.current.formState?.errors || {} };
      }
      
      return formRef.current.getValues();
    },
    
    reset: (values?: Record<string, any>) => {
      if (!formRef.current || typeof formRef.current.reset !== 'function') return;
      formRef.current.reset(values);
    },
    
    submit: async () => {
      if (!formRef.current) return false;
      
      try {
        if (typeof formRef.current.handleSubmit === 'function') {
          // Need to create dummy submit function that returns true
          const dummySubmit = () => true;
          await formRef.current.handleSubmit(dummySubmit)();
          return true;
        }
        return false;
      } catch (err) {
        console.error('[FormAdapter] RHF submit error:', err);
        return false;
      }
    },
    
    setValues: (values: Record<string, any>) => {
      if (!formRef.current) return;
      
      if (typeof formRef.current.reset === 'function') {
        formRef.current.reset(values);
      } else if (typeof formRef.current.setValues === 'function') {
        formRef.current.setValues(values);
      }
    },
    
    setErrors: (errors: Record<string, any>) => {
      if (!formRef.current || typeof formRef.current.setError !== 'function') return;
      
      Object.entries(errors).forEach(([field, error]) => {
        const errorMessage = typeof error === 'string' 
          ? error 
          : error && typeof error === 'object' && 'message' in error
            ? (error as any).message
            : 'Invalid field';
            
        formRef.current.setError(field, {
          type: 'manual',
          message: errorMessage
        });
      });
    },
    
    clearErrors: () => {
      if (!formRef.current || typeof formRef.current.clearErrors !== 'function') return;
      formRef.current.clearErrors();
    },
    
    getErrors: () => {
      if (!formRef.current || !formRef.current.formState) return {};
      return formRef.current.formState.errors || {};
    },
    
    isDirty: () => {
      if (!formRef.current || !formRef.current.formState) return false;
      return !!formRef.current.formState.isDirty;
    },
    
    isSubmitting: () => {
      if (!formRef.current || !formRef.current.formState) return false;
      return !!formRef.current.formState.isSubmitting;
    },
    
    isValid: () => {
      if (!formRef.current || !formRef.current.formState) return false;
      return !!formRef.current.formState.isValid;
    }
  };
}

/**
 * Create an adapter for Formik
 */
export function createFormikAdapter(formRef: FormRef): FormAdapter {
  return {
    getValues: () => {
      if (!formRef.current) return null;
      return formRef.current.values || {};
    },
    
    validate: async () => {
      if (!formRef.current || typeof formRef.current.validateForm !== 'function') return {};
      
      try {
        return await formRef.current.validateForm();
      } catch (err) {
        console.error('[FormAdapter] Formik validation error:', err);
        return {};
      }
    },
    
    getValidatedValues: async () => {
      if (!formRef.current || typeof formRef.current.validateForm !== 'function') {
        throw new Error('Form reference is invalid or missing validateForm method');
      }
      
      const errors = await formRef.current.validateForm();
      if (errors && Object.keys(errors).length > 0) {
        throw { errors };
      }
      
      return formRef.current.values || {};
    },
    
    reset: (values?: Record<string, any>) => {
      if (!formRef.current || typeof formRef.current.resetForm !== 'function') return;
      
      formRef.current.resetForm({
        values: values || formRef.current.initialValues
      });
    },
    
    submit: async () => {
      if (!formRef.current || typeof formRef.current.submitForm !== 'function') return false;
      
      try {
        await formRef.current.submitForm();
        return true;
      } catch (err) {
        console.error('[FormAdapter] Formik submit error:', err);
        return false;
      }
    },
    
    setValues: (values: Record<string, any>) => {
      if (!formRef.current || typeof formRef.current.setValues !== 'function') return;
      formRef.current.setValues(values);
    },
    
    setErrors: (errors: Record<string, any>) => {
      if (!formRef.current || typeof formRef.current.setErrors !== 'function') return;
      formRef.current.setErrors(errors);
    },
    
    clearErrors: () => {
      if (!formRef.current || typeof formRef.current.setErrors !== 'function') return;
      formRef.current.setErrors({});
    },
    
    getErrors: () => {
      if (!formRef.current) return {};
      return formRef.current.errors || {};
    },
    
    isDirty: () => {
      if (!formRef.current) return false;
      return !!formRef.current.dirty;
    },
    
    isSubmitting: () => {
      if (!formRef.current) return false;
      return !!formRef.current.isSubmitting;
    },
    
    isValid: () => {
      if (!formRef.current) return false;
      
      // Check if errors object is empty
      const errors = formRef.current.errors || {};
      return Object.keys(errors).length === 0;
    }
  };
}

/**
 * Create a generic adapter for a form with basic methods
 */
export function createGenericFormAdapter(formRef: FormRef): FormAdapter {
  return {
    getValues: () => {
      if (!formRef.current) return null;
      
      if (typeof formRef.current.getValues === 'function') {
        return formRef.current.getValues();
      }
      
      if (formRef.current.values) {
        return formRef.current.values;
      }
      
      return null;
    },
    
    validate: async () => {
      if (!formRef.current) return {};
      
      try {
        if (typeof formRef.current.validate === 'function') {
          return await formRef.current.validate();
        }
        
        if (typeof formRef.current.validateForm === 'function') {
          return await formRef.current.validateForm();
        }
        
        if (typeof formRef.current.trigger === 'function') {
          const isValid = await formRef.current.trigger();
          return isValid ? {} : (formRef.current.formState?.errors || {});
        }
        
        return {};
      } catch (err) {
        return {};
      }
    },
    
    getValidatedValues: async () => {
      if (!formRef.current) {
        throw new Error('Form reference is null or undefined');
      }
      
      // Try to get validated values using the most appropriate method
      if (typeof formRef.current.getValidatedValues === 'function') {
        return await formRef.current.getValidatedValues();
      }
      
      // Try React Hook Form validation
      if (typeof formRef.current.trigger === 'function') {
        const isValid = await formRef.current.trigger();
        if (!isValid) {
          throw { errors: formRef.current.formState?.errors || {} };
        }
        return formRef.current.getValues();
      }
      
      // Try Formik validation
      if (typeof formRef.current.validateForm === 'function') {
        const errors = await formRef.current.validateForm();
        if (errors && Object.keys(errors).length > 0) {
          throw { errors };
        }
        return formRef.current.values;
      }
      
      // Default behavior - just return values without validation
      if (typeof formRef.current.getValues === 'function') {
        return formRef.current.getValues();
      }
      
      if (formRef.current.values) {
        return formRef.current.values;
      }
      
      throw new Error('Form values not available');
    },
    
    reset: (values?: Record<string, any>) => {
      if (!formRef.current) return;
      
      if (typeof formRef.current.reset === 'function') {
        formRef.current.reset(values);
      } else if (typeof formRef.current.resetForm === 'function') {
        formRef.current.resetForm({ values });
      } else if (typeof formRef.current.setValues === 'function') {
        formRef.current.setValues(values || {});
      }
    },
    
    submit: async () => {
      if (!formRef.current) return false;
      
      try {
        if (typeof formRef.current.submit === 'function') {
          await formRef.current.submit();
          return true;
        }
        
        if (typeof formRef.current.submitForm === 'function') {
          await formRef.current.submitForm();
          return true;
        }
        
        if (typeof formRef.current.handleSubmit === 'function') {
          const dummySubmit = () => true;
          await formRef.current.handleSubmit(dummySubmit)();
          return true;
        }
        
        return false;
      } catch (err) {
        console.error('[FormAdapter] submit error:', err);
        return false;
      }
    },
    
    setValues: (values: Record<string, any>) => {
      if (!formRef.current) return;
      
      if (typeof formRef.current.setValues === 'function') {
        formRef.current.setValues(values);
      } else if (typeof formRef.current.reset === 'function') {
        formRef.current.reset(values);
      }
    },
    
    setErrors: (errors: Record<string, any>) => {
      if (!formRef.current) return;
      
      if (typeof formRef.current.setErrors === 'function') {
        formRef.current.setErrors(errors);
      } else if (typeof formRef.current.setError === 'function') {
        Object.entries(errors).forEach(([field, error]) => {
          const errorMessage = typeof error === 'string' 
            ? error 
            : error && typeof error === 'object' && 'message' in error
              ? (error as any).message
              : 'Invalid field';
              
          formRef.current.setError(field, {
            type: 'manual',
            message: errorMessage
          });
        });
      }
    },
    
    clearErrors: () => {
      if (!formRef.current) return;
      
      if (typeof formRef.current.clearErrors === 'function') {
        formRef.current.clearErrors();
      } else if (typeof formRef.current.setErrors === 'function') {
        formRef.current.setErrors({});
      }
    },
    
    getErrors: () => {
      if (!formRef.current) return {};
      
      if (formRef.current.formState?.errors) {
        return formRef.current.formState.errors;
      }
      
      if (formRef.current.errors) {
        return formRef.current.errors;
      }
      
      return {};
    },
    
    isDirty: () => {
      if (!formRef.current) return false;
      
      if (formRef.current.formState?.isDirty !== undefined) {
        return !!formRef.current.formState.isDirty;
      }
      
      if (formRef.current.dirty !== undefined) {
        return !!formRef.current.dirty;
      }
      
      return false;
    },
    
    isSubmitting: () => {
      if (!formRef.current) return false;
      
      if (formRef.current.formState?.isSubmitting !== undefined) {
        return !!formRef.current.formState.isSubmitting;
      }
      
      if (formRef.current.isSubmitting !== undefined) {
        return !!formRef.current.isSubmitting;
      }
      
      return false;
    },
    
    isValid: () => {
      if (!formRef.current) return false;
      
      if (formRef.current.formState?.isValid !== undefined) {
        return !!formRef.current.formState.isValid;
      }
      
      // Check for empty errors object
      const errors = formRef.current.formState?.errors || formRef.current.errors || {};
      return Object.keys(errors).length === 0;
    }
  };
}

/**
 * Detect the form library from the form ref and create the appropriate adapter
 */
export function createFormAdapter(formRef: FormRef): FormAdapter {
  if (!formRef.current) {
    return createGenericFormAdapter(formRef);
  }
  
  // Check for React Hook Form
  if (
    formRef.current.formState !== undefined &&
    typeof formRef.current.control === 'object' &&
    typeof formRef.current.handleSubmit === 'function' &&
    typeof formRef.current.register === 'function'
  ) {
    return createReactHookFormAdapter(formRef);
  }
  
  // Check for Formik
  if (
    typeof formRef.current.values === 'object' &&
    typeof formRef.current.errors === 'object' &&
    typeof formRef.current.handleSubmit === 'function' &&
    typeof formRef.current.setFieldValue === 'function'
  ) {
    return createFormikAdapter(formRef);
  }
  
  // Default to generic adapter
  return createGenericFormAdapter(formRef);
}
