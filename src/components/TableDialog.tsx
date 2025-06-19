import React, { useEffect, useState, useRef, useCallback } from 'react';
import { cn } from '../utils/cn';
import { DialogType, LoadingType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './form/Button';
import { ButtonLoadingType } from './form/Button';
import { FormHandlingContextType, useFormHandling } from '../contexts/FormHandlingContext';
import DialogLoadingState from './DialogLoadingState';
import { formatError } from '../utils/errorHandling';

export interface TableDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;
  
  /**
   * Dialog title
   */
  title?: string;
  
  /**
   * Dialog description/subtitle
   */
  description?: string;
  
  /**
   * Type of dialog (create, edit, view, delete)
   */
  type: DialogType;
  
  /**
   * Data to be passed to the form
   */
  data?: any;
  
  /**
   * Form component to render inside dialog
   */
  formComponent?: React.ComponentType<any>;
  
  /**
   * Callback when dialog is closed
   */
  onClose?: () => void;
  
  /**
   * Callback when form is submitted
   * Fixed signature to accept a single data parameter
   */
  onSubmit?: (data: Record<string, any> | undefined, type: DialogType) => Promise<boolean> | boolean | void | Promise<void>;

  /**
   * Whether the dialog is in loading state
   */
  loading?: boolean;
  
  /**
   * Error message to display
   */
  error?: string | Error | null;
  
  /**
   * Width of the dialog
   */
  width?: string | number;
  
  /**
   * Max width of the dialog
   */
  maxWidth?: string | number;
  
  /**
   * Whether to close on click outside
   * @default true
   */
  closeOnClickOutside?: boolean;
  
  /**
   * Whether to close on ESC key
   * @default true
   */
  closeOnEsc?: boolean;
  
  /**
   * Dialog content (can be used instead of formComponent)
   */
  children?: React.ReactNode;
  
  /**
   * Additional CSS class for the dialog
   */
  className?: string;
  
  /**
   * Additional CSS class for the backdrop
   */
  backdropClassName?: string;
  
  /**
   * Additional CSS class for the content
   */
  contentClassName?: string;

  /**
   * Custom dialog footer
   */
  footer?: React.ReactNode;
  
  /**
   * Whether to show the submit button
   * @default true
   */
  showSubmitButton?: boolean;
  
  /**
   * Label for the submit button
   */
  submitButtonLabel?: string;
  
  /**
   * Label for the cancel button
   */
  cancelButtonLabel?: string;
  
  /**
   * Type of loading animation
   */
  loadingAnimationType?: LoadingType;
  
  /**
   * Type of loading indicator
   */
  loadingIndicatorType?: 'spinner' | 'dots' | 'progress' | 'pulse';
  
  /**
   * Size of loading indicator
   */
  loadingIndicatorSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /**
   * Loading text
   */
  loadingText?: string;
  
  /**
   * Style of loading effect
   * @default 'overlay'
   */
  loadingEffect?: 'overlay' | 'blur' | 'skeleton' | 'fade' | 'none';
  
  /**
   * Whether the footer is sticky
   */
  stickyFooter?: boolean;
  
  /**
   * Size of buttons
   */
  buttonSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /**
   * Whether buttons are elevated
   */
  elevatedButtons?: boolean;
  
  /**
   * Position of action buttons
   */
  actionsPosition?: 'left' | 'right' | 'center' | 'between';
  
  /**
   * Validation mode
   */
  validationMode?: 'onSubmit' | 'onChange' | 'onBlur';
  
  /**
   * Whether to show inline errors
   */
  showInlineErrors?: boolean;
  
  /**
   * Whether to show error summary
   */
  showErrorSummary?: boolean;
  
  /**
   * Function to transform errors
   */
  transformErrors?: (errors: Record<string, any>) => Record<string, any>;
  
  /**
   * Custom error renderer
   */
  renderError?: (error: string | Error | null) => React.ReactNode;
  
  /**
   * Error handler
   */
  onError?: (error: Error) => void;
  
  /**
   * Whether to disable form fields when loading
   */
  disableFieldsWhenLoading?: boolean;
  
  /**
   * Whether to auto-focus the first field
   */
  autoFocusFirstField?: boolean;
  
  /**
   * Additional props to pass to the form
   */
  formProps?: Record<string, any>;
}

/**
 * TableDialog component - Used for CRUD operations
 */
