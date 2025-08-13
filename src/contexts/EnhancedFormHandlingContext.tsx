import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { DialogFormMode, FormAdapter, FormAdapterResult, FormAPI, FormState } from '../types/forms';
import { reactHookFormAdapter } from '../adapters';

/**
 * Enhanced form handling context interface
 */
export interface EnhancedFormHandlingContextType {
  /**
   * Register a form with the context
   */
  registerForm: <TData = any>(
    mode: DialogFormMode,
    formAdapterResult: FormAdapterResult<TData>
  ) => void;
  
  /**
   * Unregister a form from the context
   */
  unregisterForm: (mode: DialogFormMode) => void;
  
  /**
   * Get form adapter result for a specific mode
   */
  getFormAdapter: <TData = any>(mode: DialogFormMode) => FormAdapterResult<TData> | null;
  
  /**
   * Get form API for a specific mode
   */
  getFormAPI: <TData = any>(mode: DialogFormMode) => FormAPI<TData> | null;
  
  /**
   * Get form state for a specific mode
   */
  getFormState: (mode: DialogFormMode) => FormState | null;
  
  /**
   * Validate a form and get its data
   */
  validateAndGetFormData: <TData = any>(mode: DialogFormMode) => Promise<{
    isValid: boolean;
    data: TData | null;
    errors: Record<string, any> | null;
  }>;
  
  /**
   * Submit a form programmatically
   */
  submitForm: <TData = any>(
    mode: DialogFormMode,
    onSubmit: (data: TData) => Promise<void> | void
  ) => Promise<boolean>;
  
  /**
   * Reset a form to its initial state
   */
  resetForm: (mode: DialogFormMode, values?: any) => void;
  
  /**
   * Set form loading state
   */
  setFormLoading: (mode: DialogFormMode, loading: boolean) => void;
  
  /**
   * Set form error state
   */
  setFormError: (mode: DialogFormMode, error: string | null) => void;
  
  /**
   * Clear form errors
   */
  clearFormErrors: (mode: DialogFormMode) => void;
  
  /**
   * Subscribe to form state changes
   */
  subscribeToForm: (
    mode: DialogFormMode,
    callback: (state: FormState) => void
  ) => () => void;
  
  /**
   * Get all registered form modes
   */
  getRegisteredModes: () => DialogFormMode[];
  
  /**
   * Check if a form is registered
   */
  isFormRegistered: (mode: DialogFormMode) => boolean;
  
  /**
   * Active form mode
   */
  activeFormMode: DialogFormMode | null;
  
  /**
   * Set active form mode
   */
  setActiveFormMode: (mode: DialogFormMode | null) => void;
  
  /**
   * Default form adapter
   */
  defaultAdapter: FormAdapter;
}

/**
 * Form registration entry
 */
interface FormRegistration<TData = any> {
  mode: DialogFormMode;
  adapterResult: FormAdapterResult<TData>;
  api: FormAPI<TData>;
  subscribers: Set<(state: FormState) => void>;
  loading: boolean;
  error: string | null;
}

/**
 * Context default value
 */
const defaultContextValue: EnhancedFormHandlingContextType = {
  registerForm: () => {
    throw new Error('useEnhancedFormHandling must be used within EnhancedFormHandlingProvider');
  },
  unregisterForm: () => {
    throw new Error('useEnhancedFormHandling must be used within EnhancedFormHandlingProvider');
  },
  getFormAdapter: () => null,
  getFormAPI: () => null,
  getFormState: () => null,
  validateAndGetFormData: async () => ({
    isValid: false,
    data: null,
    errors: { _form: 'Context not available' }
  }),
  submitForm: async () => false,
  resetForm: () => {},
  setFormLoading: () => {},
  setFormError: () => {},
  clearFormErrors: () => {},
  subscribeToForm: () => () => {},
  getRegisteredModes: () => [],
  isFormRegistered: () => false,
  activeFormMode: null,
  setActiveFormMode: () => {},
  defaultAdapter: reactHookFormAdapter
};

/**
 * Enhanced form handling context
 */
const EnhancedFormHandlingContext = createContext<EnhancedFormHandlingContextType>(defaultContextValue);

/**
 * Enhanced form handling provider props
 */
export interface EnhancedFormHandlingProviderProps {
  children: React.ReactNode;
  defaultAdapter?: FormAdapter;
}

/**
 * Enhanced form handling provider
 */
