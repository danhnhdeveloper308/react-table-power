import { useState, useCallback, useRef, useEffect } from 'react';
import { DialogType, BaseTableData } from '../types';
import { title } from 'process';

// CRITICAL FIX: Create atomic dialog state manager
class DialogStateManager {
  private state = {
    open: false,
    type: null as DialogType | null,
    data: null as any,
    loading: false,
    error: null as Error | string | null,
    title: undefined as string | undefined,
    description: undefined as string | undefined
  };
  
  private listeners = new Set<(state: typeof this.state) => void>();
  private loadingTimeoutRef: NodeJS.Timeout | null = null;
  private stateHistory: Array<typeof this.state> = [];

  getState() {
    return { ...this.state };
  }

  setState(updates: Partial<typeof this.state>) {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...updates };
    
    // Clear loading timeout if we're no longer loading
    if (this.loadingTimeoutRef && !this.state.loading) {
      clearTimeout(this.loadingTimeoutRef);
      this.loadingTimeoutRef = null;
    }
    
    this.notifyListeners();
  }

  setLoading(loading: boolean) {
    if (loading) {
      // Clear any existing timeout
      if (this.loadingTimeoutRef) {
        clearTimeout(this.loadingTimeoutRef);
      }
      
      // Save state before loading
      this.stateHistory.push({ ...this.state });
      
      this.setState({ loading: true, error: null });
      
      // CRITICAL FIX: Emergency timeout to prevent stuck loading
      this.loadingTimeoutRef = setTimeout(() => {
        console.warn('[DialogStateManager] Emergency clearing stuck loading state');
        this.setState({ loading: false });
        this.loadingTimeoutRef = null;
      }, 30000); // 30 second emergency timeout
    } else {
      // Use atomic update to clear loading
      this.setState({ loading: false });
      
      if (this.loadingTimeoutRef) {
        clearTimeout(this.loadingTimeoutRef);
        this.loadingTimeoutRef = null;
      }
    }
  }

  close() {
    // Clear any pending timeouts
    if (this.loadingTimeoutRef) {
      clearTimeout(this.loadingTimeoutRef);
      this.loadingTimeoutRef = null;
    }
    
    // Clear state history
    this.stateHistory = [];
    
    // Atomic close operation
    this.setState({
      open: false,
      loading: false,
      error: null,
      type: null,
      data: null,
      title: undefined,
      description: undefined
    });
  }

  // CRITICAL FIX: Add error recovery method
  recoverFromError() {
    if (this.loadingTimeoutRef) {
      clearTimeout(this.loadingTimeoutRef);
      this.loadingTimeoutRef = null;
    }
    
    // Restore previous state if available
    const previousState = this.stateHistory.pop();
    if (previousState) {
      this.setState({
        ...previousState,
        loading: false,
        error: null
      });
    } else {
      this.setState({
        loading: false,
        error: null
      });
    }
  }

  subscribe(listener: (state: typeof this.state) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }
}

export interface DialogState<T = any> {
  open: boolean;
  type?: DialogType;
  title?: string;
  description?: string;
  data?: T | null;
  loading: boolean;
  error: Error | string | null;
}

export interface UseTableDialogReturn<T = any> {
  open: boolean;
  dialogType: DialogType | null;
  dialogData?: T | null;
  dialogTitle?: string;
  dialogDescription?: string;
  loading: boolean;
  error: Error | string | null;
  openCreateDialog: (data?: T, title?: string, description?: string) => void;
  openEditDialog: (data: T, title?: string, description?: string) => void;
  openViewDialog: (data: T, title?: string, description?: string) => void;
  openDeleteDialog: (data: T, title?: string, description?: string) => void;
  openCustomDialog: (type: string, data: any, title?: string, description?: string) => void;
  closeDialog: () => void;
  submitDialog: (data: any, type: DialogType | null) => Promise<boolean>;
}

