import { useState, useCallback, useEffect } from 'react';
import { TableColumn, BaseTableData } from '../types';

export interface UseColumnVisibilityProps<T extends BaseTableData = BaseTableData> {
  columns: TableColumn<T>[];
  defaultVisibility?: Record<string, boolean>;
  defaultHidden?: string[];
  storageKey?: string;
  persist?: boolean;
  persistKey?: string;
  onVisibilityChange?: (visibility: Record<string, boolean>) => void;
}

export interface UseColumnVisibilityReturn<T extends BaseTableData = BaseTableData> {
  columnVisibility: Record<string, boolean>;
  visibleColumns: TableColumn<T>[];
  hiddenColumns: string[];
  toggleColumnVisibility: (columnId: string) => void;
  setColumnVisibility: (columnId: string, isVisible: boolean) => void;
  resetColumnVisibility: () => void;
  toggleAllColumns: (visible?: boolean) => void;
  showAllColumns: () => void;
  hideAllColumns: () => void;
  resetColumns: () => void;
  isColumnHidden: (columnId: string) => boolean;
}

/**
 * Hook to manage column visibility state in a data table
 * 
 * @param props.columns - Array of column definitions
 * @param props.defaultVisibility - Default visibility state for columns
 * @param props.defaultHidden - Array of column IDs to hide by default
 * @param props.storageKey - Key to use for persisting state in localStorage
 * @param props.persist - Whether to persist state to localStorage
 * @param props.persistKey - Alternative key for localStorage (alias for storageKey)
 * @param props.onVisibilityChange - Callback when visibility changes
 * @returns Object with column visibility state and methods
 */
