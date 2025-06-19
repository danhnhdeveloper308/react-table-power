import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode, useRef, useEffect } from 'react';
import { DialogMode } from '../types';

// Add FormRef type definition
export type FormRef = React.RefObject<any>;

// Form API interface - Ensure getValues is explicitly a function type
interface FormAPI {
  getValues: () => Record<string, any>;
  getValidatedValues: () => Promise<Record<string, any>>;
  reset: (values?: Record<string, any>) => void;
  validate: () => Promise<boolean>;
  isDirty: () => boolean;
  isValid: () => boolean;
  getErrors: () => Record<string, any>;
  setError?: (field: string, message: string) => void;
  submit?: () => Promise<boolean>;
}

// Form state interface
interface FormState {
  isValid: boolean;
  isDirty: boolean;
  errors: Record<string, any>;
}

// Context interface
export interface FormHandlingContextType {
  // Form registration
  registerForm: (type: DialogMode, api: FormAPI) => void;
  unregisterForm: (type: DialogMode) => void;
  
  // Form state getters
  isFormDirty: (type: DialogMode) => boolean;
  isFormValid: (type: DialogMode) => boolean;
  getFormValues: (type: DialogMode) => Record<string, any>;
  getFormErrors: (type: DialogMode) => Record<string, any>;
  
  // Form state setters
  setFormDirty: (isDirty: boolean, type: DialogMode) => void;
  setFormValid: (isValid: boolean, type: DialogMode) => void;
  setFormErrors: (errors: Record<string, any>, type: DialogMode) => void;
  
  // Form operations
  resetForm: (type: DialogMode, values?: Record<string, any>) => void;
  validateForm: (type: DialogMode) => Promise<boolean>;
  validateAndGetFormData: (type: DialogMode) => Promise<{
    isValid: boolean;
    data: Record<string, any> | null;
    errors: Record<string, any> | null;
  }>;
  submitForm: (type: DialogMode) => Promise<boolean>;
  
  // Active form type
  activeFormType: DialogMode | null;
  setActiveFormType: (type: DialogMode | null) => void;
}

// Create context with a default value
const FormHandlingContext = createContext<FormHandlingContextType | null>(null);

/**
 * Provider component for form handling functionality
 */
