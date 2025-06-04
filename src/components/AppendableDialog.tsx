import React, { useEffect, useState } from 'react';
import { TableDialog, TableDialogProps } from './TableDialog';
import { BaseTableData, DialogType } from '../types';
import { useTableDialog } from '../hooks/useTableDialog';
import { cn } from '../utils/cn';
import { ErrorState } from './ErrorState';
import { motion, AnimatePresence } from 'framer-motion';
import { ButtonLoadingType } from './form/Button';
import LoadingState from './LoadingState';

export interface DialogFormComponentProps {
  data?: any;
  loading?: boolean;
  error?: Error | null | string;
  onSubmit: (data: any) => void;
  onClose: () => void;
  loadingAnimationType?: ButtonLoadingType;
}

export interface AppendableDialogProps<T extends BaseTableData = BaseTableData> extends Omit<TableDialogProps, 'open' | 'onClose' | 'type' | 'data' | 'onSubmit' | 'title' | 'description' | 'error'> {
  /**
   * Active record data
   */
  activeRecord?: T;
  
  /**
   * Active dialog type
   */
  activeDialog?: DialogType;
  
  /**
   * Dialog title
   */
  dialogTitle?: string;
  
  /**
   * Dialog description
   */
  dialogDescription?: string;
  
  /**
   * Form component for each dialog type
   */
  formComponents?: {
    create?: React.ComponentType<any>;
    edit?: React.ComponentType<any>;
    view?: React.ComponentType<any>;
    delete?: React.ComponentType<any>;
    [key: string]: React.ComponentType<any> | undefined;
  };
  
  /**
   * Callback when form is submitted
   */
  onSubmit?: (data: any, type: DialogType) => void | Promise<void>;
  
  /**
   * Callback when dialog is closed
   */
  onClose?: () => void;

  /**
   * Error to show in the dialog
   */
  error?: Error | null | string;

  /**
   * Whether the dialog can be closed by clicking outside
   * @default true
   */
  closeOnClickOutside?: boolean;

  /**
   * Whether the dialog can be closed by pressing Escape
   * @default true
   */
  closeOnEsc?: boolean;

  /**
   * Width of the dialog
   */
  width?: string | number;
  
  /**
   * Type of loading animation to show in buttons
   * @default 'spinner'
   */
  loadingAnimationType?: ButtonLoadingType;
  
  /**
   * Position of action buttons
   * @default 'right'
   */
  actionsPosition?: 'right' | 'left' | 'center' | 'split';
  
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
   * Whether to use sticky footer
   * @default true
   */
  stickyFooter?: boolean;
}

/**
 * AppendableDialog component - Used to append dialog functionality to DataTable
 */
