import { useState, useCallback, useRef, useEffect } from 'react';
import { DialogType } from '../types';

export interface UseTableDialogOptions<T = any> {
  /**
   * Default title for dialogs
   */
  defaultTitle?: string;
  
  /**
   * Default description for dialogs
   */
  defaultDescription?: string;
  
  /**
   * Custom dialog titles by type
   */
  dialogTitles?: {
    create?: string;
    edit?: string;
    view?: string;
    delete?: string;
    [key: string]: string | undefined;
  };
  
  /**
   * Function to handle dialog submission
   * Must return a boolean or Promise<boolean> to indicate success
   */
  onSubmit?: (data: T, type: DialogType) => Promise<boolean> | boolean;
}

export function useTableDialog<T = any>(options: UseTableDialogOptions<T> = {}) {
  const [open, setOpen] = useState<boolean>(false);
  const [dialogType, setDialogType] = useState<DialogType | null>(null);
  const [dialogData, setDialogData] = useState<T | undefined>(undefined);
  const [dialogTitle, setDialogTitle] = useState<string>('');
  const [dialogDescription, setDialogDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Use a ref to store the last dialog state to avoid unnecessary re-renders
  const lastDialogState = useRef({
    type: null as DialogType | null,
    data: undefined as T | undefined,
    open: false
  });
  
  // Use another ref to track unmounting to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Set isMounted to false when component unmounts
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Helper function to get appropriate title based on dialog type
  const getDialogTitle = useCallback((type: DialogType, customTitle?: string): string => {
    if (customTitle) return customTitle;
    
    if (options.dialogTitles && options.dialogTitles[type]) {
      return options.dialogTitles[type] || '';
    }
    
    switch (type) {
      case 'create': return 'Thêm mới';
      case 'edit': return 'Chỉnh sửa';
      case 'view': return 'Xem chi tiết';
      case 'delete': return 'Xác nhận xóa';
      case 'custom': return 'Thao tác';
      default: return 'Dialog';
    }
  }, [options.dialogTitles]);

  // Open dialog with specific type and record
  const openDialog = useCallback((type: DialogType, data?: T, title?: string, description?: string) => {
    // Skip if already open with same data and type to prevent re-renders
    if (
      open && 
      type === lastDialogState.current.type && 
      JSON.stringify(data) === JSON.stringify(lastDialogState.current.data)
    ) {
      return;
    }

    // Chỉ cập nhật state nếu component vẫn mounted
    if (!isMountedRef.current) return;

    setDialogType(type);
    setDialogData(data);
    setDialogTitle(title || getDialogTitle(type));
    setDialogDescription(description || '');
    setError(null);
    
    // Update ref để theo dõi current dialog state
    lastDialogState.current = {
      type,
      data,
      open: true
    };
    
    // Open dialog at end to ensure all state is set first
    setOpen(true);
  }, [open, getDialogTitle]);

  // Close dialog
  const closeDialog = useCallback(() => {
    // Kiểm tra component còn mounted không
    if (!isMountedRef.current) return;
    
    // Use setTimeout and refs to avoid state updates after component unmounts
    setOpen(false);
    
    // Record that dialog was closed in lastDialogState
    lastDialogState.current = {
      ...lastDialogState.current,
      open: false
    };
    
    // Use a small delay for animation before resetting state
    const timer = setTimeout(() => {
      // Kiểm tra component còn mounted không
      if (!isMountedRef.current) return;
      
      // Only reset state if dialog is still closed
      if (!lastDialogState.current.open) {  
        setDialogType(null);
        setDialogData(undefined);
        setDialogTitle('');
        setDialogDescription('');
        setError(null);
        setLoading(false);
      }
    }, 300);
    
    // Cleanup timer on unmount
    return () => clearTimeout(timer);
  }, []);

  // Submit dialog data with better error handling
  const submitDialog = useCallback(async (data: any, type: DialogType): Promise<boolean> => {
    if (!options.onSubmit) {
      console.warn('No onSubmit handler provided to useTableDialog');
      return false;
    }
    
    if (!isMountedRef.current) return false;
    
    try {
      setLoading(true);
      setError(null);
      
      // For delete operations, ensure we have valid data
      if (type === 'delete') {
        console.log('Processing delete submission with data:', data);
        
        if (!data) {
          console.error('Delete operation called with no data');
          setError(new Error('No data provided for deletion'));
          setLoading(false);
          return false;
        }
        
        // Ensure there's an ID property for delete - critical for built-in functions
        let recordWithId = data;
        
        // Check for missing ID
        if (typeof data === 'object' && !('id' in data)) {
          // Try to get ID from _id (MongoDB style)
          if ('_id' in data) {
            recordWithId = {
              ...data,
              id: data._id
            };
          } else {
            console.error('Delete operation missing ID in data:', data);
            setError(new Error('Missing ID for delete operation'));
            setLoading(false);
            return false;
          }
        }

        // Call the submission handler with the enhanced data
        const result = await options.onSubmit(recordWithId, type);
        
        if (!isMountedRef.current) return false;
        
        if (result === true) {
          closeDialog();
          return true;
        } else {
          console.warn('Delete operation did not return success (true)');
          setLoading(false);
          return false;
        }
      }
      
      // Call handler with data and type
      const result = await options.onSubmit(data, type);
      
      // Kiểm tra component còn mounted không
      if (!isMountedRef.current) return false;
      
      // Only close if result is explicitly true
      if (result === true) {
        closeDialog();
        return true;
      }
      
      setLoading(false);
      return false;
    } catch (err) {
      console.error('Error in dialog submission:', err);
      
      if (!isMountedRef.current) return false;
      
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      setLoading(false);
      return false;
    }
  }, [options.onSubmit, closeDialog]);

  // Convenience methods for different dialog types
  const openCreateDialog = useCallback((initialData?: T, title?: string, description?: string) => {
    openDialog('create', initialData, title, description);
  }, [openDialog]);

  const openEditDialog = useCallback((data: T, title?: string, description?: string) => {
    openDialog('edit', data, title, description);
  }, [openDialog]);

  const openViewDialog = useCallback((data: T, title?: string, description?: string) => {
    openDialog('view', data, title, description);
  }, [openDialog]);

  // Convenience method for delete with normal confirmation
  const openDeleteDialog = useCallback((data: T, title?: string, description?: string) => {
    const deleteTitle = title || 'Xác nhận xóa';
    const deleteDescription = description || 'Bạn có chắc chắn muốn xóa mục này không?';
    
    // Always use normal confirmation dialog
    openDialog('delete', data, deleteTitle, deleteDescription);
  }, [openDialog]);

  const openCustomDialog = useCallback((data: T, title?: string, description?: string) => {
    openDialog('custom', data, title, description);
  }, [openDialog]);

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
    openDialog,
    openCreateDialog,
    openEditDialog,
    openViewDialog,
    openDeleteDialog,
    openCustomDialog,
    submitDialog,
    closeDialog,
  };
}