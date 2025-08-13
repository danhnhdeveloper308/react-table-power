import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { DialogFormProps, FormRenderContext, DialogFormMode } from '../types/forms';
import { reactHookFormAdapter } from '../adapters';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import { useAnimationPreference } from '../hooks/useAnimationPreference';

/**
 * Enhanced DialogFormWrapper with adapter architecture
 * Supports React Hook Form + Zod by default, with extensible adapter pattern
 */
export function DialogFormWrapper<TSchemaInput = any, TOutput = TSchemaInput>({
  mode = 'create',
  title,
  description,
  schema,
  defaultValues,
  onSubmit,
  onOpenChange,
  renderFields,
  renderFooter,
  submitLabel,
  resetOnClose = true,
  formAdapter = reactHookFormAdapter,
  open = true,
  validationMode = 'onSubmit',
  reValidateMode = 'onChange',
  shouldFocusError = true,
  formProps = {},
  disabled = false,
  loading = false,
  error,
  width = 'auto',
  maxWidth = '90vw',
  closeOnClickOutside = true,
  closeOnEsc = true,
  className
}: DialogFormProps<TSchemaInput, TOutput>) {
  // State management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(open);
  const [isFormReady, setIsFormReady] = useState(false);
  
  // Refs
  const dialogRef = useRef<HTMLDivElement>(null);
  const formMountedRef = useRef(false);
  const defaultValuesResolvedRef = useRef(false);
  
  // Hooks
  const { reducedMotion } = useAnimationPreference();
  
  // Sync external open state
  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  // Create form adapter instance
  const formAdapterResult = useMemo(() => {
    try {
      return formAdapter.useCreate({
        schema,
        defaultValues,
        mode,
        validationMode,
        reValidateMode,
        shouldFocusError
      });
    } catch (error) {
      console.error('[DialogFormWrapper] Error creating form adapter:', error);
      throw error;
    }
  }, [formAdapter, schema, defaultValues, mode, validationMode, reValidateMode, shouldFocusError]);

  const { 
    Provider: FormProvider, 
    api: formAPI, 
    handleSubmit, 
    formState,
    reset,
    clearErrors
  } = formAdapterResult;

  // Handle async default values loading
  useEffect(() => {
    const loadDefaultValues = async () => {
      if (!defaultValues || defaultValuesResolvedRef.current) return;
      
      try {
        if (typeof defaultValues === 'function') {
          setIsFormReady(false);
          const resolved = await defaultValues();
          reset(resolved);
          defaultValuesResolvedRef.current = true;
          setIsFormReady(true);
        } else {
          reset(defaultValues);
          defaultValuesResolvedRef.current = true;
          setIsFormReady(true);
        }
      } catch (err) {
        console.error('[DialogFormWrapper] Error loading default values:', err);
        setSubmitError(err instanceof Error ? err.message : 'Failed to load form data');
        setIsFormReady(true);
      }
    };

    if (isOpen) {
      loadDefaultValues();
    }
  }, [isOpen, defaultValues, reset]);

  // Mark form as ready when it mounts
  useEffect(() => {
    if (!formMountedRef.current) {
      formMountedRef.current = true;
      if (!defaultValues || defaultValuesResolvedRef.current) {
        setIsFormReady(true);
      }
    }
  }, [defaultValues]);

  // Handle form submission
  const handleFormSubmit = useCallback(
    async (values: TSchemaInput) => {
      if (!onSubmit || isSubmitting) return;

      setIsSubmitting(true);
      setSubmitError(null);

      try {
        await onSubmit(values as TOutput);
        
        // Close dialog on successful submission
        setIsOpen(false);
        if (onOpenChange) {
          onOpenChange(false);
        }
        
        // Reset form if requested
        if (resetOnClose) {
          reset();
        }
      } catch (err) {
        console.error('[DialogFormWrapper] Submit error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Submission failed';
        setSubmitError(errorMessage);
        
        // Handle server validation errors
        if (err && typeof err === 'object' && 'errors' in err) {
          const serverErrors = err.errors as Record<string, string>;
          formAdapterResult.setErrors(serverErrors);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, isSubmitting, onOpenChange, resetOnClose, reset, formAdapterResult]
  );

  // Handle dialog close
  const handleClose = useCallback(() => {
    if (isSubmitting || loading) return;
    
    setIsOpen(false);
    if (onOpenChange) {
      onOpenChange(false);
    }
    
    // Reset form if requested
    if (resetOnClose) {
      setTimeout(() => {
        reset();
        clearErrors();
        setSubmitError(null);
      }, 200); // Allow time for exit animation
    }
  }, [isSubmitting, loading, onOpenChange, resetOnClose, reset, clearErrors]);

  // Handle ESC key
  useEffect(() => {
    if (!closeOnEsc || !isOpen) return;

    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting && !loading) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [closeOnEsc, isOpen, isSubmitting, loading, handleClose]);

  // Handle click outside
  useOnClickOutside(dialogRef, () => {
    if (closeOnClickOutside && !isSubmitting && !loading) {
      handleClose();
    }
  });

  // Form render context
  const formRenderContext: FormRenderContext<TSchemaInput> = useMemo(() => ({
    form: formAPI,
    submitting: isSubmitting,
    submitError: submitError || undefined,
    mode,
    formState,
    isReadOnly: mode === 'view' || disabled
  }), [formAPI, isSubmitting, submitError, mode, formState, disabled]);

  // Determine dialog title
  const dialogTitle = title || {
    create: 'Create New',
    edit: 'Edit',
    view: 'View Details',
    delete: 'Confirm Delete'
  }[mode];

  // Determine submit label
  const buttonLabel = submitLabel || {
    create: 'Create',
    edit: 'Save Changes',
    delete: 'Delete',
    view: ''
  }[mode];

  // Animation variants
  const animationVariants = reducedMotion ? {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.1 }
  } : {
    initial: { opacity: 0, scale: 0.96, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.96, y: 20 },
    transition: { 
      type: 'spring',
      damping: 25,
      stiffness: 400,
      duration: 0.2
    }
  };

  // Backdrop animation
  const backdropVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.15 }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="rtp-dialog-backdrop"
        variants={backdropVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}
      >
        <motion.div
          ref={dialogRef}
          className={cn('rtp-dialog', className)}
          variants={animationVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{
            width,
            maxWidth,
            maxHeight: '90vh',
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          aria-describedby={description ? "dialog-description" : undefined}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Dialog Header */}
          <div className="rtp-dialog-header" style={{
            padding: '1.5rem 1.5rem 1rem',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <h2 
                id="dialog-title" 
                className="rtp-dialog-title"
                style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: 0
                }}
              >
                {dialogTitle}
              </h2>
              {description && (
                <p 
                  id="dialog-description"
                  className="rtp-dialog-description"
                  style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    margin: '0.25rem 0 0 0'
                  }}
                >
                  {description}
                </p>
              )}
            </div>
            
            <button
              className="rtp-dialog-close"
              onClick={handleClose}
              disabled={isSubmitting || loading}
              aria-label="Close dialog"
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '0.25rem'
              }}
            >
              ×
            </button>
          </div>

          {/* Dialog Content */}
          <div className="rtp-dialog-content" style={{
            flex: 1,
            padding: '1.5rem',
            overflow: 'auto'
          }}>
            {/* Error Display */}
            {(error || submitError) && (
              <div 
                className="rtp-dialog-error"
                role="alert"
                style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '0.375rem',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  color: '#dc2626'
                }}
              >
                {submitError || (error instanceof Error ? error.message : error)}
              </div>
            )}

            {/* Loading State */}
            {(loading || !isFormReady) && (
              <div className="rtp-dialog-loading" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                color: '#6b7280'
              }}>
                <div className="rtp-spinner" style={{
                  width: '1rem',
                  height: '1rem',
                  border: '2px solid #e5e7eb',
                  borderTopColor: '#3b82f6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: '0.5rem'
                }} />
                Loading form...
              </div>
            )}

            {/* Form Content */}
            {isFormReady && !loading && (
              <FormProvider>
                <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
                  {renderFields(formRenderContext)}
                </form>
              </FormProvider>
            )}
          </div>

          {/* Dialog Footer */}
          <div className="rtp-dialog-footer" style={{
            padding: '1rem 1.5rem 1.5rem',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem'
          }}>
            {renderFooter ? (
              renderFooter({
                submitting: isSubmitting,
                submitLabel: buttonLabel,
                onSubmit: handleSubmit(handleFormSubmit),
                onCancel: handleClose,
                formState
              })
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting || loading}
                  className="rtp-button rtp-button-secondary"
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    backgroundColor: 'white',
                    color: '#374151',
                    cursor: isSubmitting || loading ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting || loading ? 0.6 : 1
                  }}
                >
                  Cancel
                </button>
                
                {mode !== 'view' && (
                  <button
                    type="submit"
                    disabled={isSubmitting || loading || !isFormReady}
                    onClick={handleSubmit(handleFormSubmit)}
                    className={cn(
                      'rtp-button',
                      mode === 'delete' ? 'rtp-button-destructive' : 'rtp-button-primary'
                    )}
                    style={{
                      padding: '0.5rem 1rem',
                      border: 'none',
                      borderRadius: '0.375rem',
                      backgroundColor: mode === 'delete' ? '#dc2626' : '#3b82f6',
                      color: 'white',
                      cursor: isSubmitting || loading || !isFormReady ? 'not-allowed' : 'pointer',
                      opacity: isSubmitting || loading || !isFormReady ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {isSubmitting && (
                      <div className="rtp-spinner" style={{
                        width: '0.875rem',
                        height: '0.875rem',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderTopColor: 'white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                    )}
                    {isSubmitting ? 'Submitting...' : buttonLabel}
                  </button>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default DialogFormWrapper;
