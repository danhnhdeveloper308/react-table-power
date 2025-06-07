import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DialogMode, DialogType, BaseTableData } from '../types';
import { cn } from '../utils/cn';
import { validateAndGetFormData, resetForm } from '../utils/formHandlers';
import { 
  extractValidationErrors, 
  formatErrorForDisplay,
  isZodError,
  isYupError,
  isJoiError,
  isReactHookFormError
} from '../utils/validationErrorHandler';

export interface DialogFormComponentProps {
  data?: any;
  loading?: boolean;
  error?: Error | null | string;
  onSubmit?: (data: any) => Promise<boolean> | boolean;
  onClose?: () => void;
  dialogType?: DialogType;
  formRef?: React.MutableRefObject<any>;
  /**
   * Validation errors from form validation
   */
  validationErrors?: Record<string, string>;

  /**
   * Form reference for accessing form methods
   * This can be forwarded by React.forwardRef
   */
  ref?: React.Ref<any>;

  /**
   * Whether the form is read-only (for view mode)
   */
  isReadOnly?: boolean;
}

export interface AppendableDialogProps<T extends BaseTableData = BaseTableData> {
  /**
   * Active record data
   */
  activeRecord?: T | null;

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
    create?: React.ComponentType<DialogFormComponentProps>;
    edit?: React.ComponentType<DialogFormComponentProps>;
    view?: React.ComponentType<DialogFormComponentProps>;
    delete?: React.ComponentType<DialogFormComponentProps>;
    [key: string]: React.ComponentType<DialogFormComponentProps> | undefined;
  };

  /**
   * Callback when form is submitted
   */
  onSubmit?: (data: any, type: DialogType) => Promise<boolean> | boolean;

  /**
   * Callback when dialog is closed
   */
  onClose?: () => void;

  /**
   * Error to show in the dialog
   */
  error?: Error | null | string;

  /**
   * Loading state
   */
  loading?: boolean;

  /**
   * Whether the dialog can be closed by clicking outside
   */
  closeOnClickOutside?: boolean;

  /**
   * Whether the dialog can be closed by pressing Escape
   */
  closeOnEsc?: boolean;

  /**
   * Width of the dialog
   */
  width?: string | number;

  /**
   * Position of action buttons
   */
  actionsPosition?: 'left' | 'right' | 'center' | 'between';

  /**
   * Size of buttons
   */
  buttonSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Whether buttons are elevated
   */
  elevatedButtons?: boolean;

  /**
   * Loading effect style
   */
  loadingEffect?: 'overlay' | 'blur' | 'skeleton' | 'fade' | 'none';

  /**
   * Whether to use reduced motion for animations
   */
  reducedMotion?: boolean;
}

/**
 * Optimized AppendableDialog component with robust validation support
 */
