import React, { useEffect, useState } from 'react';
import { cn } from '../utils/cn';
import { DialogType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './form/Button';
import { ButtonLoadingType } from './form/Button';

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
  onClose: () => void;
  
  /**
   * Callback when form is submitted
   */
  onSubmit?: (data: any) => void | Promise<void>;
  
  /**
   * Whether the dialog is in loading state
   */
  loading?: boolean;
  
  /**
   * Error message to display
   */
  error?: string | null;
  
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
   * Whether to show the form's submit button
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
   * Loading animation type for buttons
   * @default 'spinner'
   */
  loadingAnimationType?: ButtonLoadingType;
  
  /**
   * Whether to use sticky footer
   * @default false
   */
  stickyFooter?: boolean;
  
  /**
   * Button size option
   * @default 'md'
   */
  buttonSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /**
   * Whether to use elevated buttons
   * @default true
   */
  elevatedButtons?: boolean;
  
  /**
   * Position of action buttons
   * @default 'right'
   */
  actionsPosition?: 'right' | 'left' | 'center' | 'split';
}

/**
 * TableDialog component - Used for CRUD operations
 */
export const TableDialog: React.FC<TableDialogProps> = ({
  open,
  title,
  description,
  type = 'view',
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
  stickyFooter = true,
  buttonSize = 'md',
  elevatedButtons = true,
  actionsPosition = 'right',
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(open);
  const [formData, setFormData] = useState<any>(data);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Handle dialog close
  const handleClose = () => {
    if (loading || isSubmitting) return;
    
    setIsOpen(false);
    setTimeout(() => {
      onClose();
    }, 150); // Small delay for animation
  };
  
  // Handle outside click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnClickOutside && !loading && !isSubmitting) {
      handleClose();
    }
  };
  
  // Handle ESC key
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEsc && isOpen && !loading && !isSubmitting) {
        handleClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, closeOnEsc, loading, isSubmitting]);
  
  // Update local state when dialog open state changes
  useEffect(() => {
    setIsOpen(open);
  }, [open]);
  
  // Update local formData when data prop changes
  useEffect(() => {
    setFormData(data);
  }, [data]);
  
  // Handle form submit
  const handleSubmit = async (values: any) => {
    if (onSubmit && !loading && !isSubmitting) {
      try {
        setIsSubmitting(true);
        await onSubmit(values);
        handleClose();
      } catch (error) {
        // Error handling should be done in the parent component
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  // Prevent body scrolling when dialog is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);
  
  // If not open, don't render anything
  if (!open) {
    return null;
  }
  
  // Determine dialog title based on type if not provided
  const dialogTitle = title || (
    type === 'create' ? 'Thêm mới' :
    type === 'edit' ? 'Chỉnh sửa' :
    type === 'delete' ? 'Xác nhận xóa' :
    type === 'view' ? 'Xem chi tiết' : 'Dialog'
  );
  
  // Determine submit button label based on type if not provided
  const submitLabel = submitButtonLabel || (
    type === 'create' ? 'Thêm mới' :
    type === 'edit' ? 'Lưu thay đổi' :
    type === 'delete' ? 'Xóa' :
    ''
  );

  // Determine loading text
  const loadingText = 
    type === 'create' ? 'Đang thêm...' :
    type === 'edit' ? 'Đang lưu...' :
    type === 'delete' ? 'Đang xóa...' :
    'Đang xử lý...';

  // Determine button variant based on dialog type
  const submitVariant = 
    type === 'delete' ? 'destructive' :
    type === 'create' || type === 'edit' ? 'primary' :
    'default';

  // Render content based on formComponent or children
  const renderContent = () => {
    if (FormComponent) {
      return (
        <FormComponent
          data={formData}
          onSubmit={handleSubmit}
          type={type}
          loading={loading || isSubmitting}
          errors={error}
          showSubmitButton={false} /* We'll render buttons in the footer instead */
          submitButtonLabel={submitLabel}
          cancelButtonLabel={cancelButtonLabel}
          onCancel={handleClose}
          loadingAnimationType={loadingAnimationType}
          buttonSize={buttonSize}
          elevatedButtons={elevatedButtons}
        />
      );
    }
    
    // if (type === 'delete' && !children) {
    //   return (
    //     <div className="rpt-dialog-delete-confirmation">
    //       <p>Bạn có chắc chắn muốn xóa mục này không?</p>
    //       <p className="rpt-dialog-delete-warning">Hành động này không thể hoàn tác.</p>
    //     </div>
    //   );
    // }
    
    return children;
  };

  // Custom footer with submit/cancel buttons if no custom footer provided
  const renderFooter = () => {
    if (footer) {
      return footer;
    }
    
    // Determine if we should render footer buttons
    // Show footer if we have a form component or this is a delete dialog without children
    const shouldShowFooter = FormComponent || (type === 'delete' && !children) || (!FormComponent && showSubmitButton);
    
    if (shouldShowFooter) {
      return (
        <div className={cn('rpt-dialog-actions', `rpt-dialog-actions--${actionsPosition || 'right'}`)}>
          <Button 
            variant="secondary" 
            onClick={handleClose}
            disabled={loading || isSubmitting}
            size={buttonSize}
            elevated={elevatedButtons}
          >
            {cancelButtonLabel}
          </Button>
          
          {showSubmitButton && type !== 'view' && (
            <Button 
              variant={submitVariant}
              onClick={() => handleSubmit(formData)}
              isLoading={loading || isSubmitting}
              loadingText={loadingText}
              loadingType={loadingAnimationType}
              size={buttonSize}
              elevated={elevatedButtons}
            >
              {submitLabel}
            </Button>
          )}
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className={cn('rpt-dialog-backdrop', backdropClassName)}
          onClick={handleBackdropClick}
          aria-modal="true"
          role="dialog"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div 
            className={cn('rpt-dialog', `rpt-dialog-${type}`, className, {
              'rpt-dialog-with-footer': !!footer || (!FormComponent && type !== 'delete') || (FormComponent || (type === 'delete' && !children)),
              'rpt-dialog-sticky-footer': stickyFooter,
            })}
            style={{ 
              width, 
              maxWidth,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="rpt-dialog-header">
              <h3 className="rpt-dialog-title">{dialogTitle}</h3>
              {/* {description && <p className="rpt-dialog-description">{description}</p>} */}
              <button 
                type="button" 
                className="rpt-dialog-close" 
                onClick={handleClose}
                aria-label="Đóng"
                disabled={loading || isSubmitting}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="rpt-dialog-close-icon"
                >
                  <path d="M12 4l-8 8"></path>
                  <path d="M4 4l8 8"></path>
                </svg>
              </button>
            </div>
            
            <div className={cn('rpt-dialog-content', contentClassName)}>
              {error && !FormComponent && (
                <div className="rpt-dialog-error">
                  {typeof error === 'string' ? error : 'Đã xảy ra lỗi. Vui lòng thử lại.'}
                </div>
              )}
              
              {renderContent()}
            </div>
            
            <div className={cn(
              'rpt-dialog-footer', 
              stickyFooter && 'rpt-dialog-footer--sticky',
            )}>
              {renderFooter()}
            </div>
            
            {(loading || isSubmitting) && !showSubmitButton && (
              <div className="rpt-dialog-loading-overlay">
                <div className="rpt-dialog-spinner"></div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TableDialog;