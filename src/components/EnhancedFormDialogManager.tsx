import React, { useState, useCallback, useMemo, useRef } from 'react';
import { DialogFormMode } from '../types/forms';
import { DialogFormWrapper } from './DialogFormWrapper';
import { reactHookFormAdapter } from '../adapters';
import { BaseTableData } from '../types';

/**
 * Enhanced form dialog state
 */
export interface EnhancedFormDialogState<T = any> {
  open: boolean;
  mode: DialogFormMode | null;
  title?: string;
  description?: string;
  data?: T | null;
  schema?: any;
  loading: boolean;
  error: string | Error | null;
}

/**
 * Form component props for the enhanced dialog system
 */
export interface EnhancedFormComponentProps<T = any> {
  data?: T;
  mode: DialogFormMode;
  schema: any;
  onSubmit: (values: any) => Promise<void>;
  isReadOnly?: boolean;
  disabled?: boolean;
  loading?: boolean;
  error?: string | Error | null;
}

/**
 * Props for the EnhancedFormDialogManager
 */
export interface EnhancedFormDialogManagerProps<T extends BaseTableData = BaseTableData> {
  /**
   * Form schemas for each dialog mode
   */
  schemas: {
    create?: any;
    edit?: any;
    view?: any;
    delete?: any;
    [key: string]: any;
  };
  
  /**
   * Form components for each dialog mode
   */
  formComponents?: {
    create?: React.ComponentType<EnhancedFormComponentProps<T>>;
    edit?: React.ComponentType<EnhancedFormComponentProps<T>>;
    view?: React.ComponentType<EnhancedFormComponentProps<T>>;
    delete?: React.ComponentType<EnhancedFormComponentProps<T>>;
    [key: string]: React.ComponentType<EnhancedFormComponentProps<T>> | undefined;
  };
  
  /**
   * Default values providers for each mode
   */
  defaultValuesProviders?: {
    create?: () => Partial<T> | Promise<Partial<T>>;
    edit?: (data: T) => Partial<T> | Promise<Partial<T>>;
    view?: (data: T) => Partial<T> | Promise<Partial<T>>;
    delete?: (data: T) => Partial<T> | Promise<Partial<T>>;
    [key: string]: ((data?: T) => Partial<T> | Promise<Partial<T>>) | undefined;
  };
  
  /**
   * Submit handler
   */
  onSubmit?: (data: any, mode: DialogFormMode) => Promise<boolean> | boolean;
  
  /**
   * Close handler
   */
  onClose?: () => void;
  
  /**
   * Form adapter to use (defaults to React Hook Form)
   */
  formAdapter?: any;
  
  /**
   * Dialog configuration
   */
  dialogConfig?: {
    width?: string | number;
    maxWidth?: string | number;
    closeOnClickOutside?: boolean;
    closeOnEsc?: boolean;
    resetOnClose?: boolean;
    validationMode?: 'onSubmit' | 'onBlur' | 'onChange' | 'onTouched' | 'all';
    shouldFocusError?: boolean;
  };
  
  /**
   * Children render prop
   */
  children: (methods: {
    openCreateDialog: (data?: Partial<T>, title?: string, description?: string) => void;
    openEditDialog: (data: T, title?: string, description?: string) => void;
    openViewDialog: (data: T, title?: string, description?: string) => void;
    openDeleteDialog: (data: T, title?: string, description?: string) => void;
    openCustomDialog: (mode: string, data: any, title?: string, description?: string) => void;
    closeDialog: () => void;
    dialogState: EnhancedFormDialogState<T>;
  }) => React.ReactNode;
}

/**
 * Enhanced FormDialogManager with adapter architecture
 * Provides a clean API for managing CRUD dialogs with form validation
 */
