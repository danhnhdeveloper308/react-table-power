import { useCallback, useEffect, useRef, useState } from 'react';
import { useFormHandling } from '../contexts/FormHandlingContext';
import { DialogMode } from '../types';

/**
 * Custom hook for integrating any form library with FormHandlingContext
 */
export const useAutoForm = (
  form: any,
  {
    dialogType,
    onFormDirty,
    skipInitialValidation = true,
    onValuesChange,
    onErrorsChange,
    onSubmit,
    domRef
  }: {
    dialogType?: DialogMode;
    onFormDirty?: (isDirty: boolean) => void;
    skipInitialValidation?: boolean;
    onValuesChange?: (values: Record<string, any>) => void;
    onErrorsChange?: (errors: Record<string, any>) => void;
    onSubmit?: (data: any) => void;
    domRef?: React.RefObject<HTMLElement>;
  } = {}
) => {
  // CRITICAL FIX: Use a single registration flag that never causes re-renders
  const registrationStatus = useRef<{
    isRegistered: boolean;
    registeredType: DialogMode | null;
    registeredForm: any;
  }>({
    isRegistered: false,
    registeredType: null,
    registeredForm: null
  });
  
  // Store callback props in refs to prevent unnecessary effect runs
  const callbacksRef = useRef({
    onFormDirty,
    onValuesChange,
    onErrorsChange,
    onSubmit
  });
  
  // CRITICAL FIX: Only update callbacks ref, never trigger re-renders
  callbacksRef.current = {
    onFormDirty,
    onValuesChange,
    onErrorsChange,
    onSubmit
  };
  
  // Access form handling context
  const formHandling = useFormHandling();
  
  // Store dependencies in refs - never update these in useEffect
  const formRef = useRef(form);
  const dialogTypeRef = useRef(dialogType);
  
  // Update refs immediately - no useEffect
  formRef.current = form;
  dialogTypeRef.current = dialogType;
  
  // State for tracking form interaction status
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Use refs instead of state for frequently changing values
  const isDirtyRef = useRef(false);
  const isValidRef = useRef(true);

  // CRITICAL FIX: Create form API once and never recreate
  const formAPIRef = useRef<any>(null);
  
  if (!formAPIRef.current) {
    formAPIRef.current = {
      getValues: () => {
        const currentForm = formRef.current;
        if (!currentForm) return {};
        
        try {
          if (typeof currentForm.getValues === 'function') {
            return currentForm.getValues();
          }
          if (currentForm.values) {
            return currentForm.values;
          }
          return {};
        } catch (error) {
          console.error('[useAutoForm] Error getting form values:', error);
          return {};
        }
      },
      
      isDirty: () => isDirtyRef.current,
      isValid: () => isValidRef.current,
      
      validate: async () => {
        const currentForm = formRef.current;
        if (!currentForm) return false;
        
        try {
          if (typeof currentForm.trigger === 'function') {
            return await currentForm.trigger();
          }
          if (typeof currentForm.validateForm === 'function') {
            const errors = await currentForm.validateForm();
            return !errors || Object.keys(errors).length === 0;
          }
          return isValidRef.current;
        } catch (error) {
          console.error('[useAutoForm] Validation error:', error);
          return false;
        }
      },
      
      getValidatedValues: async () => {
        const currentForm = formRef.current;
        if (!currentForm) return {};
        
        try {
          if (typeof currentForm.trigger === 'function') {
            const isValid = await currentForm.trigger();
            if (!isValid) throw new Error('Form validation failed');
          } else if (typeof currentForm.validateForm === 'function') {
            const errors = await currentForm.validateForm();
            if (errors && Object.keys(errors).length > 0) {
              throw new Error('Form validation failed');
            }
          }
          
          if (typeof currentForm.getValues === 'function') {
            return currentForm.getValues();
          }
          if (currentForm.values) {
            return currentForm.values;
          }
          return {};
        } catch (error) {
          console.error('[useAutoForm] Error in getValidatedValues:', error);
          throw error;
        }
      },
      
      getErrors: () => {
        const currentForm = formRef.current;
        if (!currentForm) return {};
        
        try {
          if (currentForm.formState?.errors) {
            return currentForm.formState.errors;
          }
          if (currentForm.errors) {
            return currentForm.errors;
          }
          return {};
        } catch (error) {
          console.error('[useAutoForm] Error getting form errors:', error);
          return {};
        }
      },
      
      reset: (values?: Record<string, any>) => {
        const currentForm = formRef.current;
        if (!currentForm?.reset) return;
        
        try {
          // CRITICAL FIX: Only reset when explicitly called with values or when needed
          // Don't automatically reset on errors
          currentForm.reset(values);
        } catch (error) {
          console.error('[useAutoForm] Error resetting form:', error);
        }
      },

      submit: async () => {
        const currentForm = formRef.current;
        if (!currentForm) return false;
        
        try {
          if (typeof currentForm.handleSubmit === 'function') {
            await currentForm.handleSubmit();
            return true;
          } 
          if (typeof currentForm.submitForm === 'function') {
            await currentForm.submitForm();
            return true;
          }
          
          return false;
        } catch (error) {
          console.error('[useAutoForm] Error submitting form:', error);
          return false;
        }
      }
    };
  }

  // CRITICAL FIX: Single registration effect with proper cleanup
  useEffect(() => {
    if (!formHandling || !dialogType || !form) return;
    
    const status = registrationStatus.current;
    
    // Skip if already registered with same parameters
    if (status.isRegistered && 
        status.registeredType === dialogType && 
        status.registeredForm === form) {
      return;
    }
    
    // Unregister previous if different
    if (status.isRegistered && status.registeredType && status.registeredType !== dialogType) {
      try {
        formHandling.unregisterForm(status.registeredType);
      } catch (error) {
        console.error(`[useAutoForm] Error unregistering previous form:`, error);
      }
    }
    
    // Register new form
    try {
      console.log(`[useAutoForm] Registering form for ${dialogType}`);
      formHandling.registerForm(dialogType, formAPIRef.current);
      
      // Update registration status
      status.isRegistered = true;
      status.registeredType = dialogType;
      status.registeredForm = form;
      
      console.log(`[useAutoForm] Successfully registered form for ${dialogType}`);
    } catch (error) {
      console.error(`[useAutoForm] Error registering form for ${dialogType}:`, error);
    }
    
    // Cleanup function
    return () => {
      if (status.isRegistered && status.registeredType) {
        try {
          console.log(`[useAutoForm] Unregistering form for ${status.registeredType}`);
          formHandling.unregisterForm(status.registeredType);
          
          // Reset registration status
          status.isRegistered = false;
          status.registeredType = null;
          status.registeredForm = null;
        } catch (error) {
          console.error(`[useAutoForm] Error unregistering form:`, error);
        }
      }
    };
  }, [formHandling, dialogType, form]); // Keep minimal dependencies

  // Return stable values
  return {
    isDirty: isDirtyRef.current,
    isValid: isValidRef.current,
    hasInteracted,
    markInteracted: useCallback(() => setHasInteracted(true), []),
    getValues: formAPIRef.current.getValues,
    reset: useCallback((values?: Record<string, any>) => {
      // CRITICAL FIX: Only reset form when explicitly requested
      // This prevents accidental resets during error handling
      if (values !== undefined) {
        formAPIRef.current.reset(values);
        setHasInteracted(false);
        isDirtyRef.current = false;
      } else {
        // If called without values, only reset interaction state
        setHasInteracted(false);
        isDirtyRef.current = false;
      }
    }, []),
    validate: formAPIRef.current.validate,
    submit: useCallback(async () => {
      setHasInteracted(true);
      const callback = callbacksRef.current.onSubmit;
      if (callback) {
        const values = formAPIRef.current.getValues();
        callback(values);
      }
      return true;
    }, []),
    domRef: domRef || useRef<HTMLElement | null>(null),
  };
};
