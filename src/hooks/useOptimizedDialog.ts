import { useState, useCallback, useRef } from 'react';
import { DialogType, BaseTableData } from '../types';

export interface DialogState<T = any> {
  open: boolean;
  type?: DialogType;
  title?: string;
  description?: string;
  data?: T | null;
  loading: boolean;
  error: Error | string | null;
}

export interface UseOptimizedDialogReturn<T = any> {
  dialogState: DialogState<T>;
  openCreateDialog: (data?: Partial<T>, title?: string, description?: string) => void;
  openEditDialog: (data: T, title?: string, description?: string) => void;
  openViewDialog: (data: T, title?: string, description?: string) => void;
  openDeleteDialog: (data: T, title?: string, description?: string) => void;
  openCustomDialog: (type: string, data: any, title?: string, description?: string) => void;
  closeDialog: () => void;
  setDialogLoading: (loading: boolean) => void;
  setDialogError: (error: Error | string | null) => void;
  submitDialog: (data: any, type: DialogType) => Promise<boolean>;
}

/**
 * useOptimizedDialog - A hook to manage dialog state with improved performance
 * 
 * @param onSubmit Callback function when dialog form is submitted
 */
export function useOptimizedDialog<T extends BaseTableData = BaseTableData>(
  onSubmit?: (data: any, type: DialogType) => Promise<boolean> | boolean
): UseOptimizedDialogReturn<T> {
  // Use a single state object to minimize re-renders
  const [dialogState, setDialogState] = useState<DialogState<T>>({
    open: false,
    type: undefined,
    title: undefined,
    description: undefined,
    data: null,
    loading: false,
    error: null
  });
  
  // Store callback in ref to avoid unnecessary re-renders
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;
  
  // Dialog opening methods
  const openDialog = useCallback((
    type: DialogType, 
    data: any, 
    title?: string, 
    description?: string
  ) => {
    setDialogState({
      open: true,
      type,
      title,
      description,
      data,
      loading: false,
      error: null
    });
  }, []);
  
  const openCreateDialog = useCallback((
    data?: Partial<T>, 
    title?: string, 
    description?: string
  ) => {
    openDialog('create', data || {}, title || 'Thêm mới', description);
  }, [openDialog]);
  
  const openEditDialog = useCallback((
    data: T, 
    title?: string, 
    description?: string
  ) => {
    openDialog('edit', data, title || 'Chỉnh sửa', description);
  }, [openDialog]);
  
  const openViewDialog = useCallback((
    data: T, 
    title?: string, 
    description?: string
  ) => {
    openDialog('view', data, title || 'Xem chi tiết', description);
  }, [openDialog]);
  
  const openDeleteDialog = useCallback((
    data: T, 
    title?: string, 
    description?: string
  ) => {
    openDialog('delete', data, title || 'Xác nhận xóa', description || 'Bạn có chắc chắn muốn xóa mục này không? Hành động này không thể hoàn tác.');
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
  
  // Dialog loading state
  const setDialogLoading = useCallback((loading: boolean) => {
    setDialogState(prev => ({ ...prev, loading }));
  }, []);
  
  // Dialog error state
  const setDialogError = useCallback((error: Error | string | null) => {
    setDialogState(prev => ({ ...prev, error }));
  }, []);
  
  // Dialog submit method
  const submitDialog = useCallback(async (data: any, type: DialogType): Promise<boolean> => {
    if (!onSubmitRef.current) return false;
    
    setDialogState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await onSubmitRef.current(data, type);
      
      setDialogState(prev => ({ 
        ...prev, 
        loading: false,
        // Close dialog on successful submission
        open: result ? false : prev.open
      }));
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setDialogState(prev => ({ ...prev, loading: false, error }));
      return false;
    }
  }, []);
  
  return {
    dialogState,
    openCreateDialog,
    openEditDialog,
    openViewDialog,
    openDeleteDialog,
    openCustomDialog,
    closeDialog,
    setDialogLoading,
    setDialogError,
    submitDialog
  };
}

export default useOptimizedDialog;
