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
    isReadOnly = false,
    isFormValid = true,
    disabled = false
  }: {
    dialogType: DialogType | null;
    onCancel: () => void;
    onSubmit: () => void;
    isSubmitting: boolean;
    buttonSize?: string;
    actionsPosition?: string;
    elevatedButtons?: boolean;
    isReadOnly?: boolean;
    isFormValid?: boolean;
    disabled?: boolean;
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

    const isSubmitButtonDisabled = 
      isSubmitting || 
      disabled ||
      (dialogType !== 'delete' && !isFormValid);

    return (
      <div className="rpt-dialog-footer">
        <div className={cn(
          "rpt-dialog-actions",
          `rpt-dialog-actions-${actionsPosition}`,
          elevatedButtons && "rpt-dialog-actions-elevated"
        )}>
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
              title={!isFormValid ? "Vui lòng điền đầy đủ thông tin" : ""}
            >
              {isSubmitting ? loadingLabel : submitLabel}
            </button>
          )}
        </div>
      </div>
    );
  }
);

DialogFooter.displayName = 'DialogFooter';

// Types for the form component props
export interface OptimizedFormComponentProps {
  data?: any;
  onSubmit?: (data: any, type: DialogType | null) => Promise<boolean> | boolean;
  onClose?: () => void;
  dialogType: DialogType | null;
  loading?: boolean;
  error?: string | Error | null;
  isReadOnly?: boolean;
  ref?: React.Ref<any>;
  onFormDirty?: (isDirty: boolean) => void;
  skipInitialValidation?: boolean;
  dialogRef?: React.RefObject<HTMLDivElement>;
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
  onSubmit?: (data: any, type: DialogType | null) => Promise<boolean> | boolean;
  loading?: boolean;
  error?: string | Error | null;
  width?: string | number;
  closeOnClickOutside?: boolean;
  closeOnEsc?: boolean;
  actionsPosition?: 'left' | 'right' | 'center' | 'between';
  buttonSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  elevatedButtons?: boolean;
  reducedMotion?: boolean;
  disableSubmitUntilDirty?: boolean;
  validateOnMount?: boolean;
  skipInitialValidation?: boolean;
}

