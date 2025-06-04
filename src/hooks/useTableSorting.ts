import { useState, useCallback, useMemo, useEffect } from 'react';
import { SortingState as TanStackSortingState } from '@tanstack/react-table';
import { BaseTableData, TableColumn, SortConfig, SortDirection } from '../types';

interface UseTableSortingOptions<T extends BaseTableData = BaseTableData> {
  /**
   * Initial sorting configuration
   */
  initialSorting?: SortConfig[];
  
  /**
   * Columns configuration
   */
  columns: TableColumn<T>[];
  
  /**
   * Whether sorting is server-side
   */
  serverSide?: boolean;
  
  /**
   * Enable persistence of sorting state
   */
  persist?: boolean;
  
  /**
   * Key for persisting sorting state
   */
  persistKey?: string;
  
  /**
   * Callback when sorting changes
   */
  onSortingChange?: (sorting: SortConfig[]) => void;
  
  /**
   * Enable multi-column sorting
   */
  multiSort?: boolean;
}

interface UseTableSortingReturn {
  /**
   * Current sorting configuration
   */
  sorting: SortConfig[];
  
  /**
   * TanStack React Table compatible sorting state
   */
  sortingState: TanStackSortingState;
  
  /**
   * Set sorting for a specific column
   */
  setSort: (field: string, direction: SortDirection) => void;
  
  /**
   * Set multiple sort configurations
   */
  setSorting: (sorting: SortConfig[]) => void;
  
  /**
   * Toggle sort direction for a column
   */
  toggleSort: (field: string) => void;
  
  /**
   * Reset sorting to initial state
   */
  resetSorting: () => void;
  
  /**
   * Clear all sorting
   */
  clearSorting: () => void;
  
  /**
   * Get current sort direction for a column
   */
  getSortDirection: (field: string) => SortDirection;
  
  /**
   * Check if a column is sortable
   */
  isSortable: (columnId: string) => boolean;
  
  /**
   * Get sort icon based on current direction
   */
  getSortIndicator: (field: string) => 'asc' | 'desc' | 'none';
  
  /**
   * Check if multi-column sorting is enabled
   */
  isMultiSortEnabled: boolean;
}

/**
 * Hook for managing table sorting
 */