export function AppendableDialog<T extends BaseTableData = BaseTableData>({
  activeRecord,
  activeDialog,
  dialogTitle,
  dialogDescription,
  formComponents = {},
  onSubmit,
  onClose,
  closeOnClickOutside = true,
  closeOnEsc = true,
  width,
  loadingAnimationType = 'spinner',
  actionsPosition = 'right',
  buttonSize = 'md',
  elevatedButtons = true,
  stickyFooter = true,
  ...props
}: AppendableDialogProps<T>) {
  const [isVisible, setIsVisible] = useState(false);

  // Update visibility when active dialog changes
  useEffect(() => {
    setIsVisible(!!activeDialog);
  }, [activeDialog]);

  // Handle Escape key press
  useEffect(() => {
    if (!closeOnEsc || !isVisible) return;
    
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [closeOnEsc, isVisible, onClose]);

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnClickOutside) {
      onClose?.();
    }
  };

  // Render nothing if no active dialog
  if (!activeDialog) return null;

  // Get the appropriate form component based on dialog type
  const FormComponent = activeDialog && formComponents[activeDialog];

  // Get dialog class based on type
  const dialogClass = `rpt-dialog-${activeDialog}`;

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="rpt-dialog-container">
          <motion.div
            className="rpt-dialog-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
          >
            <motion.div
              className={cn("rpt-dialog", dialogClass)}
              style={{ width: width || 'auto' }}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {/* Dialog header */}
              <div className="rpt-dialog-header">
                <h2 className="rpt-dialog-title">{dialogTitle}</h2>
                <button 
                  className="rpt-dialog-close" 
                  onClick={onClose}
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>

              {/* Dialog content */}
              <div className="rpt-dialog-content">
                {dialogDescription && (
                  <p className="rpt-dialog-description">{dialogDescription}</p>
                )}
                {props.loading && <LoadingState />}
                {props.error && <ErrorState error={props.error} />}
                
                {!props.loading && FormComponent ? (
                  <FormComponent
                    data={activeRecord}
                    onSubmit={(data: any) => onSubmit?.(data, activeDialog)}
                    onClose={onClose}
                    loading={props.loading}
                    error={props.error}
                    loadingAnimationType={loadingAnimationType}
                  />
                ) : (
                  // Default simple dialog content for delete
                  activeDialog === 'delete' && !FormComponent && (
                    <div className="rpt-dialog-delete-content">
                      {/* <p>
                        {dialogDescription}
                      </p> */}
                      <div className={cn(
                        'rpt-dialog-actions', 
                        `rpt-dialog-actions--${actionsPosition}`
                      )}>
                        <button 
                          className="rpt-btn rpt-btn--secondary" 
                          onClick={onClose}
                        >
                          Hủy
                        </button>
                        <button 
                          className={cn(
                            'rpt-btn',
                            'rpt-btn--destructive',
                            props.loading && 'rpt-btn--loading',
                            props.loading && `rpt-btn--loading-${loadingAnimationType}`,
                            elevatedButtons && 'rpt-btn--elevated',
                            `rpt-btn--${buttonSize}`
                          )}
                          onClick={() => onSubmit?.(activeRecord, activeDialog)}
                          disabled={props.loading}
                        >
                          {props.loading && (
                            <span className="rpt-btn-loader" aria-hidden="true">
                              {loadingAnimationType === 'dots' && (
                                <>
                                  <span></span>
                                  <span></span>
                                  <span></span>
                                </>
                              )}
                              {loadingAnimationType === 'wave' && (
                                <>
                                  <span></span>
                                  <span></span>
                                  <span></span>
                                  <span></span>
                                  <span></span>
                                </>
                              )}
                            </span>
                          )}
                          <span className="rpt-btn-text">
                            {props.loading ? 'Đang xóa...' : 'Xóa'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
              
              {/* Footer for custom form components - positioned at bottom right */}
              {FormComponent && (
                <div className={cn(
                  'rpt-dialog-footer',
                  stickyFooter && 'rpt-dialog-footer--sticky'
                )}>
                  <div className={cn(
                    'rpt-dialog-actions', 
                    `rpt-dialog-actions--${actionsPosition}`
                  )}>
                    <button 
                      className={cn(
                        'rpt-btn', 
                        'rpt-btn--secondary',
                        `rpt-btn--${buttonSize}`,
                        elevatedButtons && 'rpt-btn--elevated'
                      )}
                      onClick={onClose}
                      disabled={props.loading}
                    >
                      Hủy
                    </button>
                    {activeDialog !== 'view' && (
                    <button 
                      className={cn(
                        'rpt-btn',
                        activeDialog === 'delete' ? 'rpt-btn--destructive' : 'rpt-btn--primary',
                        props.loading && 'rpt-btn--loading',
                        props.loading && `rpt-btn--loading-${loadingAnimationType}`,
                        elevatedButtons && 'rpt-btn--elevated',
                        `rpt-btn--${buttonSize}`
                      )}
                      onClick={() => onSubmit?.(activeRecord, activeDialog)}
                      disabled={props.loading}
                    >
                      {props.loading && (
                        <span className="rpt-btn-loader" aria-hidden="true">
                          {loadingAnimationType === 'dots' && (
                            <>
                              <span></span>
                              <span></span>
                              <span></span>
                            </>
                          )}
                          {loadingAnimationType === 'wave' && (
                            <>
                              <span></span>
                              <span></span>
                              <span></span>
                              <span></span>
                              <span></span>
                            </>
                          )}
                        </span>
                      )}
                      <span className="rpt-btn-text">
                        {props.loading ? 
                          (activeDialog === 'create' ? 'Đang thêm...' : 
                           activeDialog === 'edit' ? 'Đang lưu...' : 
                           activeDialog === 'delete' ? 'Đang xóa...' : 'Đang xử lý...') : 
                          (activeDialog === 'create' ? 'Thêm mới' : 
                           activeDialog === 'edit' ? 'Lưu thay đổi' : 
                           activeDialog === 'delete' ? 'Xóa' : 'OK')
                        }
                      </span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function useAppendableDialog<T extends BaseTableData = BaseTableData>() {
  const {
    open,
    dialogType,
    dialogData,
    dialogTitle,
    dialogDescription,
    loading,
    error,
    openCreateDialog,
    openEditDialog,
    openViewDialog,
    openDeleteDialog,
    openCustomDialog,
    submitDialog,
    closeDialog,
  } = useTableDialog();

  const getDialogProps = () => ({
    activeRecord: dialogData,
    activeDialog: open ? dialogType : undefined,
    dialogTitle,
    dialogDescription,
    loading,
    error,
    onClose: closeDialog,
    onSubmit: submitDialog,
  });

  return {
    // Dialog state
    open,
    dialogType,
    dialogData,
    dialogTitle,
    dialogDescription,
    loading,
    error,
    
    // Actions
    openCreateDialog,
    openEditDialog,
    openViewDialog,
    openDeleteDialog,
    openCustomDialog,
    submitDialog,
    closeDialog,
    
    // Props
    getDialogProps,
  };
}

export default AppendableDialog;