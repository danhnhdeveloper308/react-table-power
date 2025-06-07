import { DialogMode } from '../types';
import { getFormValues, checkFormValidity, getFormErrors, setFormErrors } from './formHelpers';
import { extractValidationErrors, transformFormData } from './typeConversion';
import { DialogType } from '../types';

/**
 * Create a form submission handler that adapts between different function signatures
 * This helps with TypeScript errors when functions expect different parameter counts
 * 
 * @param handler The original submission handler function
 * @returns A wrapped function that works with various parameter patterns
 */
export function createSubmitHandler(
  handler?: (data: any, type?: DialogType) => Promise<boolean> | boolean | void | Promise<void>
): (data: any) => Promise<boolean> {
  if (!handler) {
    // Return a default handler if none provided
    return async () => true;
  }
  
  return async (data: any): Promise<boolean> => {
    if (!handler) return true;
    
    try {
      // Call the handler with just the data parameter
      const result = await handler(data);
      
      // Ensure we return a boolean
      if (typeof result === 'boolean') {
        return result;
      }
      
      // If the handler returned void or Promise<void>, assume success
      return true;
    } catch (error) {
      console.error('Error in submit handler:', error);
      return false;
    }
  };
}

/**
 * Ensure a callback is always a function, never undefined
 * 
 * @param callback The original callback, which might be undefined
 * @returns A guaranteed function
 */
export function ensureCallback<T extends (...args: any[]) => any>(
  callback?: T
): T {
  if (callback) return callback;
  
  // Return an empty function with the same signature
  return ((..._args: any[]): any => undefined) as T;
}

export type FormRef = React.MutableRefObject<any>;

export interface FormValidationResult {
  isValid: boolean;
  data: Record<string, any> | null;
  errors: Record<string, any>;
}

/**
 * Validate form and get data with comprehensive error handling
 */
export async function validateAndGetFormData(formRef: FormRef): Promise<FormValidationResult> {
  const result: FormValidationResult = {
    isValid: false,
    data: null,
    errors: {}
  };
  
  if (!formRef?.current) {
    result.errors.form = 'Form not initialized';
    return result;
  }
  
  try {
    // Method 1: React Hook Form style
    if (typeof formRef.current.handleSubmit === 'function' && typeof formRef.current.getValues === 'function') {
      try {
        // Use a promise to capture the validation result
        const validatePromise = new Promise<Record<string, any>>((resolve, reject) => {
          formRef.current.handleSubmit(
            (data: Record<string, any>) => resolve(data),
            (errors: Record<string, any>) => reject({ errors })
          )();
        });
        
        // Wait for validation result
        result.data = await validatePromise;
        result.isValid = true;
        return result;
      } catch (error: any) {
        // Extract validation errors
        if (error && typeof error === 'object' && error.errors) {
          result.errors = error.errors;
        } else {
          result.errors = getFormErrors(formRef);
        }
        
        // Special case: if no validation errors were returned, but the form has data,
        // we might still be able to proceed - this helps with empty forms with no validation rules
        if (Object.keys(result.errors).length === 0) {
          const values = formRef.current.getValues();
          if (values && Object.keys(values).length > 0) {
            result.data = values;
            result.isValid = true;
          }
        }
        
        return result;
      }
    }
    
    // Method 2: Formik style
    if (typeof formRef.current.validateForm === 'function') {
      try {
        const errors = await formRef.current.validateForm();
        result.isValid = !errors || Object.keys(errors).length === 0;
        
        if (result.isValid) {
          result.data = formRef.current.values || {};
        } else {
          result.errors = errors || {};
        }
        
        // Special case: Empty form with no validation rules
        if (!result.isValid && Object.keys(result.errors).length === 0) {
          result.data = formRef.current.values || {};
          result.isValid = true;
        }
        
        return result;
      } catch (error) {
        console.error('Formik validation error:', error);
        result.errors = formRef.current.errors || {};
        return result;
      }
    }
    
    // Method 3: Custom getValidatedValues method
    if (typeof formRef.current.getValidatedValues === 'function') {
      try {
        result.data = await formRef.current.getValidatedValues();
        result.isValid = true;
        return result;
      } catch (error) {
        console.error('Custom validation error:', error);
        
        if (error && typeof error === 'object') {
          result.errors = extractValidationErrors(error);
        } else {
          result.errors.form = 'Validation failed';
        }
        
        return result;
      }
    }
    
    // Method 4: Simplest approach - check validity then get values
    result.isValid = await checkFormValidity(formRef);
    result.errors = getFormErrors(formRef);
    
    // If valid or no errors, get the data
    if (result.isValid || Object.keys(result.errors).length === 0) {
      result.data = getFormValues(formRef) || {};
      result.isValid = true;
    }
    
    return result;
  } catch (error) {
    console.error('Error validating form:', error);
    result.errors.form = error instanceof Error ? error.message : 'Validation failed';
    return result;
  }
}

