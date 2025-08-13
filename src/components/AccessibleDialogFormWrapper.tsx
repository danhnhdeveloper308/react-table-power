import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { DialogFormProps, FormRenderContext, DialogFormMode } from '../types/forms';
import { reactHookFormAdapter } from '../adapters';
import { useDialogLifecycle, useDialogFocus, usePreventBodyScroll } from '../utils/dialogLifecycle';
import { useAnimationPreference } from '../hooks/useAnimationPreference';

/**
 * Enhanced DialogFormWrapper with comprehensive accessibility features
 * - ARIA attributes and roles
 * - Focus management and trap
 * - Keyboard navigation
 * - Screen reader announcements
 * - High contrast mode support
 * - Reduced motion support
 * - Mobile-first responsive design
 */
export function AccessibleDialogFormWrapper<TSchemaInput = any, TOutput = TSchemaInput>({
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
  const [isFormReady, setIsFormReady] = useState(false);
  const [announceMessage, setAnnounceMessage] = useState<string>('');
  
  // Refs
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const formMountedRef = useRef(false);
  const defaultValuesResolvedRef = useRef(false);
  const lastFocusedElement = useRef<HTMLElement | null>(null);
  
  // Hooks
  const { reducedMotion } = useAnimationPreference();
  
  // Accessibility: Store the last focused element
  useEffect(() => {
    if (open) {
      lastFocusedElement.current = document.activeElement as HTMLElement;
    }
  }, [open]);
  
  // Dialog lifecycle management
  const { state: lifecycleState, open: openDialog, close: closeDialog } = useDialogLifecycle({
    onBeforeOpen: async () => {
      // Announce dialog opening to screen readers
      setAnnounceMessage(`Opening ${title || mode} dialog`);
      return true;
    },
    onOpen: () => {
      // Focus the dialog after it opens
      if (dialogRef.current) {
        dialogRef.current.focus();
      }
    },
    onBeforeClose: async () => {
      // Clear any error states
      setSubmitError(null);
      return true;
    },
    onClose: () => {
      // Restore focus to the last focused element
      if (lastFocusedElement.current) {
        lastFocusedElement.current.focus();
      }
      
      // Announce dialog closing
      setAnnounceMessage('Dialog closed');
      
      // Call external close handler
      onOpenChange?.(false);
    },
    onError: (error) => {
      setSubmitError(error.message);
      setAnnounceMessage(`Error: ${error.message}`);
    }
  });
  
  // Focus management
  const { focusFirst, focusLast } = useDialogFocus(dialogRef, open);
  
  // Prevent body scroll when dialog is open
  usePreventBodyScroll(open);
  
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
      console.error('[AccessibleDialogFormWrapper] Error creating form adapter:', error);
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
        setAnnounceMessage('Loading form data...');
        
        if (typeof defaultValues === 'function') {
          setIsFormReady(false);
          const resolved = await defaultValues();
          reset(resolved);
          defaultValuesResolvedRef.current = true;
          setIsFormReady(true);
          setAnnounceMessage('Form data loaded successfully');
        } else {
          reset(defaultValues);
          defaultValuesResolvedRef.current = true;
          setIsFormReady(true);
        }
      } catch (err) {
        console.error('[AccessibleDialogFormWrapper] Error loading default values:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load form data';
        setSubmitError(errorMessage);
        setAnnounceMessage(`Error loading form data: ${errorMessage}`);
        setIsFormReady(true);
      }
    };

    if (open) {
      loadDefaultValues();
    }
  }, [open, defaultValues, reset]);

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
      setAnnounceMessage('Submitting form...');

      try {
        await onSubmit(values as TOutput);
        
        // Announce successful submission
        setAnnounceMessage(`${mode} operation completed successfully`);
        
        // Close dialog on successful submission
        await closeDialog();
        
        // Reset form if requested
        if (resetOnClose) {
          reset();
        }
      } catch (err) {
        console.error('[AccessibleDialogFormWrapper] Submit error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Submission failed';
        setSubmitError(errorMessage);
        setAnnounceMessage(`Submission failed: ${errorMessage}`);
        
        // Handle server validation errors
        if (err && typeof err === 'object' && 'errors' in err) {
          const serverErrors = err.errors as Record<string, string>;
          formAdapterResult.setErrors(serverErrors);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, isSubmitting, mode, closeDialog, resetOnClose, reset, formAdapterResult]
  );

  // Handle dialog close
  const handleClose = useCallback(async () => {
    if (isSubmitting || loading) return;
    
    await closeDialog();
    
    // Reset form if requested
    if (resetOnClose) {
      setTimeout(() => {
        reset();
        clearErrors();
        setSubmitError(null);
      }, 200); // Allow time for exit animation
    }
  }, [isSubmitting, loading, closeDialog, resetOnClose, reset, clearErrors]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        if (closeOnEsc && !isSubmitting && !loading) {
          e.preventDefault();
          handleClose();
        }
        break;
      case 'Tab':
        // Focus trap is handled by useDialogFocus hook
        break;
      case 'Home':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          focusFirst();
        }
        break;
      case 'End':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          focusLast();
        }
        break;
    }
  }, [closeOnEsc, isSubmitting, loading, handleClose, focusFirst, focusLast]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnClickOutside && !isSubmitting && !loading) {
      handleClose();
    }
  }, [closeOnClickOutside, isSubmitting, loading, handleClose]);

  // Form render context
  const formRenderContext: FormRenderContext<TSchemaInput> = useMemo(() => ({
    form: formAPI,
    submitting: isSubmitting,
    submitError: submitError || undefined,
    mode,
    formState,
    isReadOnly: mode === 'view' || disabled
  }), [formAPI, isSubmitting, submitError, mode, formState, disabled]);

  // Determine dialog title and labels
  const dialogTitle = title || {
    create: 'Create New Item',
    edit: 'Edit Item',
    view: 'View Item Details',
    delete: 'Confirm Deletion'
  }[mode];

  const buttonLabel = submitLabel || {
    create: 'Create',
    edit: 'Save Changes',
    delete: 'Delete',
    view: ''
  }[mode];

  // Generate unique IDs for accessibility
  const titleId = `dialog-title-${Math.random().toString(36).substr(2, 9)}`;
  const descriptionId = description ? `dialog-description-${Math.random().toString(36).substr(2, 9)}` : undefined;
  const errorId = (error || submitError) ? `dialog-error-${Math.random().toString(36).substr(2, 9)}` : undefined;

  // Animation variants with reduced motion support
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

  if (!open) return null;

  return (
    <>
      {/* Screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announceMessage}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          className="rtp-dialog-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={handleBackdropClick}
          data-testid="dialog-backdrop"
        >
          <motion.div
            ref={dialogRef}
            className={cn('rtp-dialog', className)}
            variants={animationVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            
            /* Accessibility attributes */
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            aria-busy={isSubmitting || loading}
            aria-live="polite"
            tabIndex={-1}
            
            /* Data attributes for testing and styling */
            data-testid="dialog"
            data-dialog-mode={mode}
            data-dialog-state={lifecycleState}
            
            style={{
              width,
              maxWidth,
              maxHeight: '90vh'
            }}
          >
            {/* Dialog Header */}
            <header className="rtp-dialog-header">
              <div>
                <h2 
                  id={titleId}
                  ref={titleRef}
                  className="rtp-dialog-title"
                >
                  {dialogTitle}
                </h2>
                {description && (
                  <p 
                    id={descriptionId}
                    className="rtp-dialog-description"
                  >
                    {description}
                  </p>
                )}
              </div>
              
              <button
                className="rtp-dialog-close"
                onClick={handleClose}
                disabled={isSubmitting || loading}
                aria-label={`Close ${dialogTitle.toLowerCase()}`}
                data-testid="dialog-close"
              >
                <span aria-hidden="true">×</span>
              </button>
            </header>

            {/* Dialog Content */}
            <main 
              className="rtp-dialog-content"
              role="main"
            >
              {/* Error Display */}
              {(error || submitError) && (
                <div 
                  id={errorId}
                  className="rtp-dialog-error"
                  role="alert"
                  aria-live="assertive"
                  data-testid="dialog-error"
                >
                  {submitError || (error instanceof Error ? error.message : error)}
                </div>
              )}

              {/* Loading State */}
              {(loading || !isFormReady) && (
                <div 
                  className="rtp-dialog-loading"
                  role="status"
                  aria-label="Loading form data"
                  data-testid="dialog-loading"
                >
                  <div 
                    className="rtp-dialog-loading-spinner"
                    aria-hidden="true"
                  />
                  <span>Loading form...</span>
                </div>
              )}

              {/* Form Content */}
              {isFormReady && !loading && (
                <FormProvider>
                  <form 
                    onSubmit={handleSubmit(handleFormSubmit)} 
                    noValidate
                    aria-describedby={errorId}
                    data-testid="dialog-form"
                  >
                    {renderFields(formRenderContext)}
                  </form>
                </FormProvider>
              )}
            </main>

            {/* Dialog Footer */}
            <footer className="rtp-dialog-footer">
              {renderFooter ? (
                renderFooter({
                  submitting: isSubmitting,
                  submitLabel: buttonLabel,
                  onSubmit: handleSubmit(handleFormSubmit),
                  onCancel: handleClose,
                  formState
                })
              ) : (
                <div className="rtp-dialog-actions rtp-dialog-actions-right">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting || loading}
                    className="rtp-button rtp-button-secondary"
                    data-testid="dialog-cancel"
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
                      aria-describedby={isSubmitting ? 'submit-status' : undefined}
                      data-testid="dialog-submit"
                    >
                      {isSubmitting && (
                        <>
                          <div 
                            className="rtp-dialog-loading-spinner"
                            aria-hidden="true"
                            style={{ width: '0.875rem', height: '0.875rem' }}
                          />
                          <span className="sr-only">Submitting...</span>
                        </>
                      )}
                      <span aria-hidden={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : buttonLabel}
                      </span>
                    </button>
                  )}
                  
                  {/* Hidden status for screen readers */}
                  {isSubmitting && (
                    <div 
                      id="submit-status"
                      className="sr-only"
                      aria-live="polite"
                    >
                      Submitting form, please wait...
                    </div>
                  )}
                </div>
              )}
            </footer>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

export default AccessibleDialogFormWrapper;