export function EnhancedFormDialogManager<T extends BaseTableData = BaseTableData>({
  schemas,
  formComponents = {},
  defaultValuesProviders = {},
  onSubmit,
  onClose,
  formAdapter = reactHookFormAdapter,
  dialogConfig = {},
  children
}: EnhancedFormDialogManagerProps<T>) {
  // Dialog state
  const [dialogState, setDialogState] = useState<EnhancedFormDialogState<T>>({
    open: false,
    mode: null,
    title: undefined,
    description: undefined,
    data: null,
    schema: undefined,
    loading: false,
    error: null
  });
  
  // Store callbacks in refs to avoid unnecessary re-renders
  const onSubmitRef = useRef(onSubmit);
  const onCloseRef = useRef(onClose);
  
  // Update callback refs
  onSubmitRef.current = onSubmit;
  onCloseRef.current = onClose;
  
  // Default dialog configuration
  const {
    width = 'auto',
    maxWidth = '90vw',
    closeOnClickOutside = true,
    closeOnEsc = true,
    resetOnClose = true,
    validationMode = 'onSubmit',
    shouldFocusError = true
  } = dialogConfig;
  
  // Open dialog with mode and data
  const openDialog = useCallback((
    mode: DialogFormMode,
    data: T | Partial<T> | null = null,
    title?: string,
    description?: string
  ) => {
    const schema = schemas[mode];
    if (!schema) {
      console.error(`[EnhancedFormDialogManager] No schema found for mode: ${mode}`);
      return;
    }
    
    setDialogState({
      open: true,
      mode,
      title,
      description,
      data: data as T,
      schema,
      loading: false,
      error: null
    });
  }, [schemas]);
  
  // Specific dialog opening methods
  const openCreateDialog = useCallback((
    data?: Partial<T>,
    title?: string,
    description?: string
  ) => {
    openDialog('create', data, title || 'Create New', description);
  }, [openDialog]);
  
  const openEditDialog = useCallback((
    data: T,
    title?: string,
    description?: string
  ) => {
    openDialog('edit', data, title || 'Edit', description);
  }, [openDialog]);
  
  const openViewDialog = useCallback((
    data: T,
    title?: string,
    description?: string
  ) => {
    openDialog('view', data, title || 'View Details', description);
  }, [openDialog]);
  
  const openDeleteDialog = useCallback((
    data: T,
    title?: string,
    description?: string
  ) => {
    openDialog('delete', data, title || 'Confirm Delete', description);
  }, [openDialog]);
  
  const openCustomDialog = useCallback((
    mode: string,
    data: any,
    title?: string,
    description?: string
  ) => {
    openDialog(mode as DialogFormMode, data, title, description);
  }, [openDialog]);
  
  // Close dialog
  const closeDialog = useCallback(() => {
    setDialogState(prev => ({ ...prev, open: false }));
    onCloseRef.current?.();
  }, []);
  
  // Handle form submission
  const handleSubmit = useCallback(async (values: any) => {
    if (!onSubmitRef.current || !dialogState.mode) {
      throw new Error('No submit handler or mode provided');
    }
    
    setDialogState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await onSubmitRef.current(values, dialogState.mode);
      
      if (result !== false) {
        // Successful submission
        setDialogState(prev => ({ ...prev, loading: false }));
        closeDialog();
      } else {
        // Submission failed
        setDialogState(prev => ({ 
          ...prev, 
          loading: false,
          error: 'Submission failed. Please try again.'
        }));
      }
    } catch (error) {
      console.error('[EnhancedFormDialogManager] Submit error:', error);
      setDialogState(prev => ({ 
        ...prev, 
        loading: false,
        error: error instanceof Error ? error.message : 'An error occurred'
      }));
      
      // Re-throw to let the form handle validation errors
      throw error;
    }
  }, [dialogState.mode, closeDialog]);
  
  // Handle dialog open/close changes
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      closeDialog();
    }
  }, [closeDialog]);
  
  // Get default values for current mode and data
  const getDefaultValues = useCallback(async () => {
    if (!dialogState.mode || !defaultValuesProviders[dialogState.mode]) {
      return dialogState.data || {};
    }
    
    const provider = defaultValuesProviders[dialogState.mode];
    if (provider) {
      try {
        const result = await provider(dialogState.data);
        return result;
      } catch (error) {
        console.error('[EnhancedFormDialogManager] Error getting default values:', error);
        return dialogState.data || {};
      }
    }
    
    return dialogState.data || {};
  }, [dialogState.mode, dialogState.data, defaultValuesProviders]);
  
  // Render form fields
  const renderFields = useCallback((context: any) => {
    if (!dialogState.mode) return null;
    
    const FormComponent = formComponents[dialogState.mode];
    
    if (FormComponent) {
      return (
        <FormComponent
          data={dialogState.data}
          mode={dialogState.mode}
          schema={dialogState.schema}
          onSubmit={handleSubmit}
          isReadOnly={dialogState.mode === 'view'}
          disabled={dialogState.loading}
          loading={dialogState.loading}
          error={dialogState.error}
          {...context}
        />
      );
    }
    
    // Default form for delete confirmation
    if (dialogState.mode === 'delete') {
      return (
        <div style={{ padding: '1rem 0' }}>
          <p style={{ margin: 0, color: '#374151' }}>
            Are you sure you want to delete this item? This action cannot be undone.
          </p>
        </div>
      );
    }
    
    // Fallback message
    return (
      <div style={{ padding: '1rem 0', color: '#6b7280' }}>
        No form component provided for {dialogState.mode} mode.
      </div>
    );
  }, [dialogState.mode, dialogState.data, dialogState.schema, dialogState.loading, dialogState.error, formComponents, handleSubmit]);
  
  // Dialog methods for children
  const dialogMethods = useMemo(() => ({
    openCreateDialog,
    openEditDialog,
    openViewDialog,
    openDeleteDialog,
    openCustomDialog,
    closeDialog,
    dialogState
  }), [
    openCreateDialog,
    openEditDialog,
    openViewDialog,
    openDeleteDialog,
    openCustomDialog,
    closeDialog,
    dialogState
  ]);
  
  return (
    <>
      {children(dialogMethods)}
      
      {dialogState.open && dialogState.mode && dialogState.schema && (
        <DialogFormWrapper
          mode={dialogState.mode}
          title={dialogState.title}
          description={dialogState.description}
          schema={dialogState.schema}
          defaultValues={getDefaultValues}
          onSubmit={handleSubmit}
          onOpenChange={handleOpenChange}
          renderFields={renderFields}
          formAdapter={formAdapter}
          open={dialogState.open}
          validationMode={validationMode}
          shouldFocusError={shouldFocusError}
          loading={dialogState.loading}
          error={dialogState.error}
          width={width}
          maxWidth={maxWidth}
          closeOnClickOutside={closeOnClickOutside}
          closeOnEsc={closeOnEsc}
          resetOnClose={resetOnClose}
        />
      )}
    </>
  );
}

export default EnhancedFormDialogManager;