export function FormHandlingProvider({ children }: { children: ReactNode }) {
  // Track registered forms - use ref-based approach to prevent update loops
  const [forms, setForms] = useState<Record<string, FormAPI>>({});
  const formsRef = useRef<Record<string, FormAPI>>({});
  
  // Track form states with a ref to prevent circular updates
  const [formStates, setFormStates] = useState<Record<string, FormState>>({});
  const formStatesRef = useRef<Record<string, FormState>>({});
  
  // Track active form type
  const [activeFormType, setActiveFormType] = useState<DialogMode | null>(null);
  
  // CRITICAL FIX: Remove the problematic useEffect hooks that cause infinite loops
  // Instead, update refs synchronously during state updates
  
  // Register a form - prevent duplicate registrations and infinite loops
  const registerForm = useCallback((type: DialogMode, api: FormAPI) => {
    console.log(`[FormHandlingContext] Registering form for ${type}`);
    
    // Update both state and ref in the same update cycle
    setForms(prev => {
      const newForms = { ...prev, [type]: api };
      formsRef.current = newForms; // Update ref immediately
      return newForms;
    });
    
    // Initialize form state if needed
    setFormStates(prev => {
      // Don't update if already exists with same state
      if (prev[type] && JSON.stringify(prev[type]) === JSON.stringify({
        isValid: true,
        isDirty: false,
        errors: {}
      })) {
        return prev;
      }
      
      const newStates = {
        ...prev,
        [type]: {
          isValid: true,
          isDirty: false,
          errors: {}
        }
      };
      formStatesRef.current = newStates; // Update ref immediately
      return newStates;
    });
    
    // Set as active form if no active form exists - prevent loops
    setActiveFormType(current => current !== null ? current : type);
  }, []); // Remove all dependencies to prevent loops
  
  // Unregister form with more safety checks
  const unregisterForm = useCallback((type: DialogMode) => {
    console.log(`[FormHandlingContext] Unregistering form for ${type}`);
    
    if (!type) return; // Safety check
    
    // Remove form API reference
    setForms(prev => {
      if (!prev[type]) return prev;
      
      const newForms = { ...prev };
      delete newForms[type];
      formsRef.current = newForms; // Update ref immediately
      return newForms;
    });
    
    // Remove form state
    setFormStates(prev => {
      if (!prev[type]) return prev;
      
      const newStates = { ...prev };
      delete newStates[type];
      formStatesRef.current = newStates; // Update ref immediately
      return newStates;
    });
    
    // Clear active form type if this was the active one
    setActiveFormType(current => current === type ? null : current);
  }, []); // Remove dependencies to prevent loops

  // CRITICAL FIX: Use only refs for these getters to prevent loops
  const isFormDirty = useCallback((type: DialogMode) => {
    const formState = formStatesRef.current[type];
    if (formState !== undefined) {
      return formState.isDirty;
    }
    
    const form = formsRef.current[type];
    if (form?.isDirty) {
      try {
        return form.isDirty();
      } catch (error) {
        console.error(`[FormHandlingContext] Error checking if form ${type} is dirty:`, error);
      }
    }
    
    return false;
  }, []); // Remove dependencies
  
  const isFormValid = useCallback((type: DialogMode) => {
    const formState = formStatesRef.current[type];
    if (formState !== undefined) {
      return formState.isValid;
    }
    
    const form = formsRef.current[type];
    if (form?.isValid) {
      try {
        const isValid = form.isValid();
        return isValid;
      } catch (error) {
        console.error(`[FormHandlingContext] Error checking if form ${type} is valid:`, error);
      }
    }
    
    return true;
  }, []); // Remove dependencies
  
  const getFormValues = useCallback((type: DialogMode) => {
    const form = formsRef.current[type];
    if (form && typeof form.getValues === 'function') {
      try {
        return form.getValues();
      } catch (error) {
        console.error(`[FormHandlingContext] Error getting form values for ${type}:`, error);
      }
    }
    return {};
  }, []); // Remove dependencies
  
  const getFormErrors = useCallback((type: DialogMode) => {
    const formState = formStatesRef.current[type];
    if (formState) {
      return formState.errors;
    }
    
    const form = formsRef.current[type];
    if (form?.getErrors) {
      return form.getErrors();
    }
    
    return {};
  }, []); // Remove dependencies
  
  // CRITICAL FIX: Prevent setState loops in these functions
  const setFormDirty = useCallback((isDirty: boolean, type: DialogMode) => {
    if (type === undefined || type === null) return;
    
    const currentState = formStatesRef.current[type];
    if (currentState && currentState.isDirty === isDirty) return;
    
    setFormStates(prev => {
      const current = prev[type];
      if (!current || current.isDirty === isDirty) return prev;
      
      const newStates = {
        ...prev, 
        [type]: { ...current, isDirty }
      };
      formStatesRef.current = newStates; // Update ref immediately
      return newStates;
    });
  }, []); // Remove dependencies
  
  const setFormValid = useCallback((isValid: boolean, type: DialogMode) => {
    if (type === undefined || type === null) return;
    
    const currentState = formStatesRef.current[type];
    if (currentState && currentState.isValid === isValid) return;
    
    setFormStates(prev => {
      const current = prev[type];
      if (!current || current.isValid === isValid) return prev;
      
      const newStates = {
        ...prev, 
        [type]: { ...current, isValid }
      };
      formStatesRef.current = newStates; // Update ref immediately
      return newStates;
    });
  }, []); // Remove dependencies

  const setFormErrors = useCallback((errors: Record<string, any>, type: DialogMode) => {
    if (type === undefined || type === null) return;
    
    const currentState = formStatesRef.current[type];
    if (currentState && JSON.stringify(currentState.errors) === JSON.stringify(errors)) return;
    
    setFormStates(prev => {
      const current = prev[type];
      if (!current) return prev;
      
      const newStates = {
        ...prev,
        [type]: { ...current, errors }
      };
      formStatesRef.current = newStates; // Update ref immediately
      return newStates;
    });
  }, []); // Remove dependencies

  // CRITICAL FIX: Use formsRef.current instead of forms state
  const resetForm = useCallback((type: DialogMode, values?: Record<string, any>) => {
    const form = formsRef.current[type];
    if (form?.reset) {
      // CRITICAL FIX: Only reset when values are provided
      // This prevents unwanted resets during error scenarios
      if (values !== undefined) {
        form.reset(values);
      }
    }
    
    // Reset form state only when explicitly requested
    if (values !== undefined) {
      setFormStates(prev => {
        const current = prev[type] || { isValid: true, isDirty: false, errors: {} };
        const newStates = {
          ...prev,
          [type]: {
            ...current,
            isDirty: false,
            errors: {}
          }
        };
        formStatesRef.current = newStates; // Update ref immediately
        return newStates;
      });
    }
  }, []); // Remove dependencies
  
  const validateForm = useCallback(async (type: DialogMode) => {
    const form = formsRef.current[type];
    if (!form) return true;
    
    try {
      if (form.validate) {
        const isValid = await form.validate();
        
        // Update form state without causing loops
        setFormValid(isValid, type);
        
        return isValid;
      }
      
      return isFormValid(type);
    } catch (error) {
      console.error(`[FormHandlingContext] Error validating form for ${type}:`, error);
      return false;
    }
  }, [isFormValid, setFormValid]); // Keep only essential dependencies
  
  // Validate and get form data - completely rewritten to fix registration issues
  const validateAndGetFormData = useCallback(async (type: DialogMode) => {
    console.log(`[FormHandlingContext] Validating form for ${type}. Available forms:`, Object.keys(formsRef.current));
    
    // Get form reference with retry logic
    let form = formsRef.current[type];
    
    // If form not found, wait a bit and try again (registration might be in progress)
    if (!form) {
      console.log(`[FormHandlingContext] Form not immediately found for ${type}, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 100));
      form = formsRef.current[type];
    }
    
    // Handle missing form
    if (!form) {
      console.error(`[FormHandlingContext] Form not found for ${type} after retry. Available forms:`, Object.keys(formsRef.current));
      return {
        isValid: false,
        data: null,
        errors: { _form: `Form not found for ${type}` } as Record<string, any>
      };
    }
    
    try {
      // APPROACH 1: Use getValidatedValues if available
      if (typeof form.getValidatedValues === 'function') {
        try {
          console.log(`[FormHandlingContext] Getting validated values for ${type} using getValidatedValues`);
          const data = await form.getValidatedValues();
          console.log(`[FormHandlingContext] Received data:`, data);
          
          // Ensure we have actual data
          if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
            console.warn(`[FormHandlingContext] No data returned from getValidatedValues for ${type}`);
          }
          
          return {
            isValid: true,
            data: data || {},
            errors: null
          };
        } catch (error) {
          console.error(`[FormHandlingContext] Validation failed for ${type}:`, error);
          
          // Handle validation errors
          let errors: Record<string, any> = { _form: 'Validation failed' };
          
          if (typeof form.getErrors === 'function') {
            try {
              const formErrors = form.getErrors();
              if (formErrors && typeof formErrors === 'object') {
                errors = formErrors;
                if (!('_form' in errors)) {
                  errors._form = 'Validation failed';
                }
              }
            } catch (err) {
              console.error(`[FormHandlingContext] Error getting validation errors:`, err);
            }
          }
          
          setFormValid(false, type);
          setFormErrors(errors, type);
          
          return {
            isValid: false,
            data: null,
            errors
          };
        }
      }
      
      // APPROACH 2: Use validate + getValues if available
      if (typeof form.validate === 'function' && typeof form.getValues === 'function') {
        console.log(`[FormHandlingContext] Using validate + getValues for ${type}`);
        let isValid = false;
        
        try {
          isValid = await form.validate();
        } catch (err) {
          console.error(`[FormHandlingContext] Error validating form:`, err);
          isValid = false;
        }
        
        if (isValid) {
          try {
            const data = form.getValues();
            console.log(`[FormHandlingContext] Got values:`, data);
            
            // Ensure we have data
            if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
              console.warn(`[FormHandlingContext] Empty data from getValues for ${type}`);
            }
            
            return {
              isValid: true,
              data: data || {},
              errors: null
            };
          } catch (err) {
            console.error(`[FormHandlingContext] Error getting form values:`, err);
            return {
              isValid: false,
              data: null,
              errors: { _form: 'Error getting form values' } as Record<string, any>
            };
          }
        } else {
          // Handle validation failure
          let errors: Record<string, any> = { _form: 'Validation failed' };
          
          if (typeof form.getErrors === 'function') {
            try {
              const formErrors = form.getErrors();
              if (formErrors && typeof formErrors === 'object') {
                errors = { ...formErrors };
                if (!('_form' in errors)) {
                  errors._form = 'Validation failed';
                }
              }
            } catch (err) {
              console.error(`[FormHandlingContext] Error getting validation errors:`, err);
            }
          }
          
          return {
            isValid: false,
            data: null,
            errors
          };
        }
      }
      
      // APPROACH 3: Just try to get values directly if no validation is available
      console.log(`[FormHandlingContext] Using fallback approach for ${type}`);
      if (typeof form.getValues === 'function') {
        try {
          const data = form.getValues();
          console.log(`[FormHandlingContext] Got values via fallback:`, data);
          
          return {
            isValid: true,
            data: data || {},
            errors: null
          };
        } catch (err) {
          console.error(`[FormHandlingContext] Error getting form values in fallback:`, err);
        }
      }
      
      // Last resort - return empty data
      console.warn(`[FormHandlingContext] No viable method to get form data for ${type}`);
      return {
        isValid: true,
        data: {},
        errors: null
      };
    } catch (error) {
      console.error(`[FormHandlingContext] Unexpected error in validateAndGetFormData:`, error);
      
      return {
        isValid: false,
        data: null,
        errors: { _form: error instanceof Error ? error.message : 'Unknown error' } as Record<string, any>
      };
    }
  }, [setFormValid, setFormErrors]);
  
  // Submit form
  const submitForm = useCallback(async (type: DialogMode) => {
    const form = forms[type];
    if (!form) return false;
    
    try {
      // Use form's submit method if available
      if (form.submit) {
        return await form.submit();
      }
      
      // Fall back to validate + getValues
      const isValid = await validateForm(type);
      return isValid;
    } catch (error) {
      console.error(`[FormHandlingContext] Error submitting form for ${type}:`, error);
      return false;
    }
  }, [forms, validateForm]);
  
  // CRITICAL FIX: Create context value with stable references and minimal dependencies
  const contextValue = useMemo(() => ({
    registerForm,
    unregisterForm,
    isFormDirty,
    isFormValid,
    getFormValues,
    getFormErrors,
    setFormDirty,
    setFormValid,
    setFormErrors,
    resetForm,
    validateForm,
    validateAndGetFormData,
    submitForm,
    activeFormType,
    setActiveFormType
  }), [
    // CRITICAL FIX: Remove all dependencies to prevent loops
    // These functions are already memoized with useCallback with empty deps
    // Only include activeFormType which is primitive state
    activeFormType
  ]);

  return (
    <FormHandlingContext.Provider value={contextValue}>
      {children}
    </FormHandlingContext.Provider>
  );
}

/**
 * Hook to access the form handling context
 * @throws Error if used outside FormHandlingProvider
 */
export const useFormHandling = () => {
  const context = useContext(FormHandlingContext);
  if (!context) {
    throw new Error('useFormHandling must be used within a FormHandlingProvider');
  }
  return context;
};

/**
 * Higher-order component to wrap form components
 * Works with both regular components and ref-forwarded components
 */
export function withFormHandling<P extends {}>(
  Component: React.ComponentType<P>,
  formType: DialogMode
) {
  const WithFormHandling = (props: P) => {
    const formHandling = useFormHandling();
    
    // Set active form type when component mounts
    React.useEffect(() => {
      formHandling.setActiveFormType(formType);
      return () => {
        // Clear active form type when component unmounts if it matches
        if (formHandling.activeFormType === formType) {
          formHandling.setActiveFormType(null);
        }
      };
    }, []);
    
    return <Component {...props} />;
  };
  
  WithFormHandling.displayName = `WithFormHandling(${Component.displayName || Component.name || 'Component'})`;
  
  return WithFormHandling;
}