export function AppendableDialog<T extends BaseTableData = BaseTableData>({
  activeRecord,
  activeDialog,
  dialogTitle,
  dialogDescription,
  formComponents = {},
  onSubmit,
  onClose,
  error,
  loading = false,
  closeOnClickOutside = true,
  closeOnEsc = true,
  width = '500px',
  actionsPosition = 'right',
  buttonSize = 'md',
  elevatedButtons = true,
  loadingEffect = 'overlay',
  reducedMotion = false,
}: AppendableDialogProps<T>) {
  // State management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const formRef = useRef<any>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  // Store active record data in ref to prevent it from being lost 
  const activeRecordRef = useRef<T | null | undefined>(null);

  // Update ref when activeRecord changes
  useEffect(() => {
    activeRecordRef.current = activeRecord;
  }, [activeRecord]);

  // Define renderErrorMessage callback BEFORE any conditional code
  // This ensures it's always created in the same order
  const renderErrorMessage = useCallback((errorValue: any): React.ReactNode => {
    // Use our improved error formatter that handles multiple validation libraries
    const errorMessage = formatErrorForDisplay(errorValue);
    if (!errorMessage) return null;
    
    return <span>{errorMessage}</span>;
  }, []);

  // Handle component unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Reset form state when dialog type or data changes
  useEffect(() => {
    if (activeDialog) {
      setIsSubmitting(false);
      setFormError(null);
      setValidationErrors({});
      
      // Store active record in ref immediately
      activeRecordRef.current = activeRecord;
      
      // Reset form with new data after a short delay to ensure form is mounted
      if (formRef.current && activeRecord) {
        const timer = setTimeout(() => {
          if (isMountedRef.current && formRef.current?.setValues) {
            console.log("Setting form values with activeRecord:", activeRecord);
            formRef.current.setValues(activeRecord);
          } else if (isMountedRef.current && formRef.current?.reset) {
            console.log("Resetting form with activeRecord:", activeRecord);
            formRef.current.reset(activeRecord);
          }
        }, 50);
        
        return () => clearTimeout(timer);
      }
    }
  }, [activeDialog, activeRecord]);

  // Handle Escape key press
  useEffect(() => {
    if (!closeOnEsc || !activeDialog) return;

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting && !loading) {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [closeOnEsc, activeDialog, isSubmitting, loading, onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnClickOutside && !isSubmitting && !loading) {
      onClose?.();
    }
  }, [closeOnClickOutside, isSubmitting, loading, onClose]);

  // Handle dialog submission with proper delete handling
  const handleDialogSubmit = useCallback(async (): Promise<boolean> => {
    if (!activeDialog || !onSubmit || isSubmitting || loading) return false;

    setFormError(null);
    setValidationErrors({});
    setIsSubmitting(true);
    
    try {
      const currentRecord = activeRecordRef.current;

      // Handle delete operations - always allow submission
      if (activeDialog === 'delete') {
        console.log("Delete operation - manual submission triggered by user");
        
        if (!currentRecord) {
          console.error("Delete operation attempted with no record data");
          setFormError("No record data available for deletion");
          setIsSubmitting(false);
          return false;
        }

        // Extract ID for deletion
        let recordId: string | number | undefined;
        
        if (typeof currentRecord === 'object' && 'id' in currentRecord) {
          recordId = currentRecord.id;
        } else if (typeof currentRecord === 'object' && '_id' in currentRecord) {
          recordId = currentRecord._id;
        }

        if (recordId === undefined || recordId === null) {
          console.error("Delete operation attempted without valid ID:", currentRecord);
          setFormError("Cannot delete: missing record ID");
          setIsSubmitting(false);
          return false;
        }

        console.log("Submitting delete for record ID:", recordId);
        
        // Make sure the record has an ID property before submitting
        const recordToSubmit = {
          ...currentRecord,
          id: recordId
        };
        
        // Call the onSubmit handler with the record data
        const result = await onSubmit(recordToSubmit, 'delete');
        
        if (isMountedRef.current) {
          setIsSubmitting(false);
          
          if (result === true) {
            onClose?.();
            return true;
          } else {
            setFormError("Delete operation failed");
            return false;
          }
        }
        
        return result === true;
      }

      // Handle validation and submission for form-based operations
      if (formRef.current) {
        try {
          // Debug log to trace form reference
          console.log("Form reference exists:", formRef.current);
          
          // Method 1: Use getValidatedValues if available (preferred)
          if (typeof formRef.current.getValidatedValues === 'function') {
            try {
              // Debug log to trace validation method
              console.log("Using getValidatedValues method");
              
              const formData = await formRef.current.getValidatedValues();
              
              // Debug log to check form data
              console.log("Validated form data:", formData);
              
              // Make sure formData is not null or undefined
              if (!formData) {
                console.error("Form data is null or undefined after validation");
                throw new Error("Form data is required");
              }
              
              // Make sure the ID is preserved for edit operations
              if (activeDialog === 'edit' && 
                  currentRecord && 
                  'id' in currentRecord && 
                  formData && 
                  typeof formData === 'object' &&
                  !('id' in formData)) {
                const recordId = currentRecord.id;
                if (recordId !== undefined) {
                  (formData as Record<string, any>)['id'] = recordId;
                }
              }
              
              // Save validated data to avoid losing it
              const validatedData = { ...formData };
              console.log("About to submit validated data:", validatedData);
              
              // Submit validated data
              const result = await onSubmit(validatedData, activeDialog);
              
              if (isMountedRef.current) {
                setIsSubmitting(false);
                
                if (result === true) {
                  onClose?.();
                }
              }
              
              return result === true;
            } catch (validationError: any) {
              console.log("Validation error:", validationError);
              
              // Enhanced validation error handling
              let errors: Record<string, string> = {};
              
              // Check if it's a Zod error
              if (isZodError(validationError)) {
                console.log("Detected Zod validation error");
                errors = extractValidationErrors(validationError);
              }
              // Check if it's a Yup error
              else if (isYupError(validationError)) {
                console.log("Detected Yup validation error");
                errors = extractValidationErrors(validationError);
              }
              // Check if it's a Joi error
              else if (isJoiError(validationError)) {
                console.log("Detected Joi validation error");
                errors = extractValidationErrors(validationError);
              }
              // Check if it's a React Hook Form error
              else if (isReactHookFormError(validationError)) {
                console.log("Detected React Hook Form validation error");
                errors = extractValidationErrors(validationError);
              }
              // Direct errors object from the form
              else if (validationError && typeof validationError === 'object') {
                if (validationError.errors && typeof validationError.errors === 'object') {
                  errors = validationError.errors as Record<string, string>;
                } else {
                  errors = extractValidationErrors(validationError);
                }
              }
              
              if (isMountedRef.current) {
                setValidationErrors(errors);
                
                // Get first error message for summary display
                const errorValues = Object.values(errors);
                const firstErrorMessage = errorValues.length > 0 ? errorValues[0] : null;
                if (firstErrorMessage) {
                  setFormError(String(firstErrorMessage));
                } else {
                  setFormError('Form validation failed');
                }
              }
              
              if (isMountedRef.current) {
                setIsSubmitting(false);
              }
              
              return false;
            }
          } 
          
          // Method 2: Use validate + getValues pattern
          if (typeof formRef.current.validate === 'function') {
            console.log("Using validate + getValues method");
            
            let isValid = false;
            let formData = null;
            
            try {
              isValid = await formRef.current.validate();
              console.log("Form validation result:", isValid);
            } catch (validationError) {
              console.error("Validation error in validate method:", validationError);
              isValid = false;
            }
            
            if (isValid && typeof formRef.current.getValues === 'function') {
              formData = formRef.current.getValues();
              console.log("Retrieved form values:", formData);
              
              // Make sure formData is not null or undefined
              if (!formData) {
                console.error("Form data is null or undefined after getValues");
                throw new Error("Form data is required");
              }
              
              // Make sure the ID is preserved for edit operations - Fix for TypeScript error
              if (activeDialog === 'edit' && 
                  currentRecord && 
                  'id' in currentRecord && 
                  formData && 
                  typeof formData === 'object' &&
                  !('id' in formData)) {
                // Safe assignment with type checking
                const recordId = currentRecord.id;
                if (recordId !== undefined) {
                  // Add id to formData with proper type assertion
                  (formData as Record<string, any>)['id'] = recordId;
                }
              }
              
              // Save validated form data to avoid losing it
              const validatedData = { ...formData };
              console.log("About to submit validated data from validate+getValues:", validatedData);
              
              // Submit validated data
              const result = await onSubmit(validatedData, activeDialog);
              
              if (isMountedRef.current) {
                setIsSubmitting(false);
                
                if (result === true) {
                  onClose?.();
                }
              }
              
              return result === true;
            } else {
              // Get validation errors
              let errors: Record<string, any> = {};
              
              if (formRef.current.formState?.errors) {
                errors = formRef.current.formState.errors;
              } else if (formRef.current.errors) {
                errors = formRef.current.errors;
              }
              
              if (isMountedRef.current) {
                // Safely convert to Record<string, string> type
                const stringErrors: Record<string, string> = {};
                Object.entries(errors).forEach(([key, value]) => {
                  if (typeof value === 'string') {
                    stringErrors[key] = value;
                  } else if (value && typeof value === 'object' && 'message' in value) {
                    stringErrors[key] = String((value as { message: unknown }).message);
                  } else {
                    stringErrors[key] = 'Invalid value';
                  }
                });
                
                setValidationErrors(stringErrors);
                
                // Set first error message as form error
                const errorValues = Object.values(stringErrors);
                const firstErrorMessage = errorValues.length > 0 ? errorValues[0] : null;
                if (firstErrorMessage) {
                  setFormError(firstErrorMessage);
                } else {
                  setFormError('Form validation failed');
                }
                
                setIsSubmitting(false);
              }
              
              return false;
            }
          }
          
          // Method 3: Use React Hook Form's handleSubmit directly
          if (formRef.current.handleSubmit && typeof formRef.current.handleSubmit === 'function') {
            console.log("Using React Hook Form's handleSubmit method");
            
            try {
              // Create a promise that resolves with form data when validation passes
              const formData = await new Promise((resolve, reject) => {
                formRef.current.handleSubmit(
                  // Success callback
                  (data: any) => {
                    console.log("Form data from handleSubmit:", data);
                    resolve(data);
                  },
                  // Error callback
                  (errors: any) => {
                    console.error("Form validation errors from handleSubmit:", errors);
                    reject({ errors });
                  }
                )();
              });
              
              // Make sure formData is not null or undefined
              if (!formData) {
                console.error("Form data is null or undefined after handleSubmit");
                throw new Error("Form data is required");
              }
              
              // Make sure the ID is preserved for edit operations - Fix for TypeScript error
              if (activeDialog === 'edit' && 
                  currentRecord && 
                  'id' in currentRecord && 
                  formData && 
                  typeof formData === 'object' &&
                  !('id' in formData)) {
                // Safe assignment with type checking
                const recordId = currentRecord.id;
                if (recordId !== undefined) {
                  // Add id to formData with proper type assertion
                  (formData as Record<string, any>)['id'] = recordId;
                }
              }
              
              // Save validated form data to avoid losing it
              const validatedData = { ...formData };
              console.log("About to submit validated data from handleSubmit:", validatedData);
              
              // Submit validated data
              const result = await onSubmit(validatedData, activeDialog);
              
              if (isMountedRef.current) {
                setIsSubmitting(false);
                
                if (result === true) {
                  onClose?.();
                }
              }
              
              return result === true;
            } catch (error: any) {
              console.log("Form submission error:", error);
              
              // Extract validation errors
              let errors: Record<string, string> = {};
              
              if (error && typeof error === 'object') {
                if (error.errors && typeof error.errors === 'object') {
                  errors = error.errors as Record<string, string>;
                } else {
                  errors = extractValidationErrors(error) as Record<string, string>;
                }
              }
              
              if (isMountedRef.current) {
                setValidationErrors(errors);
                
                // Set first error message as form error
                const errorValues = Object.values(errors);
                const firstErrorMessage = errorValues.length > 0 ? errorValues[0] : null;
                if (firstErrorMessage) {
                  setFormError(String(firstErrorMessage));
                } else {
                  setFormError('Form submission failed');
                }
                
                setIsSubmitting(false);
              }
              
              return false;
            }
          }
          
          // Method 4: Fallback to using just getValues without validation
          if (typeof formRef.current.getValues === 'function') {
            console.log("Using getValues method without validation");
            
            const formData = formRef.current.getValues();
            console.log("Form data from getValues fallback:", formData);
            
            // Make sure formData is not null or undefined
            if (!formData) {
              console.error("Form data is null or undefined from getValues fallback");
              // If no form data, use activeRecord from ref as fallback
              if (currentRecord) {
                console.log("Using activeRecord as fallback:", currentRecord);
                const result = await onSubmit(currentRecord, activeDialog);
                
                if (isMountedRef.current) {
                  setIsSubmitting(false);
                  
                  if (result === true) {
                    onClose?.();
                  }
                }
                
                return result === true;
              } else {
                throw new Error("Form data is required");
              }
            }
            
            // Make sure the ID is preserved for edit operations - Fix for TypeScript error
            if (activeDialog === 'edit' && 
                currentRecord && 
                'id' in currentRecord && 
                formData && 
                typeof formData === 'object' &&
                !('id' in formData)) {
              // Safe assignment with type checking
              const recordId = currentRecord.id;
              if (recordId !== undefined) {
                // Add id to formData with proper type assertion
                (formData as Record<string, any>)['id'] = recordId;
              }
            }
            
            // Save validated form data to avoid losing it
            const validatedData = { ...formData };
            console.log("About to submit data from getValues fallback:", validatedData);
            
            const result = await onSubmit(validatedData, activeDialog);
            
            if (isMountedRef.current) {
              setIsSubmitting(false);
              
              if (result === true) {
                onClose?.();
              }
            }
            
            return result === true;
          }
          
          // Last resort: Direct form element access
          if (formRef.current.elements) {
            console.log("Accessing form elements directly");
            
            try {
              const formData: Record<string, any> = {};
              const formElements = formRef.current.elements;
              
              for (let i = 0; i < formElements.length; i++) {
                const element = formElements[i];
                if (element.name) {
                  formData[element.name] = element.value;
                }
              }
              
              console.log("Form data from direct element access:", formData);
              
              // Make sure the ID is preserved for edit operations - Fix for TypeScript error
              if (activeDialog === 'edit' && 
                  currentRecord && 
                  'id' in currentRecord &&
                  !('id' in formData)) {
                // Safe assignment with type checking
                const recordId = currentRecord.id;
                if (recordId !== undefined) {
                  formData['id'] = recordId;
                }
              }
              
              const result = await onSubmit(formData, activeDialog);
              
              if (isMountedRef.current) {
                setIsSubmitting(false);
                
                if (result === true) {
                  onClose?.();
                }
              }
              
              return result === true;
            } catch (error) {
              console.error("Error extracting form data:", error);
            }
          }
          
          // Additional fallback: Try React-specific properties
          if (formRef.current.props) {
            console.log("Accessing form props");
            const formData = formRef.current.props.values || {};
            console.log("Form data from props:", formData);
            
            // Make sure the ID is preserved for edit operations
            if (activeDialog === 'edit' && 
                currentRecord && 
                'id' in currentRecord && 
                !('id' in formData)) {
              const recordId = currentRecord.id;
              if (recordId !== undefined) {
                (formData as Record<string, any>)['id'] = recordId;
              }
            }
            
            const result = await onSubmit(formData, activeDialog);
            
            if (isMountedRef.current) {
              setIsSubmitting(false);
              
              if (result === true) {
                onClose?.();
              }
            }
            
            return result === true;
          }
          
          // Try to get internal state for uncontrolled components
          if (formRef.current._internalState || formRef.current.state) {
            console.log("Accessing internal component state");
            const formData = formRef.current._internalState || 
                             formRef.current.state || {};
            console.log("Form data from internal state:", formData);
            
            // Ensure we have the ID for edit operations
            if (activeDialog === 'edit' && currentRecord && 'id' in currentRecord) {
              formData.id = currentRecord.id;
            }
            
            const result = await onSubmit(formData, activeDialog);
            
            if (isMountedRef.current) {
              setIsSubmitting(false);
              
              if (result === true) {
                onClose?.();
              }
            }
            
            return result === true;
          }
          
        } catch (error) {
          console.error('Form validation error:', error);
          
          if (isMountedRef.current) {
            // Enhanced error extraction
            const errors = extractValidationErrors(error);
            setValidationErrors(errors);
            
            // Get first error message for summary display
            const errorValues = Object.values(errors);
            const firstErrorMessage = errorValues.length > 0 ? errorValues[0] : null;
            if (firstErrorMessage) {
              setFormError(firstErrorMessage);
            } else {
              setFormError('An error occurred during validation');
            }
          }
        }
      }
      
      // Final fallback: Submit the activeRecord directly if all else fails
      console.log("No form data available, using activeRecord from ref:", currentRecord);
      if (!currentRecord) {
        console.error("No active record available for submission");
        setFormError("No data available for submission");
        setIsSubmitting(false);
        return false;
      }
      
      const result = await onSubmit(currentRecord, activeDialog);
      
      if (isMountedRef.current) {
        setIsSubmitting(false);
        
        if (result === true) {
          onClose?.();
        }
      }
      
      return result === true;
    } catch (error) {
      console.error('Dialog submission error:', error);
      
      if (isMountedRef.current) {
        setFormError(formatErrorForDisplay(error));
        setIsSubmitting(false);
      }
      
      return false;
    }
  }, [activeDialog, onSubmit, isSubmitting, loading, onClose]);

  // Don't render if no active dialog
  if (!activeDialog) {
    return null;
  }

  // Get the current dialog's form component
  const FormComponent = formComponents[activeDialog];

  // Determine dialog title based on type
  const title = dialogTitle || {
    create: 'Thêm mới',
    edit: 'Chỉnh sửa',
    view: 'Xem chi tiết',
    delete: 'Xác nhận xóa',
    custom: 'Thao tác'
  }[activeDialog] || 'Dialog';

  // Determine submit button label based on dialog type
  const submitLabel = {
    create: 'Tạo mới',
    edit: 'Lưu thay đổi',
    delete: 'Xóa', // Show "Delete" button for delete operations
    view: '',
    custom: 'Xác nhận'
  }[activeDialog] || 'Xác nhận';

  // Determine loading label based on dialog type
  const loadingLabel = {
    create: 'Đang tạo...',
    edit: 'Đang lưu...',
    delete: 'Đang xóa...',
    view: '',
    custom: 'Đang xử lý...'
  }[activeDialog] || 'Đang xử lý...';

  // Animation settings
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

  // Render special form props for view mode
  const formProps = {
    data: activeRecord,
    loading: loading || isSubmitting,
    error: error || formError,
    dialogType: activeDialog,
    formRef,
    ref: formRef,  // Allow both ref and formRef to be used
    onSubmit: async (data: any) => {
      // Skip validation for delete operations
      // Add type assertion to ensure TypeScript recognizes activeDialog correctly
      const currentDialogType = activeDialog as DialogType;
      
      if (currentDialogType === 'delete') {
        console.log("Delete operation - direct form submission, bypassing validation");
        if (onSubmit) {
          return await onSubmit(activeRecord || {}, currentDialogType);
        }
        return true;
      }
      
      console.log("Form component onSubmit called with data:", data);
      if (!data && activeDialog !== 'delete') {
        console.error("Form data is null or undefined in onSubmit handler");
        return false;
      }
      
      if (onSubmit) {
        // Create a deep copy of the data to prevent issues with references
        const formattedData = activeDialog === 'delete' ? 
          (activeRecord || {}) : // For delete, use the active record directly
          JSON.parse(JSON.stringify(data)); // For other operations, use the form data
          
        console.log("Submitting data:", formattedData);
        return await onSubmit(formattedData, activeDialog);
      }
      return true;
    },
    onClose,
    validationErrors,
    isReadOnly: activeDialog === 'view',  // Set read-only for view mode
    // Add getValue and setValue methods for direct form access
    getValue: (field: string) => {
      if (activeRecord && typeof activeRecord === 'object') {
        return activeRecord[field];
      }
      return undefined;
    },
    setValue: (field: string, value: any) => {
      if (activeRecord && typeof activeRecord === 'object') {
        // Create a new object to trigger updates
        const updatedRecord = { ...activeRecord, [field]: value };
        // This is just for local form state, not persisted yet
        return updatedRecord;
      }
      return activeRecord;
    }
  };

  // Footer with action buttons - always show submit button for delete
  const renderFooter = () => (
    <div className="rpt-dialog-footer">
      <div className={cn(
        "rpt-dialog-actions",
        `rpt-dialog-actions-${actionsPosition}`,
        elevatedButtons && "rpt-dialog-actions-elevated"
      )}>
        {/* Cancel Button (always visible) */}
        <button
          className={cn(
            "rpt-button",
            "rpt-button-secondary",
            `rpt-button-${buttonSize}`
          )}
          onClick={onClose}
          disabled={isSubmitting || loading}
          type="button"
        >
          Hủy
        </button>

        {/* Submit Button (show for all operations including delete) */}
        {activeDialog !== 'view' && (
          <button
            className={cn(
              "rpt-button",
              activeDialog === 'delete' ? "rpt-button-destructive" : "rpt-button-primary",
              `rpt-button-${buttonSize}`
            )}
            onClick={handleDialogSubmit}
            disabled={isSubmitting || loading}
            type="button"
          >
            {isSubmitting ? loadingLabel : submitLabel}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
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
            className={cn('rpt-dialog', `rpt-dialog-${activeDialog}`)}
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

            {/* Dialog Content */}
            <div className="rpt-dialog-content">
              {dialogDescription && (
                <p className="rpt-dialog-description">{dialogDescription}</p>
              )}

              {/* Display Dialog Errors - Fixed error rendering */}
              {(error || formError) && (
                <div className="rpt-dialog-error" role="alert">
                  {formError ? renderErrorMessage(formError) : renderErrorMessage(error)}
                </div>
              )}

              {/* Form Content */}
              <div className={cn('rpt-dialog-form-container', {
                'rpt-dialog-loading': loading || isSubmitting,
                [`rpt-loading-effect-${loadingEffect}`]: loading || isSubmitting,
              })}>
                {/* Loading Indicator */}
                {(loading || isSubmitting) && (
                  <div className="rpt-dialog-loading-overlay">
                    <div className="rpt-dialog-loading-spinner"></div>
                    <span>{isSubmitting ? loadingLabel : 'Loading...'}</span>
                  </div>
                )}

                {/* Form Component */}
                {FormComponent ? (
                  <FormComponent
                    {...formProps}
                  />
                ) : activeDialog === 'delete' ? (
                  <div className="rpt-dialog-delete-confirmation">
                    <p>Bạn có chắc chắn muốn xóa mục này không? Hành động này không thể hoàn tác.</p>
                  </div>
                ) : (
                  <div className="rpt-dialog-placeholder">
                    Không tìm thấy form component cho {activeDialog}
                  </div>
                )}
              </div>
            </div>

            {/* Dialog Footer */}
            {renderFooter()}
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default AppendableDialog;