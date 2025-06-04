import { useState, useCallback } from 'react';
import { BaseTableData, DialogType } from '../types';

interface UseTableDialogOptions {
  /**
   * Callback when dialog is submitted
   */
  onSubmit?: (data: any, type: DialogType) => void | Promise<void>;
  
  /**
   * Whether to close dialog on submit
   * @default true
   */
  closeOnSubmit?: boolean;
  
  /**
   * Default title for each dialog type
   */
  defaultTitles?: Record<DialogType, string>;
  
  /**
   * Default description for each dialog type
   */
  defaultDescriptions?: Record<DialogType, string>;
}

export function useTableDialog({
  onSubmit,
  closeOnSubmit = true,
  defaultTitles = {
    create: 'Tạo mới',
    edit: 'Chỉnh sửa',
    view: 'Xem chi tiết',
    delete: 'Xóa',
    custom: 'Chi tiết',
  },
  defaultDescriptions = {
    delete: '',
    create: '',
    edit: '',
    view: '',
    custom: '',
  },
}: UseTableDialogOptions = {}) {
  // Dialog state
  const [open, setOpen] = useState(false);
  const [dialogType, setDialogType] = useState<DialogType>('view');
  const [dialogData, setDialogData] = useState<any>(null);
  const [dialogTitle, setDialogTitle] = useState<string>('');
  const [dialogDescription, setDialogDescription] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Open dialog with specific type, data, title and description
   */
  const openDialog = useCallback((
    type: DialogType, 
    data?: any, 
    title?: string, 
    description?: string
  ) => {
    setDialogType(type);
    setDialogData(data || {});
    setDialogTitle(title || defaultTitles[type]);
    setDialogDescription(description || defaultDescriptions[type]);
    setError(null);
    setOpen(true);
  }, [defaultTitles, defaultDescriptions]);

  /**
   * Open create dialog
   */
  const openCreateDialog = useCallback((
    initialData = {}, 
    title?: string, 
    description?: string
  ) => {
    openDialog('create', initialData, title, description);
  }, [openDialog]);

  /**
   * Open edit dialog
   */
  const openEditDialog = useCallback((
    data: any, 
    title?: string, 
    description?: string
  ) => {
    openDialog('edit', data, title, description);
  }, [openDialog]);

  /**
   * Open view dialog
   */
  const openViewDialog = useCallback((
    data: any, 
    title?: string, 
    description?: string
  ) => {
    openDialog('view', data, title, description);
  }, [openDialog]);

  /**
   * Open delete dialog
   */
  const openDeleteDialog = useCallback((
    data: any, 
    title?: string, 
    description?: string
  ) => {
    openDialog('delete', data, title, description);
  }, [openDialog]);

  /**
   * Open custom dialog
   */
  const openCustomDialog = useCallback((
    data: any, 
    title?: string, 
    description?: string
  ) => {
    openDialog('custom', data, title, description);
  }, [openDialog]);

  /**
   * Close dialog
   */
  const closeDialog = useCallback(() => {
    setOpen(false);
    // Small delay before resetting data to allow exit animations
    setTimeout(() => {
      if (!open) {
        setDialogData(null);
        setError(null);
      }
    }, 300);
  }, [open]);

  /**
   * Submit dialog with data
   */
  const submitDialog = useCallback(async (formData: any) => {
    try {
      setLoading(true);
      setError(null);

      // If no onSubmit callback provided, just close the dialog
      if (!onSubmit) {
        if (closeOnSubmit) {
          closeDialog();
        }
        setLoading(false);
        return;
      }

      // Merge form data with dialog data for context
      const submitData = {
        ...dialogData,
        ...formData
      };

      // Call onSubmit handler
      await Promise.resolve(onSubmit(submitData, dialogType));

      // Close dialog after successful submission if enabled
      if (closeOnSubmit) {
        closeDialog();
      }
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(err?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [onSubmit, dialogType, dialogData, closeOnSubmit, closeDialog]);

  return {
    // State
    open,
    dialogType,
    dialogData,
    dialogTitle,
    dialogDescription,
    loading,
    error,
    
    // Actions
    openDialog,
    openCreateDialog,
    openEditDialog,
    openViewDialog,
    openDeleteDialog,
    openCustomDialog,
    closeDialog,
    submitDialog
  };
}