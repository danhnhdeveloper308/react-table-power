import React, { useState, useMemo, useCallback, useRef } from 'react';
import { DialogType, DialogMode, BaseTableData } from '../types';
import OptimizedDialog from './OptimizedDialog';

export interface FormDialogState<T = any> {
  open: boolean;
    type: DialogType | null;
  title?: string;
  description?: string;
  data?: T | null;
}

export interface FormDialogManagerProps<T extends BaseTableData = BaseTableData> {
  formComponents?: {
    create?: React.ComponentType<any>;
    edit?: React.ComponentType<any>;
    view?: React.ComponentType<any>;
    delete?: React.ComponentType<any>;
    custom?: React.ComponentType<any>;
    [key: string]: React.ComponentType<any> | undefined;
  };
  onSubmit?: (data: any, type: DialogType) => Promise<boolean> | boolean;
  closeOnClickOutside?: boolean;
  closeOnEsc?: boolean;
  width?: string | number;
  actionsPosition?: 'left' | 'right' | 'center' | 'between';
  buttonSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  elevatedButtons?: boolean;
  reducedMotion?: boolean;
  children: (methods: {
    openCreateDialog: (data?: Partial<T>, title?: string, description?: string) => void;
    openEditDialog: (data: T, title?: string, description?: string) => void;
    openViewDialog: (data: T, title?: string, description?: string) => void;
    openDeleteDialog: (data: T, title?: string, description?: string) => void;
    openCustomDialog: (type: string, data: any, title?: string, description?: string) => void;
    closeDialog: () => void;
    dialogProps: FormDialogState<T>;
  }) => React.ReactNode;
}

/**
 * FormDialogManager - A component to manage form dialogs with optimized rendering
 */
export function FormDialogManager<T extends BaseTableData = BaseTableData>({
  formComponents = {},
  onSubmit,
  closeOnClickOutside = true,
  closeOnEsc = true,
  width = '500px',
  actionsPosition = 'right',
  buttonSize = 'md',
  elevatedButtons = true,
  reducedMotion = false,
  children
}: FormDialogManagerProps<T>) {
  // Dialog state
  const [dialogState, setDialogState] = useState<FormDialogState<T>>({
    open: false,
    type: null,
    title: undefined,
    description: undefined,
    data: null
  });
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | Error | string>(null);
  
  // Store callback refs to avoid unnecessary re-renders
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;
  
  // Dialog opening methods
  const openDialog = useCallback((
    type: DialogType, 
    data: any, 
    title?: string, 
    description?: string
  ) => {
    setError(null);
    setLoading(false);
    setDialogState({
      open: true,
      type,
      title,
      description,
      data
    });
  }, []);
  
  const openCreateDialog = useCallback((
    data?: Partial<T>, 
    title?: string, 
    description?: string
  ) => {
    openDialog('create', data || {}, title, description);
  }, [openDialog]);
  
  const openEditDialog = useCallback((
    data: T, 
    title?: string, 
    description?: string
  ) => {
    openDialog('edit', data, title, description);
  }, [openDialog]);
  
  const openViewDialog = useCallback((
    data: T, 
    title?: string, 
    description?: string
  ) => {
    openDialog('view', data, title, description);
  }, [openDialog]);
  
  const openDeleteDialog = useCallback((
    data: T, 
    title?: string, 
    description?: string
  ) => {
    openDialog('delete', data, title, description);
  }, [openDialog]);
  
  const openCustomDialog = useCallback((
    type: string, 
    data: any, 
    title?: string, 
    description?: string
  ) => {
    openDialog(type as DialogType, data, title, description);
  }, [openDialog]);
  
  // Close dialog method
  const closeDialog = useCallback(() => {
    setDialogState(prev => ({ ...prev, open: false }));
  }, []);
  
  // Handle dialog submission
  const handleSubmit = useCallback(async (data: any, type: DialogType | null): Promise<boolean> => {
    if (!onSubmitRef.current || !type) return false;
    
    setError(null);
    setLoading(true);
    
    try {
      const result = await onSubmitRef.current(data, type);
      setLoading(false);
      return result;
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    }
  }, []);
  
  // Get current form component
  const FormComponent = dialogState.type ? formComponents[dialogState.type] : undefined;
  
  // Dialog API to pass to children
  const dialogApi = useMemo(() => ({
    openCreateDialog,
    openEditDialog,
    openViewDialog,
    openDeleteDialog,
    openCustomDialog,
    closeDialog,
    dialogProps: dialogState
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
      {children(dialogApi)}
      
      <OptimizedDialog
        open={dialogState.open}
        dialogType={dialogState.type}
        dialogTitle={dialogState.title}
        dialogDescription={dialogState.description}
        data={dialogState.data}
        formComponent={FormComponent}
        onClose={closeDialog}
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
        width={width}
        closeOnClickOutside={closeOnClickOutside}
        closeOnEsc={closeOnEsc}
        actionsPosition={actionsPosition}
        buttonSize={buttonSize}
        elevatedButtons={elevatedButtons}
        reducedMotion={reducedMotion}
      />
    </>
  );
}

export default FormDialogManager;
