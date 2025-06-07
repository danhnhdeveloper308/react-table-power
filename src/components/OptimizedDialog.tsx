import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { DialogMode, DialogType, BaseTableData } from '../types';
import { useFormHandling } from '../contexts/FormHandlingContext';

// Separate component for dialog content to prevent unnecessary re-renders
const DialogContent = memo(
  ({ 
    children, 
    error, 
    description,
    isLoading 
  }: { 
    children: React.ReactNode; 
    error?: string | Error | null;
    description?: string;
    isLoading: boolean;
  }) => {
    const errorMessage = error 
      ? (typeof error === 'string' ? error : error.message || 'An error occurred') 
      : null;
      
    return (
      <div className="rpt-dialog-content">
        {description && <p className="rpt-dialog-description">{description}</p>}
        
        {errorMessage && (
          <div className="rpt-dialog-error" role="alert">
            {errorMessage}
          </div>
        )}
        
        <div className={cn('rpt-dialog-form-container', {
          'rpt-dialog-loading': isLoading,
        })}>
          {isLoading && (
            <div className="rpt-dialog-loading-overlay">
              <div className="rpt-dialog-loading-spinner"></div>
              <span>Loading...</span>
            </div>
          )}
          
          {children}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for the memo
    return (
      prevProps.isLoading === nextProps.isLoading &&
      prevProps.error === nextProps.error &&
      prevProps.description === nextProps.description
    );
  }
);

DialogContent.displayName = 'DialogContent';

// Separate component for dialog footer to prevent unnecessary re-renders
const DialogFooter = memo(
  ({ 
    dialogType,
    onCancel,
    onSubmit,
    isSubmitting,
    buttonSize = 'md',
    actionsPosition = 'right',
    elevatedButtons = true,
    isFormDirty = false,
    isReadOnly = false,
    disableSubmitUntilDirty = true,
  }: { 
    dialogType: DialogType | null;
    onCancel: () => void;
    onSubmit: () => void;
    isSubmitting: boolean;
    buttonSize?: string;
    actionsPosition?: string;
    elevatedButtons?: boolean;
    isFormDirty?: boolean;
    isReadOnly?: boolean;
    disableSubmitUntilDirty?: boolean;
  }) => {
    // Determine submit button label based on dialog type
    const submitLabel = {
      create: 'Tạo mới',
      edit: 'Lưu thay đổi',
      delete: 'Xóa',
      view: '',
      custom: 'Xác nhận'
    }[dialogType ?? 'custom'] || 'Xác nhận';

    // Determine loading label based on dialog type
    const loadingLabel = {
      create: 'Đang tạo...',
      edit: 'Đang lưu...',
      delete: 'Đang xóa...',
      view: '',
      custom: 'Đang xử lý...'
    }[dialogType ?? "custom"] || 'Đang xử lý...';

    // Calculate if submit button should be disabled
    const isSubmitButtonDisabled = isSubmitting || 
      (disableSubmitUntilDirty && !isFormDirty && dialogType !== 'delete');

    return (
      <div className="rpt-dialog-footer">
        <div className={cn(
          "rpt-dialog-actions",
          `rpt-dialog-actions-${actionsPosition}`,
          elevatedButtons && "rpt-dialog-actions-elevated"
        )}>
          {/* Cancel Button */}
          <button
            className={cn(
              "rpt-button",
              "rpt-button-secondary",
              `rpt-button-${buttonSize}`
            )}
            onClick={onCancel}
            disabled={isSubmitting}
            type="button"
          >
            Hủy
          </button>

          {/* Submit Button */}
          {dialogType !== 'view' && !isReadOnly && (
            <button
              className={cn(
                "rpt-button",
                dialogType === 'delete' ? "rpt-button-destructive" : "rpt-button-primary",
                `rpt-button-${buttonSize}`,
                isSubmitButtonDisabled && "rpt-button-disabled"
              )}
              onClick={onSubmit}
              disabled={isSubmitButtonDisabled}
              type="button"
              title={!isFormDirty && disableSubmitUntilDirty ? "Chưa có thay đổi nào" : ""}
            >
              {isSubmitting ? loadingLabel : submitLabel}
            </button>
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render when these props change
    return (
      prevProps.dialogType === nextProps.dialogType &&
      prevProps.isSubmitting === nextProps.isSubmitting &&
      prevProps.buttonSize === nextProps.buttonSize &&
      prevProps.actionsPosition === nextProps.actionsPosition &&
      prevProps.elevatedButtons === nextProps.elevatedButtons &&
      prevProps.isFormDirty === nextProps.isFormDirty &&
      prevProps.isReadOnly === nextProps.isReadOnly
    );
  }
);

DialogFooter.displayName = 'DialogFooter';

// Types for the form component props
export interface OptimizedFormComponentProps {
  data?: any;
  // Fix the return type to allow undefined
  onSubmit?: (data: any) => Promise<boolean> | boolean | undefined;
  onClose?: () => void;
  dialogType: DialogType | null;
  loading?: boolean;
  error?: string | Error | null;
  isReadOnly?: boolean;
  ref?: React.Ref<any>;
  /**
   * Function to notify parent when form becomes dirty/changed
   */
  onFormDirty?: (isDirty: boolean) => void;
  /**
   * Whether form validation errors should be shown
   */
  showValidationErrors?: boolean;
}

// Types for the dialog props
export interface OptimizedDialogProps<T extends BaseTableData = BaseTableData> {
  open?: boolean;
  dialogType: DialogType | null;
  dialogTitle?: string;
  dialogDescription?: string;
  data?: T | null;
  formComponent?: React.ComponentType<OptimizedFormComponentProps>;
  onClose?: () => void;
  onSubmit?: (data: any, type: DialogType | null) => Promise<boolean> | boolean | undefined;
  loading?: boolean;
  error?: string | Error | null;
  width?: string | number;
  closeOnClickOutside?: boolean;
  closeOnEsc?: boolean;
  actionsPosition?: 'left' | 'right' | 'center' | 'between';
  buttonSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  elevatedButtons?: boolean;
  reducedMotion?: boolean;
  /**
   * Whether to disable submit button until form is dirty
   * @default true
   */
  disableSubmitUntilDirty?: boolean;
}

// The main optimized dialog component
export function OptimizedDialog<T extends BaseTableData = BaseTableData>({
  open = false,
  dialogType = 'custom',
  dialogTitle,
  dialogDescription,
  data,
  formComponent: FormComponent,
  onClose,
  onSubmit,
  loading = false,
  error,
  width = '500px',
  closeOnClickOutside = true,
  closeOnEsc = true,
  actionsPosition = 'right',
  buttonSize = 'md',
  elevatedButtons = true,
  reducedMotion = false,
  disableSubmitUntilDirty = true
}: OptimizedDialogProps<T>) {
  // Local state for controlled values
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const formRef = useRef<any>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  
  // Track if form has been touched (any field interacted with)
  const [formTouched, setFormTouched] = useState(false);
  
  // Form context for validation and submission
  const formContext = useFormHandling();
  
  // Reset form dirty state and validation errors when dialog opens or type changes
  useEffect(() => {
    if (!open) {
      setIsSubmitting(false);
      setIsFormDirty(false);
      setShowValidationErrors(false);
      setFormTouched(false);
      setLocalError(null);
    } else {
      // For delete operations, automatically set as dirty to enable submit button
      if (dialogType === 'delete') {
        setIsFormDirty(true);
      } else {
        setIsFormDirty(false);
        setShowValidationErrors(false);
        setFormTouched(false);
        setLocalError(null);
      }
    }
  }, [open, dialogType]);

  // Handle Escape key press
  useEffect(() => {
    if (!open || !closeOnEsc) return;

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting && !loading) {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [closeOnEsc, open, isSubmitting, loading, onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnClickOutside && !isSubmitting && !loading) {
      onClose?.();
    }
  }, [closeOnClickOutside, isSubmitting, loading, onClose]);

  // Handle form dirty state changes - improved to track any interaction
  const handleFormDirty = useCallback((isDirty: boolean) => {
    setIsFormDirty(isDirty);
    if (isDirty) {
      setFormTouched(true);
    }
  }, []);
  
  // Register listeners for form field interactions - to detect any changes
  useEffect(() => {
    if (!open || !dialogRef.current) return;
    
    // Find all form elements
    const formElements = dialogRef.current.querySelectorAll('input, select, textarea');
    
    // Handler for any interaction with form fields
    const handleFormInteraction = () => {
      setFormTouched(true);
      setIsFormDirty(true);
    };
    
    // Add listeners to each form element
    formElements.forEach(element => {
      element.addEventListener('input', handleFormInteraction);
      element.addEventListener('change', handleFormInteraction);
      element.addEventListener('focus', handleFormInteraction);
    });
    
    // Cleanup
    return () => {
      formElements.forEach(element => {
        element.removeEventListener('input', handleFormInteraction);
        element.removeEventListener('change', handleFormInteraction);
        element.removeEventListener('focus', handleFormInteraction);
      });
    };
  }, [open, dialogType]);

  // Handle dialog submission in an optimized way
  const handleSubmit = useCallback(async () => {
    if (!dialogType || !onSubmit || isSubmitting || loading) return;
    
    try {
      setIsSubmitting(true);
      setLocalError(null);
      
      // Show validation errors when submitting
      setShowValidationErrors(true);
      
      // Special case for delete operations
      if (dialogType === 'delete') {
        const result = await onSubmit(data, dialogType);
        setIsSubmitting(false);
        
        if (result === true || result === undefined) {
          onClose?.();
        }
        
        return;
      }
      
      // For other operations, use form validation
      if (formRef.current) {
        // Try to use form context first
        if (formContext) {
          try {
            const validation = await formContext.validateAndGetFormData(dialogType as DialogMode);
            
            // Check if validation failed but returned no specific errors
            // This often happens with empty forms and no required fields
            if (!validation.isValid && Object.keys(validation.errors).length === 0) {
              // For create operations, we need at least some data
              if (dialogType === 'create' && (!validation.data || Object.keys(validation.data).length === 0)) {
                setLocalError("Vui lòng điền thông tin trước khi tạo mới");
                setIsSubmitting(false);
                return;
              }
            }
            
            // Otherwise proceed if we have data
            if (validation.data) {
              // Preserve ID for edit operations
              if (dialogType === 'edit' && data && 'id' in data && !('id' in validation.data)) {
                (validation.data as any).id = (data as any).id;
              }
              
              const result = await onSubmit(validation.data, dialogType);
              setIsSubmitting(false);
              
              if (result === true || result === undefined) {
                onClose?.();
              }
              
              return;
            } else {
              // No data but also no errors - general error
              setLocalError("Form không chứa dữ liệu hợp lệ");
              setIsSubmitting(false);
              return;
            }
          } catch (err) {
            console.error("Validation error:", err);
            setLocalError(err instanceof Error ? err.message : "Lỗi xác thực dữ liệu");
            setIsSubmitting(false);
            return;
          }
        }
        
        // Direct form access as fallback
        if (typeof formRef.current.getValidatedValues === 'function') {
          try {
            const formData = await formRef.current.getValidatedValues();
            
            if (formData) {
              // Preserve ID for edit operations
              if (dialogType === 'edit' && data && 'id' in data && !('id' in formData)) {
                (formData as any).id = (data as any).id;
              }
              
              const result = await onSubmit(formData, dialogType);
              setIsSubmitting(false);
              
              if (result === true || result === undefined) {
                onClose?.();
              }
              
              return;
            } else {
              setLocalError("Form không chứa dữ liệu hợp lệ");
              setIsSubmitting(false);
              return;
            }
          } catch (err) {
            console.error('Form validation error:', err);
            setLocalError(err instanceof Error ? err.message : "Lỗi xác thực dữ liệu");
            setIsSubmitting(false);
            return;
          }
        }
        
        // Fallback to using data directly if we've reached this point
        // For create operations, check if we have at least some data
        if (dialogType === 'create' && (!data || Object.keys(data || {}).length === 0)) {
          setLocalError("Vui lòng điền thông tin trước khi tạo mới");
          setIsSubmitting(false);
          return;
        }
        
        const result = await onSubmit(data || {}, dialogType);
        setIsSubmitting(false);
        
        if (result === true || result === undefined) {
          onClose?.();
        }
      } else {
        // No form ref, use data directly
        // For create operations, check if we have at least some data
        if (dialogType === 'create' && (!data || Object.keys(data || {}).length === 0)) {
          setLocalError("Vui lòng điền thông tin trước khi tạo mới");
          setIsSubmitting(false);
          return;
        }
        
        const result = await onSubmit(data || {}, dialogType);
        setIsSubmitting(false);
        
        if (result === true || result === undefined) {
          onClose?.();
        }
      }
    } catch (err) {
      console.error('Dialog submission error:', err);
      setLocalError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi gửi biểu mẫu");
      setIsSubmitting(false);
    }
  }, [dialogType, onSubmit, isSubmitting, loading, onClose, data, formContext]);

  // Don't render if not open
  if (!open) {
    return null;
  }

  // Determine dialog title based on type
  const title = dialogTitle || {
    create: 'Thêm mới',
    edit: 'Chỉnh sửa',
    view: 'Xem chi tiết',
    delete: 'Xác nhận xóa',
    custom: 'Thao tác'
  }[dialogType ?? 'custom'] || 'Dialog';

  // Animation settings based on reduced motion preference
  const animationSettings = reducedMotion ? {
    initial: {},
    animate: {},
    exit: {},
    transition: { duration: 0.1 }
  } : {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 20, scale: 0.95 },
    transition: { duration: 0.2 }
  };

  // Check if the form is in read-only mode
  const isReadOnly = dialogType === 'view';

  // Use combined error for display
  const displayError = localError || error;

  return (
    <AnimatePresence>
      {open && (
        <div className="rpt-dialog-container">
          <motion.div
            className="rpt-dialog-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
          >
            <motion.div
              ref={dialogRef}
              className={cn('rpt-dialog', `rpt-dialog-${dialogType}`)}
              style={{ width }}
              {...animationSettings}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Dialog Header */}
              <div className="rpt-dialog-header">
                <h2 className="rpt-dialog-title">{title}</h2>
                <button
                  className="rpt-dialog-close"
                  onClick={onClose}
                  disabled={isSubmitting || loading}
                  type="button"
                  aria-label="Close dialog"
                >
                  ×
                </button>
              </div>

              {/* Dialog Content - Using memoized component */}
              <DialogContent 
                error={displayError}
                description={dialogDescription}
                isLoading={loading || isSubmitting}
              >
                {dialogType === 'delete' ? (
                  <div className="rpt-dialog-delete-confirmation">
                    <p>Bạn có chắc chắn muốn xóa mục này không? Hành động này không thể hoàn tác.</p>
                  </div>
                ) : FormComponent ? (
                  <FormComponent
                    ref={formRef}
                    data={data}
                    dialogType={dialogType}
                    onSubmit={(formData) => onSubmit?.(formData, dialogType)}
                    onClose={onClose}
                    loading={loading || isSubmitting}
                    error={displayError}
                    isReadOnly={isReadOnly}
                    onFormDirty={handleFormDirty}
                    showValidationErrors={showValidationErrors}
                  />
                ) : (
                  <div className="rpt-dialog-placeholder">
                    Không tìm thấy form component cho {dialogType}
                  </div>
                )}
              </DialogContent>

              {/* Dialog Footer - Updated isFormDirty logic */}
              <DialogFooter
                dialogType={dialogType}
                onCancel={onClose!}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting || loading}
                buttonSize={buttonSize}
                actionsPosition={actionsPosition}
                elevatedButtons={elevatedButtons}
                isFormDirty={isFormDirty || formTouched}
                isReadOnly={isReadOnly}
                disableSubmitUntilDirty={disableSubmitUntilDirty}
              />
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default OptimizedDialog;