// Simple dialog implementation without conditional hooks
function SimpleDialogImplementation<T extends BaseTableData = BaseTableData>({
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
  validateOnMount = false,
  skipInitialValidation = true
}: OptimizedDialogProps<T>) {
  
  // ALL HOOKS ARE CALLED UNCONDITIONALLY AT THE TOP LEVEL
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const formRef = useRef<any>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const dataRef = useRef<T | null | undefined>(data);
  const dialogTypeRef = useRef<DialogType | null>(dialogType);
  const onSubmitRef = useRef(onSubmit);
  const [formTouched, setFormTouched] = useState(false);
  
  // ALWAYS call useFormHandling - never conditionally
  const formContext = useFormHandling();
  
  // ALL useEffect hooks are called unconditionally
  useEffect(() => {
    dataRef.current = data;
    dialogTypeRef.current = dialogType;
  }, [data, dialogType]);
  
  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);
  
  // Reset states effect
  useEffect(() => {
    if (!open) {
      setIsSubmitting(false);
      setIsFormDirty(false);
      setIsFormValid(false);
      setFormTouched(false);
      setLocalError(null);
      setHasAttemptedSubmit(false);
      setHasInteracted(false);
      return;
    }
    
    if (dialogType === 'delete') {
      setIsFormDirty(true);
      setIsFormValid(true);
    } else {
      setIsFormDirty(false);
      setIsFormValid(!validateOnMount);
      setFormTouched(false);
      setLocalError(null);
      setHasAttemptedSubmit(false);
      setHasInteracted(false);
    }
  }, [open, dialogType, validateOnMount]);

  // Escape key effect
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (open && closeOnEsc && e.key === 'Escape' && !isSubmitting && !loading) {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [closeOnEsc, open, isSubmitting, loading, onClose]);

  // Form validity tracking effect
  useEffect(() => {
    if (dialogType === 'delete') {
      setIsFormValid(true);
      return;
    }
    
    if (dialogType === 'create' && !validateOnMount) {
      setIsFormValid(true);
      return;
    }
    
    if (formContext && dialogType && open) {
      try {
        const initialValidity = formContext.isFormValid(dialogType as DialogMode);
        setIsFormValid(initialValidity);
      } catch (error) {
        console.error('Error checking form validity:', error);
        setIsFormValid(true);
      }
    }
  }, [dialogType, formContext, open, validateOnMount]);

  // Form change detection effect
  useEffect(() => {
    if (!open || !dialogRef.current) return;
    
    if (formContext || (formRef.current && (typeof formRef.current.isDirty === 'function'))) {
      return;
    }
    
    const formElements = dialogRef.current.querySelectorAll('input, select, textarea');
    
    const handleFormChange = () => {
      setFormTouched(true);
      setIsFormDirty(true);
      
      if (!hasAttemptedSubmit) {
        setLocalError(null);
      }
    };
    
    formElements.forEach(element => {
      element.addEventListener('input', handleFormChange);
      element.addEventListener('change', handleFormChange);
    });
    
    return () => {
      formElements.forEach(element => {
        element.removeEventListener('input', handleFormChange);
        element.removeEventListener('change', handleFormChange);
      });
    };
  }, [open, dialogType, formContext, hasAttemptedSubmit]);

  // ALL useCallback hooks are called unconditionally
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnClickOutside && !isSubmitting && !loading) {
      onClose?.();
    }
  }, [closeOnClickOutside, isSubmitting, loading, onClose]);

  const handleFormDirty = useCallback((isDirty: boolean) => {
    setIsFormDirty(isDirty);
    
    if (isDirty) {
      setHasInteracted(true);
      setFormTouched(true);
    }
    
    if (formContext && dialogTypeRef.current) {
      formContext.setFormDirty(isDirty, dialogTypeRef.current as DialogMode);
    }
  }, [formContext]);

  // CRITICAL FIX: Enhanced error recovery effect
  useEffect(() => {
    // Clear loading state if error occurs
    if (error && isSubmitting) {
      console.log('[OptimizedDialog] Error detected, clearing loading state');
      setIsSubmitting(false);
      setLocalError(typeof error === 'string' ? error : error.message);
    }
  }, [error, isSubmitting]);

  // CRITICAL FIX: Auto-recovery from stuck loading states
  useEffect(() => {
    if (isSubmitting) {
      // Emergency timeout to prevent stuck loading
      const emergencyTimeout = setTimeout(() => {
        console.warn('[OptimizedDialog] Emergency recovery from stuck loading state');
        setIsSubmitting(false);
        setLocalError('Thao tác bị gián đoạn. Vui lòng thử lại.');
      }, 30000); // 30 second emergency timeout

      return () => clearTimeout(emergencyTimeout);
    }
  }, [isSubmitting]);

  // CRITICAL FIX: Enhanced submit with comprehensive error handling
  const handleSubmit = useCallback(async () => {
    const currentDialogType = dialogTypeRef.current;
    const currentData = dataRef.current;
    
    if (!currentDialogType || !onSubmitRef.current || isSubmitting || loading) {
      return;
    }
    
    setHasAttemptedSubmit(true);
    setHasInteracted(true);
    setIsSubmitting(true);
    setLocalError(null);
    
    try {
      console.log('[OptimizedDialog] Starting submission for type:', currentDialogType);
      
      if (currentDialogType === 'delete') {
        try {
          const result = onSubmitRef.current(currentData || {}, currentDialogType);
          const finalResult = result instanceof Promise ? await result : result;
          
          console.log('[OptimizedDialog] Delete result:', finalResult);
          
          // CRITICAL FIX: Always clear loading state
          setIsSubmitting(false);
          
          // Don't close dialog here - let parent handle it based on result
          return;
        } catch (deleteError) {
          console.error('[OptimizedDialog] Delete operation failed:', deleteError);
          
          // CRITICAL FIX: Specific error handling for delete operations
          const errorMessage = deleteError instanceof Error 
            ? deleteError.message 
            : 'Xóa thất bại. Vui lòng thử lại.';
          
          setLocalError(errorMessage);
          setIsSubmitting(false);
          
          // Keep dialog open on delete error for user to see the error and retry
          return;
        }
      }
      
      // Handle other dialog types
      if (formContext && currentDialogType) {
        try {
          const { isValid, data: formData, errors } = await formContext.validateAndGetFormData(currentDialogType as DialogMode);
          
          if (!isValid || !formData) {
            const errorMessage = errors && typeof errors === 'object' && '_form' in errors 
              ? String(errors._form) 
              : 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
            setLocalError(errorMessage);
            setIsSubmitting(false);
            return;
          }
          
          if (formData && Object.keys(formData).length === 0 && (currentDialogType !== 'delete' as DialogType)) {
            setLocalError('Không có dữ liệu được nhập. Vui lòng điền vào form.');
            setIsSubmitting(false);
            return;
          }
          
          const finalData = currentDialogType === 'edit' && currentData 
            ? { ...currentData, ...formData } 
            : formData;
          
          if (currentDialogType === 'edit' && currentData?.id && !finalData.id) {
            finalData.id = currentData.id;
          }
          
          const result = onSubmitRef.current(finalData, currentDialogType);
          const finalResult = result instanceof Promise ? await result : result;
          
          console.log('[OptimizedDialog] Form submission result:', finalResult);
          setIsSubmitting(false);
          
          // Don't close dialog here - let parent handle it
          return;
        } catch (err) {
          console.error('[OptimizedDialog] Form submission error:', err);
          
          const errorMessage = err instanceof Error 
            ? err.message 
            : 'Có lỗi xảy ra khi gửi biểu mẫu. Vui lòng thử lại.';
          
          setLocalError(errorMessage);
          setIsSubmitting(false);
          return;
        }
      }
      
      // Fallback: use original data
      try {
        const result = onSubmitRef.current(currentData || {}, currentDialogType);
        const finalResult = result instanceof Promise ? await result : result;
        
        console.log('[OptimizedDialog] Fallback submission result:', finalResult);
        setIsSubmitting(false);
        
        // Don't close dialog here - let parent handle it
        return;
      } catch (err) {
        console.error('[OptimizedDialog] Fallback submission error:', err);
        
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'Có lỗi xảy ra. Vui lòng thử lại.';
        
        setLocalError(errorMessage);
        setIsSubmitting(false);
        return;
      }
    } catch (err) {
      console.error('[OptimizedDialog] Unexpected error during submission:', err);
      
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Có lỗi không mong muốn xảy ra. Vui lòng thử lại.';
      
      setLocalError(errorMessage);
      setIsSubmitting(false);
    }
  }, [isSubmitting, loading, onClose, formContext]);

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

  const isReadOnly = dialogType === 'view';
  const displayError = localError || error;
  const isDelete = dialogType === 'delete';

  return (
    <div className="rpt-dialog-container">
      <motion.div
        className="rpt-dialog-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleBackdropClick}
        style={{ 
          // CRITICAL FIX: Ensure dialog is above loading overlays
          zIndex: 1000 
        }}
      >
        <motion.div
          className={cn("rpt-dialog", `rpt-dialog-${buttonSize}`)}
          style={{ 
            width, 
            maxWidth: '95vw',
            maxHeight: '95vh',
            zIndex: 1001 
          }}
          {...animationSettings}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="rpt-dialog-header">
            <h2 className="rpt-dialog-title">{title}</h2>
            {/* {dialogDescription && (
              <p className="rpt-dialog-description">{dialogDescription}</p>
            )} */}
            <button 
              className="rpt-dialog-close" 
              onClick={onClose}
              aria-label="Close dialog"
            >
              ×
            </button>
          </div>

          <DialogContent
            error={(hasAttemptedSubmit || hasInteracted) ? displayError : null}
            description={dialogDescription}
            isLoading={isSubmitting || loading}
          >
            {FormComponent && (
              <FormComponent
                data={data}
                dialogType={dialogType}
                isReadOnly={isReadOnly}
                onSubmit={onSubmit}
                onClose={onClose}
                loading={isSubmitting || loading}
                error={(hasAttemptedSubmit || hasInteracted) ? displayError : null}
                onFormDirty={handleFormDirty}
                skipInitialValidation={skipInitialValidation || !validateOnMount}
                ref={formRef}
                dialogRef={dialogRef}
              />
            )}
          </DialogContent>

          <DialogFooter
            dialogType={dialogType}
            onCancel={onClose!}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting || loading}
            buttonSize={buttonSize}
            actionsPosition={actionsPosition}
            elevatedButtons={elevatedButtons}
            isReadOnly={isReadOnly}
            isFormValid={dialogType === 'delete' || dialogType === 'create' ? true : isFormValid}
            disabled={isSubmitting || loading || (dialogType === 'edit' && !isFormValid)}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

// Safe wrapper that handles AnimatePresence
export function OptimizedDialog<T extends BaseTableData = BaseTableData>(props: OptimizedDialogProps<T>) {
  return (
    <AnimatePresence>
      {props.open && <SimpleDialogImplementation {...props} />}
    </AnimatePresence>
  );
}

export default OptimizedDialog;
