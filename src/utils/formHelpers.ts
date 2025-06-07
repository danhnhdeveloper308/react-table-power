import { extractValidationErrors } from './typeConversion';

export type FormRef = React.MutableRefObject<any>;

/**
 * Get form errors from various form libraries
 */
export function getFormErrors(formRef: FormRef): Record<string, any> {
  if (!formRef?.current) return {};
  
  const form = formRef.current;
  
  // React Hook Form
  if (form.formState?.errors) {
    return extractValidationErrors(form.formState.errors);
  }
  
  // Formik
  if (form.errors) {
    return extractValidationErrors(form.errors);
  }
  
  // Final Form
  if (form.getState && typeof form.getState === 'function') {
    const state = form.getState();
    if (state.errors) {
      return extractValidationErrors(state.errors);
    }
  }
  
  // Custom form with errors property
  if (form.errors) {
    return extractValidationErrors(form.errors);
  }
  
  return {};
}

/**
 * Get form values from various form libraries
 */
export function getFormValues(formRef: FormRef): Record<string, any> | null {
  if (!formRef?.current) return null;
  
  const form = formRef.current;
  
  // React Hook Form
  if (form.getValues && typeof form.getValues === 'function') {
    return form.getValues();
  }
  
  // Formik
  if (form.values) {
    return form.values;
  }
  
  // Final Form
  if (form.getState && typeof form.getState === 'function') {
    const state = form.getState();
    return state.values || {};
  }
  
  // Custom form with getValues method
  if (form.getValues && typeof form.getValues === 'function') {
    return form.getValues();
  }
  
  // Custom form with values property
  if (form.values) {
    return form.values;
  }
  
  return null;
}

/**
 * Check form validity across different form libraries
 */
export async function checkFormValidity(formRef: FormRef): Promise<boolean> {
  if (!formRef?.current) return true;
  
  const form = formRef.current;
  
  try {
    // React Hook Form
    if (form.trigger && typeof form.trigger === 'function') {
      return await form.trigger();
    }
    
    // Formik
    if (form.validateForm && typeof form.validateForm === 'function') {
      const errors = await form.validateForm();
      return !errors || Object.keys(errors).length === 0;
    }
    
    // Final Form
    if (form.getState && typeof form.getState === 'function') {
      const state = form.getState();
      return !state.hasValidationErrors;
    }
    
    // Custom form with validate method
    if (form.validate && typeof form.validate === 'function') {
      const result = await form.validate();
      return result === true || (result && Object.keys(result).length === 0);
    }
    
    // Check if form has errors
    const errors = getFormErrors(formRef);
    return Object.keys(errors).length === 0;
  } catch (error) {
    console.error('Error checking form validity:', error);
    return false;
  }
}

/**
 * Set form errors for various form libraries
 */
export function setFormErrors(formRef: FormRef, errors: Record<string, any>): void {
  if (!formRef?.current || !errors) return;
  
  const form = formRef.current;
  
  try {
    // React Hook Form
    if (form.setError && typeof form.setError === 'function') {
      Object.entries(errors).forEach(([field, message]) => {
        form.setError(field, { type: 'manual', message: String(message) });
      });
      return;
    }
    
    // Formik
    if (form.setErrors && typeof form.setErrors === 'function') {
      form.setErrors(errors);
      return;
    }
    
    // Final Form
    if (form.change && typeof form.change === 'function') {
      // Final Form doesn't have direct error setting, but we can trigger validation
      Object.keys(errors).forEach(field => {
        const currentValue = form.getState().values[field];
        form.change(field, currentValue); // This will trigger validation
      });
      return;
    }
    
    // Custom form with setErrors method
    if (form.setErrors && typeof form.setErrors === 'function') {
      form.setErrors(errors);
      return;
    }
  } catch (error) {
    console.error('Error setting form errors:', error);
  }
}

/**
 * Submit form programmatically
 */
export async function submitForm(formRef: FormRef): Promise<Record<string, any> | null> {
  if (!formRef?.current) return null;
  
  const form = formRef.current;
  
  try {
    // React Hook Form
    if (form.handleSubmit && typeof form.handleSubmit === 'function') {
      // For RHF, we need to call handleSubmit with a callback
      return new Promise((resolve) => {
        form.handleSubmit((data: any) => {
          resolve(data);
        })();
      });
    }
    
    // Formik
    if (form.submitForm && typeof form.submitForm === 'function') {
      await form.submitForm();
      return form.values;
    }
    
    // Final Form
    if (form.submit && typeof form.submit === 'function') {
      await form.submit();
      return form.getState().values;
    }
    
    // Custom form with submit method
    if (form.submit && typeof form.submit === 'function') {
      const result = await form.submit();
      return result || getFormValues(formRef);
    }
    
    // Fallback: just return current values
    return getFormValues(formRef);
  } catch (error) {
    console.error('Error submitting form:', error);
    return null;
  }
}