export function useColumnVisibility<T extends BaseTableData = BaseTableData>({
  columns,
  defaultVisibility,
  defaultHidden = [],
  storageKey,
  persist = true, 
  persistKey,
  onVisibilityChange,
}: UseColumnVisibilityProps<T>): UseColumnVisibilityReturn<T> {
  const localStorageKey = persistKey || storageKey || 'react-power-table-column-visibility';

  const getInitialState = useCallback(() => {
    // Initialize with all columns visible by default
    const initialState: Record<string, boolean> = {};
    
    // Set default visibility for all columns
    columns.forEach((column) => {
      const columnId = String(column.id || column.accessorKey as string);
      if (columnId) {
        // If column has an explicit defaultVisible setting, use it
        // Otherwise, check if it's in defaultHidden array
        initialState[columnId] = column.defaultVisible !== undefined 
          ? column.defaultVisible 
          : !defaultHidden.includes(columnId);
      }
    });

    // Override with provided defaultVisibility if any
    if (defaultVisibility) {
      Object.keys(defaultVisibility).forEach(columnId => {
        if (initialState[columnId] !== undefined) {
          initialState[columnId] = defaultVisibility[columnId];
        }
      });
    }
    
    // Check if we have saved state in localStorage
    if (persist && typeof window !== 'undefined') {
      try {
        const savedState = localStorage.getItem(localStorageKey);
        if (savedState) {
          const parsedState = JSON.parse(savedState) as Record<string, boolean>;
          
          // Only use values for columns that still exist
          Object.keys(parsedState).forEach(columnId => {
            if (initialState[columnId] !== undefined) {
              initialState[columnId] = parsedState[columnId];
            }
          });
        }
      } catch (error) {
        console.error('Error loading column visibility from localStorage:', error);
      }
    }
    
    return initialState;
  }, [columns, defaultVisibility, defaultHidden, persist, localStorageKey]);

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(getInitialState);

  // Handle column changes
  useEffect(() => {
    // Add visibility state for any new columns
    const updatedVisibility = { ...columnVisibility };
    let hasChanges = false;

    columns.forEach((column) => {
      const columnId = String(column.id || column.accessorKey as string);
      if (columnId && updatedVisibility[columnId] === undefined) {
        // Use defaultVisible if specified, otherwise check if it's in defaultHidden
        updatedVisibility[columnId] = column.defaultVisible !== undefined 
          ? column.defaultVisible 
          : !defaultHidden.includes(columnId);
        hasChanges = true;
      }
    });

    // Update visibility state if there were changes
    if (hasChanges) {
      setColumnVisibility(updatedVisibility);
      onVisibilityChange?.(updatedVisibility);
    }
  }, [columns, defaultHidden, onVisibilityChange]);

  // Save visibility state to localStorage when it changes
  useEffect(() => {
    if (persist && typeof window !== 'undefined') {
      try {
        localStorage.setItem(localStorageKey, JSON.stringify(columnVisibility));
        onVisibilityChange?.(columnVisibility);
      } catch (error) {
        console.error('Error saving column visibility to localStorage:', error);
      }
    }
  }, [columnVisibility, persist, localStorageKey, onVisibilityChange]);

  // Toggle visibility for a specific column
  const toggleColumnVisibility = useCallback((columnId: string) => {
    setColumnVisibility(prev => {
      const newState = {
        ...prev,
        [columnId]: !prev[columnId]
      };
      
      return newState;
    });
  }, []);

  // Set visibility for a specific column
  const setVisibility = useCallback((columnId: string, isVisible: boolean) => {
    setColumnVisibility(prev => ({
      ...prev,
      [columnId]: isVisible
    }));
  }, []);

  // Reset to default visibility
  const resetColumnVisibility = useCallback(() => {
    setColumnVisibility(getInitialState());
  }, [getInitialState]);

  // Toggle all columns visibility
  const toggleAllColumns = useCallback((visible?: boolean) => {
    setColumnVisibility(prev => {
      const newState = { ...prev };
      const targetValue = visible !== undefined ? visible : !Object.values(prev).every(v => v);

      // Ensure we have all current columns
      columns.forEach(column => {
        const columnId = String(column.id || column.accessorKey as string);
        if (columnId) {
          newState[columnId] = targetValue;
        }
      });

      return newState;
    });
  }, [columns]);

  // Show all columns
  const showAllColumns = useCallback(() => {
    const newState: Record<string, boolean> = {};
    
    // Set all columns to visible
    columns.forEach(column => {
      const columnId = String(column.id || column.accessorKey as string);
      if (columnId) {
        newState[columnId] = true;
      }
    });
    
    setColumnVisibility(newState);
  }, [columns]);

  // Hide all columns
  const hideAllColumns = useCallback(() => {
    const newState: Record<string, boolean> = {};
    
    // Set all columns to hidden
    columns.forEach(column => {
      const columnId = String(column.id || column.accessorKey as string);
      if (columnId) {
        newState[columnId] = false;
      }
    });
    
    setColumnVisibility(newState);
  }, [columns]);

  // Reset columns to default visibility (alias for resetColumnVisibility)
  const resetColumns = useCallback(() => {
    resetColumnVisibility();
  }, [resetColumnVisibility]);
  
  // Check if a column is hidden
  const isColumnHidden = useCallback((columnId: string): boolean => {
    return columnVisibility[columnId] === false;
  }, [columnVisibility]);

  // Get array of hidden column ids
  const hiddenColumns = Object.entries(columnVisibility)
    .filter(([_, isVisible]) => isVisible === false)
    .map(([columnId]) => columnId);
  
  // Filter columns based on visibility state
  const visibleColumns = columns.filter(column => {
    const columnId = String(column.id || column.accessorKey as string);
    return columnId ? columnVisibility[columnId] !== false : true;
  });

  return {
    columnVisibility,
    visibleColumns,
    hiddenColumns,
    toggleColumnVisibility,
    setColumnVisibility: setVisibility,
    resetColumnVisibility,
    toggleAllColumns,
    showAllColumns,
    hideAllColumns,
    resetColumns,
    isColumnHidden
  };
}