export const TableDialog: React.FC<TableDialogProps> = ({
  open,
  title,
  description,
  type,
  data,
  formComponent: FormComponent,
  onClose,
  onSubmit,
  loading = false,
  error = null,
  width = '500px',
  maxWidth = '90vw',
  closeOnClickOutside = true,
  closeOnEsc = true,
  children,
  className,
  backdropClassName,
  contentClassName,
  footer,
  showSubmitButton = true,
  submitButtonLabel,
  cancelButtonLabel = 'Hủy',
  loadingAnimationType = 'spinner',
  loadingIndicatorType = 'spinner',
  loadingIndicatorSize = 'md',
  loadingText = 'Đang xử lý...',
  loadingEffect = 'overlay',
  stickyFooter = true,
  buttonSize = 'md',
  elevatedButtons = true,
  actionsPosition = 'right',
  validationMode = 'onSubmit',
  showInlineErrors = true,
  showErrorSummary = true,
  transformErrors,
  renderError: renderErrorProp,
  onError,
  disableFieldsWhenLoading = true,
  autoFocusFirstField = true,
  formProps = {},
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<any>(data);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const formHandlingRef = useRef<FormHandlingContextType | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLElement | null>(null);
  
  // Try to get form handling context safely
  try {
    formHandlingRef.current = useFormHandling();
  } catch (err) {
    // Context not available - form validation will be more limited
  }
  
  // Clean up error state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setInternalError(null);
      setIsSubmitting(false);
    }
  }, [open]);

  // Update local state when dialog open state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(open);
    }, 0);
    return () => clearTimeout(timer);
  }, [open]);

  // Update local state when data changes - with memoization to prevent unnecessary updates
  useEffect(() => {
    if (data !== formData) {
      setFormData(data);
    }
  }, [data]);
  
  // Handle auto-focus on the first form field
  useEffect(() => {
    if (!isOpen || !autoFocusFirstField) return;
    
    const focusFirstField = () => {
      if (!dialogRef.current) return;
      
      // Find the first focusable input field in the dialog
      const focusable = dialogRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      
      // Focus on the first field (but not the close button)
      if (focusable.length > 1) {
        const firstField = focusable[1] as HTMLElement;
        firstFieldRef.current = firstField;
        firstField.focus();
      }
    };
    
    // Delay to ensure DOM is ready
    const timer = setTimeout(focusFirstField, 150);
    return () => clearTimeout(timer);
  }, [isOpen, autoFocusFirstField]);
  
  // Handle dialog close with animation
  const handleClose = useCallback(() => {
    if (loading || isSubmitting) return;
    
    // Set isOpen to false to trigger closing animation
    setIsOpen(false);
    
    // Use timeout to ensure animation completes before notifying parent
    const closeTimeout = setTimeout(() => {
      onClose?.();
    }, 200); // Allow time for exit animation
    
    return () => clearTimeout(closeTimeout);
  }, [loading, isSubmitting, onClose]);
  
  // Handle clicking outside dialog
  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnClickOutside && !loading && !isSubmitting) {
      handleClose();
    }
  }, [closeOnClickOutside, loading, isSubmitting, handleClose]);
  
  // Handle ESC key press
  useEffect(() => {
    if (!closeOnEsc || !isOpen) return;
    
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading && !isSubmitting) {
        handleClose();
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, closeOnEsc, loading, isSubmitting, handleClose]);
  
  // Prevent body scrolling when dialog is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
    return undefined;
  }, [isOpen]);
  
  // Reset form when dialog opens with new type
  useEffect(() => {
    if (open && formHandlingRef.current) {
      const formHandling = formHandlingRef.current;
      
      // Register this dialog's type with form handling
      if (FormComponent) {
        // Fix: Pass the dialog type (not a ref object) and provide a valid API object
        formHandling.registerForm(type, {
          // Provide required methods that FormHandling expects
          validate: async () => true,
          getValues: () => data || {},
          getValidatedValues: async () => data || {},
          isDirty: () => false,
          isValid: () => true,
          reset: () => {},
          getErrors: () => ({}),
        });
      }
      
      return () => {
        formHandling.unregisterForm(type);
      };
    }
    return undefined;
  }, [open, type, FormComponent, data]);
  
  // Format error for display
  const formatErrorMessage = (err: string | Error | null): string => {
    if (!err) return '';
    return formatError(err);
  };

  // Handle error display
  const renderErrorContent = useCallback((err: string | Error | null): React.ReactNode => {
    if (!err) return null;
    
    // Use custom error renderer if provided
    if (renderErrorProp && typeof renderErrorProp === 'function') {
      return renderErrorProp(err);
    }
    
    return formatErrorMessage(err);
  }, [renderErrorProp]);

  // Handle dialog submission
  const handleSubmit = useCallback(async (submitData: Record<string, any> | undefined, type: DialogType): Promise<boolean> => {
    // Ensure submitData is an object before passing to onSubmit
    const safeData: Record<string, any> = submitData || {};
    
    if (!onSubmit || !type) return false; 
    
    try {
      setIsSubmitting(true);
      const result = await onSubmit(safeData, type);
      setIsSubmitting(false);
      
      // Close dialog on successful submission
      if (result === true || result === undefined) {
        onClose?.();
        return true;
      }
      
      return false;
    } catch (err) {
      setIsSubmitting(false);
      console.error('Error in dialog submission:', err);
      
      // Handle error if onError callback is provided
      if (onError && err instanceof Error) {
        onError(err);
      }
      
      return false;
    }
  }, [onSubmit, onClose, onError]);

  // Handle confirm action (used for primary button in footer)
  const handleConfirm = useCallback(async (): Promise<boolean> => {
    // For delete operations, use manual submission
    if (type === 'delete') {
      return handleSubmit(data, type);
    }
    
    // Use form handling context if available
    const formHandling = formHandlingRef.current;
    if (formHandling) {
      try {
        // Validate and get form data
        const validation = await formHandling.validateAndGetFormData(type);
        
        if (!validation.isValid) {
          console.error("Form validation failed:", validation.errors);
          return false;
        }
        
        if (validation.data) {
          // Use the single-parameter version of handleSubmit
          return handleSubmit(validation.data, type);
        }
      } catch (error) {
        console.error("Error during form validation:", error);
        return false;
      }
    }
    
    // Fallback to use current form data
    return handleSubmit(formData, type);
  }, [type, data, handleSubmit, FormComponent, formData]);

  // Don't render if not open
  if (!open) {
    return null;
  }
  
  // Determine dialog title based on type if not provided
  const dialogTitle = title || (
    type === 'create' ? 'Thêm mới' :
    type === 'edit' ? 'Chỉnh sửa' :
    type === 'delete' ? 'Xác nhận xóa' :
    type === 'view' ? 'Xem chi tiết' : 
    type === 'custom' ? 'Thao tác' : 'Dialog'
  );
  
  // Determine submit button label based on type if not provided
  const submitLabel = submitButtonLabel || (
    type === 'create' ? 'Thêm mới' :
    type === 'edit' ? 'Lưu thay đổi' :
    type === 'delete' ? 'Xóa' :
    ''
  );

  // Determine loading text based on dialog type if not provided
  const typeSpecificLoadingText = 
    type === 'create' ? 'Đang thêm...' :
    type === 'edit' ? 'Đang lưu...' :
    type === 'delete' ? 'Đang xóa...' :
    loadingText || 'Đang xử lý...';

  // Determine button variant based on dialog type
  const submitVariant = 
    type === 'delete' ? 'destructive' :
    type === 'create' || type === 'edit' ? 'primary' :
    'default';
  
  // Get form errors if available
  const formErrors = formHandlingRef.current ? 
    formHandlingRef.current.getFormErrors(type) : 
    {};
  
  // Check if there are validation errors
  const hasValidationErrors = formErrors && Object.keys(formErrors).length > 0;
  
  // Combine props and internal errors
  const displayError = internalError || error;

  // Render content based on formComponent or children
  const renderContent = () => {
    // Show form-level validation errors
    const renderValidationErrors = () => {
      if (!showErrorSummary || !hasValidationErrors) return null;
      
      // Extract error messages from form errors
      let errorMessages: string[] = [];
      
      for (const key in formErrors) {
        if (Object.prototype.hasOwnProperty.call(formErrors, key)) {
          const error = formErrors[key];
          
          if (typeof error === 'string') {
            errorMessages.push(error);
          } else if (error?.message) {
            errorMessages.push(error.message);
          }
        }
      }
      
      if (errorMessages.length === 0) return null;
      
      return (
        <div className="rpt-form-error-summary" role="alert" aria-live="polite">
          <ul>
            {errorMessages.map((msg, index) => (
              <li key={index}>
                {renderErrorProp ? renderErrorProp(msg) : msg}
              </li>
            ))}
          </ul>
        </div>
      );
    };

    // For form components with better loading state
    if (FormComponent) {
      return (
        <div className="rpt-dialog-form-container">
          {displayError && (
            <div className="rpt-dialog-error" role="alert">
              {renderErrorContent(displayError)}
            </div>
          )}
          
          {renderValidationErrors()}
          
          <FormComponent 
            data={data} 
            type={type}
            onSubmit={handleSubmit}
            isLoading={loading || isSubmitting}
            disabled={disableFieldsWhenLoading && (loading || isSubmitting)}
            validationMode={validationMode}
            showInlineErrors={showInlineErrors}
            {...formProps}
          />
        </div>
      );
    }

    // Handle delete confirmation dialog without children
    if (type === 'delete' && !children) {
      return (
        <div className="rpt-dialog-delete-confirmation">
          {displayError && (
            <div className="rpt-dialog-error" role="alert">
              {renderErrorContent(displayError)}
            </div>
          )}
          <p>Bạn có chắc chắn muốn xóa mục này không? Hành động này không thể hoàn tác.</p>
        </div>
      );
    }
    
    // Handle custom children with enhanced loading states
    return (
      <div className="rpt-dialog-content-container">
        {displayError && (
          <div className="rpt-dialog-error" role="alert">
            {renderErrorContent(displayError)}
          </div>
        )}
        {children}
      </div>
    );
  };

  // Render footer with action buttons
  const renderFooter = () => {
    if (footer) {
      return footer;
    }
    
    // Show submit button for all operations including delete
    const shouldShowSubmitButton = showSubmitButton;
    
    return (
      <div className={cn("rpt-dialog-footer", { "rpt-dialog-footer-sticky": stickyFooter })}>
        {actionsPosition === 'left' && (
          <div className="rpt-dialog-actions-left">
            {showSubmitButton && (
              <Button 
                type="submit" 
                onClick={handleConfirm} 
                isLoading={isSubmitting}
                variant={submitVariant}
                size={buttonSize}
                className="rpt-dialog-submit-button"
                aria-label={submitLabel}
              >
                {type === 'delete' ? 'Xóa' : submitLabel}
              </Button>
            )}
          </div>
        )}
        
        <div className={cn("rpt-dialog-actions-center", { "rpt-dialog-actions-between": actionsPosition === 'between' })}>
          {actionsPosition === 'center' && showSubmitButton && (
            <Button 
              type="submit" 
              onClick={handleConfirm} 
              isLoading={isSubmitting}
              variant={submitVariant}
              size={buttonSize}
              className="rpt-dialog-submit-button"
              aria-label={submitLabel}
            >
              {type === 'delete' ? 'Xóa' : submitLabel}
            </Button>
          )}
        </div>
        
        {actionsPosition === 'right' && (
          <div className="rpt-dialog-actions-right">
            {shouldShowSubmitButton && (
              <Button 
                type="submit" 
                onClick={handleConfirm} 
                isLoading={isSubmitting}
                variant={submitVariant}
                size={buttonSize}
                className="rpt-dialog-submit-button"
                aria-label={submitLabel}
              >
                {type === 'delete' ? 'Xóa' : submitLabel}
              </Button>
            )}
            
            <Button 
              onClick={handleClose} 
              variant="secondary" 
              size={buttonSize}
              className="rpt-dialog-cancel-button"
              aria-label={cancelButtonLabel}
            >
              {cancelButtonLabel}
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className={cn("rpt-dialog-backdrop", backdropClassName)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
        >
          <motion.div
            ref={dialogRef}
            className={cn("rpt-dialog", className)}
            style={{ width, maxWidth }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            aria-describedby="dialog-description"
          >
            <div className="rpt-dialog-header">
              <h3 id="dialog-title" className="rpt-dialog-title">
                {dialogTitle}
              </h3>
              
              <button 
                className="rpt-dialog-close-button" 
                onClick={handleClose} 
                aria-label="Đóng"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-x" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M18 6l-12 12" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className={cn("rpt-dialog-content", contentClassName)}>
              {loading && (
                <div className="rpt-dialog-loading">
                  <DialogLoadingState 
                    loading={loading}
                    type={loadingAnimationType}
                    size={loadingIndicatorSize}
                    text={typeSpecificLoadingText}
                    variant={loadingEffect}
                  >
                    <div className="rpt-dialog-content-placeholder">
                      {/* Content placeholder while loading */}
                    </div>
                  </DialogLoadingState>
                </div>
              )}
              
              {!loading && renderContent()}
            </div>
            
            {renderFooter()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TableDialog;