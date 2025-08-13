import { useCallback, useState, useMemo } from 'react';
import { DialogFormMode } from '../types/forms';
import { BaseTableData } from '../types';

/**
 * Form dialog state
 */
export interface FormDialogState<T = any> {
  open: boolean;
  mode: DialogFormMode | null;
  data: T | null;
  title?: string;
  description?: string;
  loading: boolean;
  error: string | null;
}

/**
 * Form dialog management hook
 */
export interface UseFormDialogReturn<T = any> {
  // State
  dialogState: FormDialogState<T>;
  
  // Actions
  openCreateDialog: (data?: Partial<T>, options?: DialogOptions) => void;
  openEditDialog: (data: T, options?: DialogOptions) => void;
  openViewDialog: (data: T, options?: DialogOptions) => void;
  openDeleteDialog: (data: T, options?: DialogOptions) => void;
  openCustomDialog: (mode: DialogFormMode, data: T | null, options?: DialogOptions) => void;
  closeDialog: () => void;
  
  // State setters
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Submit handler
  handleSubmit: (onSubmit: (data: any, mode: DialogFormMode) => Promise<boolean> | boolean) => (data: any) => Promise<void>;
}

/**
 * Dialog options
 */
export interface DialogOptions {
  title?: string;
  description?: string;
}

/**
 * Default dialog titles by mode
 */
const DEFAULT_TITLES: Record<DialogFormMode, string> = {
  create: 'Create New',
  edit: 'Edit',
  view: 'View Details',
  delete: 'Confirm Delete'
};

/**
 * Default dialog descriptions by mode
 */
const DEFAULT_DESCRIPTIONS: Record<DialogFormMode, string> = {
  create: 'Fill in the information below to create a new item.',
  edit: 'Update the information below to save your changes.',
  view: 'View the details of this item.',
  delete: 'Are you sure you want to delete this item? This action cannot be undone.'
};

/**
 * Hook for managing form dialogs with CRUD operations
 * Provides a simple interface for opening different types of dialogs
 * 
 * @example
 * ```tsx
 * const {
 *   dialogState,
 *   openCreateDialog,
 *   openEditDialog,
 *   openDeleteDialog,
 *   closeDialog,
 *   handleSubmit
 * } = useFormDialog<User>();
 * 
 * const onSubmit = handleSubmit(async (data, mode) => {
 *   if (mode === 'create') {
 *     await createUser(data);
 *   } else if (mode === 'edit') {
 *     await updateUser(data);
 *   } else if (mode === 'delete') {
 *     await deleteUser(data.id);
 *   }
 *   return true;
 * });
 * ```
 */
export function useFormDialog<T extends BaseTableData = BaseTableData>(): UseFormDialogReturn<T> {
  // Dialog state
  const [dialogState, setDialogState] = useState<FormDialogState<T>>({
    open: false,
    mode: null,
    data: null,
    title: undefined,
    description: undefined,
    loading: false,
    error: null
  });
  
  // Open dialog with specified mode and data
  const openDialog = useCallback((
    mode: DialogFormMode,
    data: T | Partial<T> | null,
    options?: DialogOptions
  ) => {
    setDialogState({
      open: true,
      mode,
      data: data as T,
      title: options?.title || DEFAULT_TITLES[mode],
      description: options?.description || DEFAULT_DESCRIPTIONS[mode],
      loading: false,
      error: null
    });
  }, []);
  
  // Open create dialog
  const openCreateDialog = useCallback((
    data?: Partial<T>,
    options?: DialogOptions
  ) => {
    openDialog('create', data || null, options);
  }, [openDialog]);
  
  // Open edit dialog
  const openEditDialog = useCallback((
    data: T,
    options?: DialogOptions
  ) => {
    openDialog('edit', data, options);
  }, [openDialog]);
  
  // Open view dialog
  const openViewDialog = useCallback((
    data: T,
    options?: DialogOptions
  ) => {
    openDialog('view', data, options);
  }, [openDialog]);
  
  // Open delete dialog
  const openDeleteDialog = useCallback((
    data: T,
    options?: DialogOptions
  ) => {
    openDialog('delete', data, options);
  }, [openDialog]);
  
  // Open custom dialog
  const openCustomDialog = useCallback((
    mode: DialogFormMode,
    data: T | null,
    options?: DialogOptions
  ) => {
    openDialog(mode, data, options);
  }, [openDialog]);
  
  // Close dialog
  const closeDialog = useCallback(() => {
    setDialogState(prev => ({
      ...prev,
      open: false
    }));
    
    // Clear state after animation
    setTimeout(() => {
      setDialogState(prev => ({
        ...prev,
        mode: null,
        data: null,
        title: undefined,
        description: undefined,
        error: null
      }));
    }, 200);
  }, []);
  
  // Set loading state
  const setLoading = useCallback((loading: boolean) => {
    setDialogState(prev => ({ ...prev, loading }));
  }, []);
  
  // Set error state
  const setError = useCallback((error: string | null) => {
    setDialogState(prev => ({ ...prev, error }));
  }, []);
  
  // Create submit handler
  const handleSubmit = useCallback((
    onSubmit: (data: any, mode: DialogFormMode) => Promise<boolean> | boolean
  ) => {
    return async (data: any) => {
      if (!dialogState.mode) {
        throw new Error('No dialog mode set');
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const result = await onSubmit(data, dialogState.mode);
        
        if (result !== false) {
          // Success - close dialog
          closeDialog();
        } else {
          // Failed but no error thrown
          setError('Operation failed. Please try again.');
        }
      } catch (error: any) {
        console.error('[useFormDialog] Submit error:', error);
        setError(error.message || 'An error occurred');
        throw error; // Re-throw for form validation handling
      } finally {
        setLoading(false);
      }
    };
  }, [dialogState.mode, setLoading, setError, closeDialog]);
  
  // Memoized return value to prevent unnecessary re-renders
  const returnValue = useMemo(() => ({
    dialogState,
    openCreateDialog,
    openEditDialog,
    openViewDialog,
    openDeleteDialog,
    openCustomDialog,
    closeDialog,
    setLoading,
    setError,
    handleSubmit
  }), [
    dialogState,
    openCreateDialog,
    openEditDialog,
    openViewDialog,
    openDeleteDialog,
    openCustomDialog,
    closeDialog,
    setLoading,
    setError,
    handleSubmit
  ]);
  
  return returnValue;
}

/**
 * Hook for managing a single form dialog with specific schema
 * Provides type-safe operations for a specific data type
 */
export function useTypedFormDialog<T extends BaseTableData>(
  schema: any,
  defaultMode: DialogFormMode = 'create'
) {
  const dialog = useFormDialog<T>();
  
  // Create enhanced dialog with schema binding
  const enhancedDialog = useMemo(() => ({
    ...dialog,
    schema,
    defaultMode,
    
    // Type-safe operations
    openCreate: (data?: Partial<T>, options?: DialogOptions) => 
      dialog.openCreateDialog(data, options),
    
    openEdit: (data: T, options?: DialogOptions) => 
      dialog.openEditDialog(data, options),
    
    openView: (data: T, options?: DialogOptions) => 
      dialog.openViewDialog(data, options),
    
    openDelete: (data: T, options?: DialogOptions) => 
      dialog.openDeleteDialog(data, options),
  }), [dialog, schema, defaultMode]);
  
  return enhancedDialog;
}

export default useFormDialog;