/**
 * Handle form submission with external validation
 */
export async function handleFormSubmission(
  formRef: FormRef,
  onSubmit: (data: Record<string, any>) => Promise<boolean> | boolean,
  onError?: (errors: Record<string, any>) => void
): Promise<boolean> {
  try {
    console.log("Starting form validation");
    // Validate and get form data
    const validation = await validateAndGetFormData(formRef);
    console.log("Validation result:", validation);
    
    // Special case: If validation failed but no specific errors were returned,
    // but we have form data, try to proceed (often happens with empty forms)
    if (!validation.isValid && Object.keys(validation.errors).length === 0 && validation.data) {
      console.log("Validation 'failed' but we have data and no specific errors - continuing");
      validation.isValid = true;
    }
    
    if (!validation.isValid || !validation.data) {
      console.log("Validation failed, errors:", validation.errors);
      // Set errors on form
      if (Object.keys(validation.errors).length > 0) {
        setFormErrors(formRef, validation.errors);
        onError?.(validation.errors);
      } else {
        // If no specific errors but validation failed, add a generic error
        const genericError = { form: 'Form validation failed. Please check your input.' };
        setFormErrors(formRef, genericError);
        onError?.(genericError);
      }
      return false;
    }
    
    // Skip submission for empty form data on create operations
    if (Object.keys(validation.data).length === 0) {
      const emptyDataError = { form: 'Please fill out the form before submitting.' };
      setFormErrors(formRef, emptyDataError);
      onError?.(emptyDataError);
      return false;
    }
    
    console.log("Form data valid, submitting:", validation.data);
    // Submit the validated data
    const result = await onSubmit(validation.data);
    return result === true;
  } catch (error) {
    console.error('Error in form submission:', error);
    
    // Try to extract and set validation errors from the error
    const errors = extractValidationErrors(error);
    if (Object.keys(errors).length > 0) {
      setFormErrors(formRef, errors);
      onError?.(errors);
    } else {
      const genericError = { form: error instanceof Error ? error.message : 'Submission failed' };
      setFormErrors(formRef, genericError);
      onError?.(genericError);
    }
    
    return false;
  }
}

/**
 * Reset form to initial state
 */
export function resetForm(formRef: FormRef, initialData?: Record<string, any>): void {
  if (!formRef?.current) return;
  
  const form = formRef.current;
  
  try {
    // React Hook Form
    if (form.reset && typeof form.reset === 'function') {
      form.reset(initialData);
      return;
    }
    
    // Formik
    if (form.resetForm && typeof form.resetForm === 'function') {
      form.resetForm({ values: initialData });
      return;
    }
    
    // Final Form
    if (form.reset && typeof form.reset === 'function') {
      form.reset(initialData);
      return;
    }
    
    // Custom form with reset method
    if (form.reset && typeof form.reset === 'function') {
      form.reset(initialData);
      return;
    }
  } catch (error) {
    console.error('Error resetting form:', error);
  }
}

/**
 * Set form values
 */
export function setFormValues(formRef: FormRef, values: Record<string, any>): void {
  if (!formRef?.current || !values) return;
  
  const form = formRef.current;
  
  try {
    // React Hook Form
    if (form.reset && typeof form.reset === 'function') {
      form.reset(values);
      return;
    }
    
    // Formik
    if (form.setValues && typeof form.setValues === 'function') {
      form.setValues(values);
      return;
    }
    
    // Final Form
    if (form.change && typeof form.change === 'function') {
      Object.entries(values).forEach(([field, value]) => {
        form.change(field, value);
      });
      return;
    }
    
    // Custom form with setValues method
    if (form.setValues && typeof form.setValues === 'function') {
      form.setValues(values);
      return;
    }
  } catch (error) {
    console.error('Error setting form values:', error);
  }
}