export interface UseTableDialogProps<T = any> {
  onSubmit?: (data: any, type: DialogType | null) => Promise<boolean> | boolean;
  onClose?: () => void;
  initialState?: Partial<DialogState<T>>;
}

/**
 * useTableDialog - Hook for managing dialog state and actions
 */
export function useTableDialog<T extends BaseTableData = BaseTableData>({
  onSubmit,
  onClose,
  initialState = {}
}: UseTableDialogProps<T> = {}): UseTableDialogReturn<T> {
  
  // CRITICAL FIX: Use atomic dialog state manager
  const dialogManager = useRef(new DialogStateManager()).current;
  const [dialogState, setDialogState] = useState(dialogManager.getState());

  // Store callback in ref to avoid unnecessary rerenders
  const onSubmitRef = useRef(onSubmit);
  const onCloseRef = useRef(onClose);

  // Subscribe to dialog state changes
  useEffect(() => {
    const unsubscribe = dialogManager.subscribe(setDialogState);
    return () => {
      unsubscribe();
    };
  }, [dialogManager]);

  // Keep callback refs updated
  useEffect(() => {
    onSubmitRef.current = onSubmit;
    onCloseRef.current = onClose;
  }, [onSubmit, onClose]);

  // CRITICAL FIX: Atomic dialog operations
  const openDialog = useCallback((
    type: DialogType,
    data?: T | null,
    title?: string,
    description?: string
  ) => {
    console.log(`Opening ${type} dialog`);
    
    dialogManager.setState({
      open: true,
      type,
      title,
      description,
      data,
      loading: false,
      error: null
    });
  }, [dialogManager]);

  // Close dialog with cleanup
  const closeDialog = useCallback(() => {
    dialogManager.close();
    onCloseRef.current?.();
  }, [dialogManager]);

  // CRITICAL FIX: Enhanced submit with better error recovery
  const submitDialog = useCallback(async (data: any, type: DialogType | null): Promise<boolean> => {
    if (!onSubmitRef.current) return false;
    
    try {
      dialogManager.setLoading(true);
      
      const safeData = data || {};
      const result = await onSubmitRef.current(safeData, type);
      
      // CRITICAL FIX: Enhanced success handling
      if (result === true) {
        dialogManager.close(); // This will also clear loading and history
        return true;
      } else {
        // CRITICAL FIX: Recover from failed submission
        dialogManager.recoverFromError();
        return false;
      }
    } catch (err) {
      console.error('Error in submitDialog:', err);
      const error = err instanceof Error ? err : new Error(String(err));
      
      // CRITICAL FIX: Enhanced error handling with recovery
      dialogManager.setState({
        loading: false,
        error,
        open: true // Keep dialog open on error
      });
      
      // CRITICAL FIX: Auto-clear error after delay to improve UX
      setTimeout(() => {
        if (dialogManager.getState().error === error) {
          dialogManager.setState({ error: null });
        }
      }, 10000); // Clear error after 10 seconds
      
      return false;
    }
  }, [dialogManager]);

  // Dialog operation methods
  const openCreateDialog = useCallback((
    data?: T,
    title?: string,
    description?: string
  ) => {
    openDialog('create', data || null, title || 'Thêm mới', description);
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
    openDialog('delete', data, title || 'Xác nhận xóa', description || 'Bạn có chắc chắn muốn xóa mục này?');
  }, [openDialog]);

  const openCustomDialog = useCallback((
    type: string,
    data: any,
    title?: string,
    description?: string
  ) => {
    openDialog(type as DialogType, data, title, description);
  }, [openDialog]);

  return {
    open: dialogState.open,
    dialogType: dialogState.type,
    dialogData: dialogState.data,
    dialogTitle: dialogState.title,
    dialogDescription: dialogState.description,
    loading: dialogState.loading,
    error: dialogState.error,
    openCreateDialog,
    openEditDialog,
    openViewDialog,
    openDeleteDialog,
    openCustomDialog,
    closeDialog,
    submitDialog
  };
}

export default useTableDialog;