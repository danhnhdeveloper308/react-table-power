import React, { useImperativeHandle, forwardRef, useRef, useEffect, useCallback, useMemo } from 'react';
import { useFormHandling } from '../../contexts/FormHandlingContext';
import { DialogMode } from '../../types';
import { useAutoForm } from '../../hooks/useAutoForm';

export interface AutoFormProps {
  form: any;
  dialogType?: DialogMode;
  children: React.ReactNode;
  values?: Record<string, any>;
  onFormDirty?: (isDirty: boolean) => void;
  onValuesChange?: (values: Record<string, any>) => void;
  onErrorsChange?: (errors: Record<string, any>) => void;
  onSubmit?: (data: any) => void;
  skipInitialValidation?: boolean;
}

/**
 * AutoForm - A component that seamlessly integrates form libraries with FormHandlingContext
 */
const AutoForm = forwardRef<any, AutoFormProps>(({ 
  children, 
  form, 
  dialogType, 
  onFormDirty, 
  onValuesChange, 
  onSubmit, 
  onErrorsChange,
  skipInitialValidation = true,
  ...otherProps
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // CRITICAL FIX: Create stable callbacks that never change reference
  const stableCallbacks = useMemo(() => ({
    onFormDirty: (isDirty: boolean) => {
      if (onFormDirty) {
        onFormDirty(isDirty);
      }
    },
    onValuesChange: (values: Record<string, any>) => {
      if (onValuesChange) {
        onValuesChange(values);
      }
    },
    onErrorsChange: (errors: Record<string, any>) => {
      if (onErrorsChange) {
        onErrorsChange(errors);
      }
    },
    onSubmit: (data: any) => {
      if (onSubmit) {
        onSubmit(data);
      }
    }
  }), [onFormDirty, onValuesChange, onErrorsChange, onSubmit]);
  
  // Use the hook with stable callbacks
  const formState = useAutoForm(form, {
    dialogType,
    onFormDirty: stableCallbacks.onFormDirty,
    onValuesChange: stableCallbacks.onValuesChange,
    onErrorsChange: stableCallbacks.onErrorsChange,
    onSubmit: stableCallbacks.onSubmit,
    skipInitialValidation,
    domRef: containerRef
  });

  // CRITICAL FIX: Create stable API that never changes reference
  const stableAPI = useMemo(() => ({
    getValues: () => {
      if (formState?.getValues) {
        return formState.getValues();
      }
      
      if (form && typeof form.getValues === 'function') {
        const values = form.getValues();
        return values;
      }
      
      return {};
    },
    
    getValidatedValues: async () => {
      try {
        if (formState?.markInteracted) {
          formState.markInteracted();
        }
        
        if (!form) {
          throw new Error('No form available');
        }
        
        if (typeof form.trigger === 'function') {
          const isValid = await form.trigger();
          if (!isValid) {
            throw new Error('Validation failed');
          }
        } else if (typeof form.validate === 'function') {
          const isValid = await form.validate();
          if (!isValid) {
            throw new Error('Validation failed');
          }
        }
        
        let values;
        if (formState?.getValues) {
          values = formState.getValues();
        } else if (form && typeof form.getValues === 'function') {
          values = form.getValues();
        } else {
          values = {};
        }
        
        return values;
      } catch (e) {
        console.error('[AutoForm] Validation error:', e);
        throw e;
      }
    },
    
    validate: async () => {
      if (formState?.validate) {
        return formState.validate();
      }
      
      if (typeof form.trigger === 'function') {
        return await form.trigger();
      }
      
      if (typeof form.validateForm === 'function') {
        const errors = await form.validateForm();
        return !errors || Object.keys(errors || {}).length === 0;
      }
      
      if (typeof form.validate === 'function') {
        return await form.validate();
      }
      
      return true;
    },
    
    reset: (values?: Record<string, any>) => {
      // CRITICAL FIX: Only reset when explicitly requested with values
      // This prevents unwanted resets during error handling
      if (formState?.reset) {
        if (values !== undefined) {
          formState.reset(values);
        }
      } else if (form?.reset && values !== undefined) {
        form.reset(values);
      }
    },
    
    isDirty: () => formState?.isDirty || false,
    isValid: () => formState?.isValid || true,
    
    getErrors: () => {
      if (form.formState?.errors) {
        return form.formState.errors;
      }
      
      if (form.errors) {
        return form.errors;
      }
      
      return {};
    },
    
    submit: async () => {
      if (formState?.submit) {
        return formState.submit();
      }
      
      if (typeof form.handleSubmit === 'function') {
        try {
          if (onSubmit) {
            await form.handleSubmit(onSubmit)();
          } else {
            await form.handleSubmit()();
          }
          return true;
        } catch (error) {
          console.error('[AutoForm] Error submitting form:', error);
          return false;
        }
      }
      
      return false;
    },
    
    form: form,
    formState: formState,
    containerElement: containerRef.current
  }), [form, formState, onSubmit]); // Only essential dependencies
  
  // Expose stable API via ref
  useImperativeHandle(ref, () => stableAPI, [stableAPI]);

  return (
    <div ref={containerRef} className="rpt-auto-form-container">
      {children}
    </div>
  );
});

AutoForm.displayName = 'AutoForm';

export default React.memo(AutoForm);