export function EnhancedFormHandlingProvider({
  children,
  defaultAdapter = reactHookFormAdapter
}: EnhancedFormHandlingProviderProps) {
  // State
  const [activeFormMode, setActiveFormMode] = useState<DialogFormMode | null>(null);
  const [registrations, setRegistrations] = useState<Map<DialogFormMode, FormRegistration>>(new Map());
  
  // Refs for stable references
  const registrationsRef = useRef<Map<DialogFormMode, FormRegistration>>(new Map());
  const subscribersRef = useRef<Map<DialogFormMode, Set<(state: FormState) => void>>>(new Map());
  
  // Update ref when state changes
  useEffect(() => {
    registrationsRef.current = registrations;
  }, [registrations]);
  
  // Register form
  const registerForm = useCallback(<TData = any>(
    mode: DialogFormMode,
    adapterResult: FormAdapterResult<TData>
  ) => {
    console.log(`[EnhancedFormHandling] Registering form for mode: ${mode}`);
    
    const registration: FormRegistration<TData> = {
      mode,
      adapterResult,
      api: adapterResult.api,
      subscribers: new Set(),
      loading: false,
      error: null
    };
    
    setRegistrations(prev => {
      const newRegistrations = new Map(prev);
      newRegistrations.set(mode, registration);
      return newRegistrations;
    });
    
    // Set as active if no active mode
    if (!activeFormMode) {
      setActiveFormMode(mode);
    }
    
    console.log(`[EnhancedFormHandling] Successfully registered form for mode: ${mode}`);
  }, [activeFormMode]);
  
  // Unregister form
  const unregisterForm = useCallback((mode: DialogFormMode) => {
    console.log(`[EnhancedFormHandling] Unregistering form for mode: ${mode}`);
    
    setRegistrations(prev => {
      const newRegistrations = new Map(prev);
      newRegistrations.delete(mode);
      return newRegistrations;
    });
    
    // Clear active mode if it was the unregistered one
    if (activeFormMode === mode) {
      setActiveFormMode(null);
    }
    
    // Clean up subscribers
    const subscribers = subscribersRef.current.get(mode);
    if (subscribers) {
      subscribers.clear();
      subscribersRef.current.delete(mode);
    }
  }, [activeFormMode]);
  
  // Get form adapter result
  const getFormAdapter = useCallback(<TData = any>(mode: DialogFormMode): FormAdapterResult<TData> | null => {
    const registration = registrationsRef.current.get(mode) as FormRegistration<TData>;
    return registration?.adapterResult || null;
  }, []);
  
  // Get form API
  const getFormAPI = useCallback(<TData = any>(mode: DialogFormMode): FormAPI<TData> | null => {
    const registration = registrationsRef.current.get(mode) as FormRegistration<TData>;
    return registration?.api || null;
  }, []);
  
  // Get form state
  const getFormState = useCallback((mode: DialogFormMode): FormState | null => {
    const registration = registrationsRef.current.get(mode);
    return registration?.adapterResult.formState || null;
  }, []);
  
  // Validate and get form data
  const validateAndGetFormData = useCallback(async <TData = any>(mode: DialogFormMode) => {
    console.log(`[EnhancedFormHandling] Validating form for mode: ${mode}`);
    
    const registration = registrationsRef.current.get(mode) as FormRegistration<TData>;
    if (!registration) {
      console.error(`[EnhancedFormHandling] Form not found for mode: ${mode}`);
      return {
        isValid: false,
        data: null,
        errors: { _form: `Form not found for ${mode}` }
      };
    }
    
    try {
      const data = await registration.api.getValidatedValues();
      console.log(`[EnhancedFormHandling] Validation successful for mode: ${mode}`, data);
      
      return {
        isValid: true,
        data,
        errors: null
      };
    } catch (error: any) {
      console.error(`[EnhancedFormHandling] Validation failed for mode: ${mode}`, error);
      
      let errors: Record<string, any> = { _form: 'Validation failed' };
      
      if (error && typeof error === 'object') {
        if (error.errors) {
          errors = error.errors;
        } else if (error.formErrors) {
          errors = error.formErrors;
        } else if (error.message) {
          errors = { _form: error.message };
        }
      }
      
      return {
        isValid: false,
        data: null,
        errors
      };
    }
  }, []);
  
  // Submit form
  const submitForm = useCallback(async <TData = any>(
    mode: DialogFormMode,
    onSubmit: (data: TData) => Promise<void> | void
  ): Promise<boolean> => {
    console.log(`[EnhancedFormHandling] Submitting form for mode: ${mode}`);
    
    const registration = registrationsRef.current.get(mode) as FormRegistration<TData>;
    if (!registration) {
      console.error(`[EnhancedFormHandling] Form not found for mode: ${mode}`);
      return false;
    }
    
    try {
      // Set loading state
      setFormLoading(mode, true);
      
      // Validate and get data
      const { isValid, data, errors } = await validateAndGetFormData<TData>(mode);
      
      if (!isValid || !data) {
        console.error(`[EnhancedFormHandling] Form validation failed for mode: ${mode}`, errors);
        setFormError(mode, 'Form validation failed');
        return false;
      }
      
      // Submit data
      await onSubmit(data);
      
      console.log(`[EnhancedFormHandling] Form submitted successfully for mode: ${mode}`);
      return true;
    } catch (error: any) {
      console.error(`[EnhancedFormHandling] Form submission failed for mode: ${mode}`, error);
      setFormError(mode, error.message || 'Submission failed');
      return false;
    } finally {
      setFormLoading(mode, false);
    }
  }, [validateAndGetFormData]);
  
  // Reset form
  const resetForm = useCallback((mode: DialogFormMode, values?: any) => {
    const registration = registrationsRef.current.get(mode);
    if (registration) {
      registration.api.reset(values);
      setFormError(mode, null);
    }
  }, []);
  
  // Set form loading state
  const setFormLoading = useCallback((mode: DialogFormMode, loading: boolean) => {
    setRegistrations(prev => {
      const newRegistrations = new Map(prev);
      const registration = newRegistrations.get(mode);
      if (registration) {
        registration.loading = loading;
        newRegistrations.set(mode, { ...registration });
      }
      return newRegistrations;
    });
  }, []);
  
  // Set form error
  const setFormError = useCallback((mode: DialogFormMode, error: string | null) => {
    setRegistrations(prev => {
      const newRegistrations = new Map(prev);
      const registration = newRegistrations.get(mode);
      if (registration) {
        registration.error = error;
        newRegistrations.set(mode, { ...registration });
      }
      return newRegistrations;
    });
  }, []);
  
  // Clear form errors
  const clearFormErrors = useCallback((mode: DialogFormMode) => {
    const registration = registrationsRef.current.get(mode);
    if (registration) {
      registration.api.clearErrors();
      setFormError(mode, null);
    }
  }, [setFormError]);
  
  // Subscribe to form changes
  const subscribeToForm = useCallback((
    mode: DialogFormMode,
    callback: (state: FormState) => void
  ): (() => void) => {
    let subscribers = subscribersRef.current.get(mode);
    if (!subscribers) {
      subscribers = new Set();
      subscribersRef.current.set(mode, subscribers);
    }
    
    subscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      const currentSubscribers = subscribersRef.current.get(mode);
      if (currentSubscribers) {
        currentSubscribers.delete(callback);
      }
    };
  }, []);
  
  // Get registered modes
  const getRegisteredModes = useCallback((): DialogFormMode[] => {
    return Array.from(registrationsRef.current.keys());
  }, []);
  
  // Check if form is registered
  const isFormRegistered = useCallback((mode: DialogFormMode): boolean => {
    return registrationsRef.current.has(mode);
  }, []);
  
  // Create context value
  const contextValue = useMemo((): EnhancedFormHandlingContextType => ({
    registerForm,
    unregisterForm,
    getFormAdapter,
    getFormAPI,
    getFormState,
    validateAndGetFormData,
    submitForm,
    resetForm,
    setFormLoading,
    setFormError,
    clearFormErrors,
    subscribeToForm,
    getRegisteredModes,
    isFormRegistered,
    activeFormMode,
    setActiveFormMode,
    defaultAdapter
  }), [
    registerForm,
    unregisterForm,
    getFormAdapter,
    getFormAPI,
    getFormState,
    validateAndGetFormData,
    submitForm,
    resetForm,
    setFormLoading,
    setFormError,
    clearFormErrors,
    subscribeToForm,
    getRegisteredModes,
    isFormRegistered,
    activeFormMode,
    setActiveFormMode,
    defaultAdapter
  ]);
  
  return (
    <EnhancedFormHandlingContext.Provider value={contextValue}>
      {children}
    </EnhancedFormHandlingContext.Provider>
  );
}

/**
 * Hook to use enhanced form handling context
 */
export function useEnhancedFormHandling(): EnhancedFormHandlingContextType {
  const context = useContext(EnhancedFormHandlingContext);
  if (!context) {
    throw new Error('useEnhancedFormHandling must be used within EnhancedFormHandlingProvider');
  }
  return context;
}

/**
 * Hook to register a form with the context
 */
export function useFormRegistration<TData = any>(
  mode: DialogFormMode,
  schema: any,
  defaultValues?: any,
  options?: any
) {
  const { registerForm, unregisterForm, defaultAdapter } = useEnhancedFormHandling();
  
  // Create form adapter result
  const adapterResult = useMemo(() => {
    return defaultAdapter.useCreate<TData>({
      schema,
      defaultValues,
      mode,
      ...options
    });
  }, [defaultAdapter, schema, defaultValues, mode, options]);
  
  // Register form on mount
  useEffect(() => {
    registerForm(mode, adapterResult);
    
    return () => {
      unregisterForm(mode);
    };
  }, [mode, adapterResult, registerForm, unregisterForm]);
  
  return adapterResult;
}

export default EnhancedFormHandlingContext;