export function useTableSorting<T extends BaseTableData = BaseTableData>({
  initialSorting = [],
  columns,
  serverSide = false,
  persist = false,
  persistKey = 'table-sorting',
  onSortingChange,
  multiSort = true,
}: UseTableSortingOptions<T>): UseTableSortingReturn {
  // Load persisted sorting if available
  const loadPersistedSorting = useCallback(() => {
    if (!persist || typeof window === 'undefined') {
      return initialSorting;
    }
    
    try {
      const saved = localStorage.getItem(`sorting-${persistKey}`);
      if (saved) {
        const savedSorting = JSON.parse(saved);
        if (Array.isArray(savedSorting) && savedSorting.length > 0) {
          // Validate saved sorting against available columns
          return savedSorting.filter(sort => {
            const column = columns.find(col => 
              (col.id?.toString() === sort.field) || 
              (col.accessorKey?.toString() === sort.field)
            );
            return column && column.enableSorting !== false;
          });
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted sorting:', error);
    }
    
    return initialSorting;
  }, [initialSorting, columns, persist, persistKey]);
  
  // Sorting state
  const [sorting, setSorting] = useState<SortConfig[]>(loadPersistedSorting);
  
  // Persist sorting when it changes
  useEffect(() => {
    if (persist && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`sorting-${persistKey}`, JSON.stringify(sorting));
      } catch (error) {
        console.warn('Failed to persist sorting:', error);
      }
    }
    
    // Call onSortingChange callback if provided
    if (onSortingChange) {
      onSortingChange([...sorting]);
    }
  }, [sorting, persist, persistKey, onSortingChange]);
  
  // Convert to TanStack sorting state
  const sortingState = useMemo((): TanStackSortingState => {
    return sorting.map(sort => ({
      id: sort.field,
      desc: sort.direction === 'desc',
    }));
  }, [sorting]);
  
  // Check if a column is sortable
  const isSortable = useCallback((columnId: string) => {
    const column = columns.find(col => 
      (col.id?.toString() === columnId) || 
      (col.accessorKey?.toString() === columnId)
    );
    return column ? column.enableSorting !== false : false;
  }, [columns]);
  
  // Set sort for a specific column
  const setSort = useCallback((field: string, direction: SortDirection) => {
    if (!isSortable(field)) return;
    
    setSorting(prev => {
      // If direction is false, remove sorting for this column
      if (direction === false) {
        return prev.filter(sort => sort.field !== field);
      }
      
      // Check if field already has sorting
      const sortIndex = prev.findIndex(sort => sort.field === field);
      
      // Create new sorting entry
      const newSort: SortConfig = { field, direction };
      
      // Handle multi-sort
      if (multiSort) {
        if (sortIndex >= 0) {
          // Update existing sort
          const newSorting = [...prev];
          newSorting[sortIndex] = newSort;
          return newSorting;
        } else {
          // Add new sort
          return [...prev, newSort];
        }
      } else {
        // Single sort mode - replace all sorting
        return [newSort];
      }
    });
  }, [isSortable, multiSort]);
  
  // Set multiple sort configurations
  const setSortingArray = useCallback((newSorting: SortConfig[]) => {
    // Filter out non-sortable columns
    const filteredSorting = newSorting.filter(sort => isSortable(sort.field));
    setSorting(filteredSorting);
  }, [isSortable]);
  
  // Toggle sort direction for a column
  const toggleSort = useCallback((field: string) => {
    if (!isSortable(field)) return;
    
    setSorting(prev => {
      // Find current sort for this field
      const sortIndex = prev.findIndex(sort => sort.field === field);
      
      // If not currently sorted, add as ascending
      if (sortIndex === -1) {
        const newSort: SortConfig = { field, direction: 'asc' };
        return multiSort ? [...prev, newSort] : [newSort];
      }
      
      // Get current direction
      const currentDirection = prev[sortIndex].direction;
      
      // Toggle direction: asc -> desc -> none
      let newDirection: SortDirection;
      if (currentDirection === 'asc') {
        newDirection = 'desc';
      } else if (currentDirection === 'desc') {
        newDirection = false;
      } else {
        newDirection = 'asc';
      }
      
      // If removing sort (newDirection === false)
      if (newDirection === false) {
        return prev.filter(sort => sort.field !== field);
      }
      
      // Otherwise update the direction
      const newSort: SortConfig = { field, direction: newDirection };
      
      if (multiSort) {
        const newSorting = [...prev];
        newSorting[sortIndex] = newSort;
        return newSorting;
      } else {
        return [newSort];
      }
    });
  }, [isSortable, multiSort]);
  
  // Reset to initial sorting
  const resetSorting = useCallback(() => {
    setSorting(initialSorting);
  }, [initialSorting]);
  
  // Clear all sorting
  const clearSorting = useCallback(() => {
    setSorting([]);
  }, []);
  
  // Get current sort direction for a column
  const getSortDirection = useCallback((field: string): SortDirection => {
    const sort = sorting.find(s => s.field === field);
    return sort ? sort.direction : false;
  }, [sorting]);
  
  // Get sort indicator for a column
  const getSortIndicator = useCallback((field: string): 'asc' | 'desc' | 'none' => {
    const direction = getSortDirection(field);
    if (direction === 'asc') return 'asc';
    if (direction === 'desc') return 'desc';
    return 'none';
  }, [getSortDirection]);
  
  return {
    sorting,
    sortingState,
    setSort,
    setSorting: setSortingArray,
    toggleSort,
    resetSorting,
    clearSorting,
    getSortDirection,
    isSortable,
    getSortIndicator,
    isMultiSortEnabled: multiSort
  };
}