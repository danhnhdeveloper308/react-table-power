import { useState, useCallback, useMemo, useEffect } from 'react';
import { RowSelectionState } from '@tanstack/react-table';
import { BaseTableData, SelectionConfig } from '../types';
import { safeToString, getPropertyValue } from '../utils/typeUtils';

interface UseTableSelectionOptions<T extends BaseTableData = BaseTableData> {
  /**
   * Data to be displayed in the table
   */
  data: T[];
  
  /**
   * Selection configuration
   */
  selectionConfig?: SelectionConfig;
  
  /**
   * Key to identify rows (defaults to 'id')
   */
  rowKey?: string;
  
  /**
   * Whether to preserve selection on page change
   */
  preserveSelectionOnPageChange?: boolean;
  
  /**
   * Callback when selection changes
   */
  onSelectionChange?: (selectedRowKeys: (string | number)[], selectedRows: T[]) => void;
  
  /**
   * Enable persistence of selection
   */
  persist?: boolean;
  
  /**
   * Key for persisting selection state
   */
  persistKey?: string;
}

interface UseTableSelectionReturn<T extends BaseTableData = BaseTableData> {
  /**
   * Currently selected row keys
   */
  selectedRowKeys: (string | number)[];
  
  /**
   * Currently selected row objects
   */
  selectedRows: T[];
  
  /**
   * TanStack React Table compatible row selection state
   */
  rowSelection: RowSelectionState;
  
  /**
   * Set selected row keys
   */
  setSelectedRowKeys: (keys: (string | number)[]) => void;
  
  /**
   * Toggle selection for a specific row
   */
  toggleRowSelection: (rowKey: string | number) => void;
  
  /**
   * Select all rows
   */
  selectAll: () => void;
  
  /**
   * Deselect all rows
   */
  selectNone: () => void;
  
  /**
   * Invert current selection (select unselected rows and vice versa)
   */
  selectInvert: () => void;
  
  /**
   * Check if a specific row is selected
   */
  isRowSelected: (rowKey: string | number) => boolean;
  
  /**
   * Check if all rows are selected
   */
  isAllSelected: boolean;
  
  /**
   * Check if some (but not all) rows are selected
   */
  isSomeSelected: boolean;
  
  /**
   * Count of selected rows
   */
  selectedCount: number;
  
  /**
   * Selection mode ('multiple' or 'single')
   */
  selectionMode: 'multiple' | 'single';
  
  /**
   * Type of selection UI ('checkbox' or 'radio')
   */
  selectionType: 'checkbox' | 'radio' | 'row';
}

/**
 * Hook for managing table row selection
 */
export function useTableSelection<T extends BaseTableData = BaseTableData>({
  data,
  selectionConfig,
  rowKey = 'id',
  preserveSelectionOnPageChange = false,
  onSelectionChange,
  persist = false,
  persistKey = 'table-selection',
}: UseTableSelectionOptions<T>): UseTableSelectionReturn<T> {
  // Determine if selection is enabled
  const isSelectionEnabled = useMemo(() => 
    selectionConfig?.enabled !== false, 
    [selectionConfig]
  );
  
  // Determine selection mode and type
  const selectionMode = useMemo(() => 
    selectionConfig?.mode || 'multiple', 
    [selectionConfig]
  );
  
  const selectionType = useMemo(() => 
    selectionConfig?.selectionType || (selectionMode === 'single' ? 'radio' : 'checkbox'), 
    [selectionConfig, selectionMode]
  );
  
  // Get row key function
  const getRowKey = useCallback((row: T): string | number => {
    if (typeof selectionConfig?.rowKey === 'function') {
      return selectionConfig.rowKey(row as BaseTableData, 0);
    }
    
    const keyField = selectionConfig?.rowKey || rowKey;
    // Use safe property access with our utility function
    if (keyField in row) {
      const keyValue = getPropertyValue(row, keyField);
      return keyValue !== undefined && keyValue !== null ? keyValue : (row.id ?? '');
    }
    return row.id ?? '';
  }, [selectionConfig, rowKey]);
  
  // Load persisted selection if available
  const loadPersistedSelection = useCallback(() => {
    if (!persist || !persistKey || typeof window === 'undefined') {
      return selectionConfig?.selectedRowKeys || [];
    }
    
    try {
      const saved = localStorage.getItem(`selection-${persistKey}`);
      if (saved) {
        const savedKeys = JSON.parse(saved);
        return Array.isArray(savedKeys) ? savedKeys : [];
      }
    } catch (error) {
      console.warn('Failed to load persisted selection:', error);
    }
    
    return selectionConfig?.selectedRowKeys || [];
  }, [selectionConfig, persist, persistKey]);
  
  // Selection state
  const [selectedRowKeys, setSelectedRowKeys] = useState<(string | number)[]>(loadPersistedSelection);
  
  // Persist selection when it changes
  useEffect(() => {
    if (persist && persistKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`selection-${persistKey}`, JSON.stringify(selectedRowKeys));
      } catch (error) {
        console.warn('Failed to persist selection:', error);
      }
    }
    
    // Call onSelectionChange callback if provided
    if (onSelectionChange || selectionConfig?.onSelect) {
      const selectedRows = data.filter(row => {
        const key = getRowKey(row);
        return selectedRowKeys.includes(key);
      });
      
      if (onSelectionChange) {
        onSelectionChange(selectedRowKeys, selectedRows);
      }
      
      if (selectionConfig?.onSelect) {
        selectionConfig.onSelect(selectedRowKeys, selectedRows as BaseTableData[]);
      }
    }
  }, [selectedRowKeys, data, persist, persistKey, onSelectionChange, selectionConfig, getRowKey]);
  
  // Convert to TanStack row selection state
  const rowSelection = useMemo(() => {
    const selectionMap: RowSelectionState = {};
    selectedRowKeys.forEach(key => {
      // Use safeToString instead of toString
      selectionMap[safeToString(key)] = true;
    });
    return selectionMap;
  }, [selectedRowKeys]);
  
  // Get selected rows data
  const selectedRows = useMemo(() => {
    return data.filter(row => {
      const key = getRowKey(row);
      return selectedRowKeys.includes(key);
    });
  }, [data, selectedRowKeys, getRowKey]);
  
  // Count of selected rows
  const selectedCount = useMemo(() => selectedRowKeys.length, [selectedRowKeys]);
  
  // All available row keys in current data
  const allRowKeys = useMemo(() => {
    return data.map(getRowKey);
  }, [data, getRowKey]);
  
  // Check if all rows are selected
  const isAllSelected = useMemo(() => {
    if (data.length === 0) return false;
    return data.length === selectedCount;
  }, [data.length, selectedCount]);
  
  // Check if some (but not all) rows are selected
  const isSomeSelected = useMemo(() => {
    return selectedCount > 0 && !isAllSelected;
  }, [selectedCount, isAllSelected]);
  
  // Set selected row keys
  const setSelectedRowKeysCallback = useCallback((keys: (string | number)[]) => {
    if (!isSelectionEnabled) return;
    
    // Handle single selection mode
    if (selectionMode === 'single') {
      setSelectedRowKeys(keys.length > 0 ? [keys[0]] : []);
    } else {
      setSelectedRowKeys(keys);
    }
  }, [isSelectionEnabled, selectionMode]);
  
  // Toggle selection for a specific row
  const toggleRowSelection = useCallback((rowKey: string | number) => {
    if (!isSelectionEnabled) return;
    
    setSelectedRowKeys(prev => {
      const isSelected = prev.includes(rowKey);
      
      // If in single selection mode, replace selection
      if (selectionMode === 'single') {
        return isSelected ? [] : [rowKey];
      }
      
      // In multiple selection mode, toggle selection
      if (isSelected) {
        return prev.filter(key => key !== rowKey);
      } else {
        return [...prev, rowKey];
      }
    });
  }, [isSelectionEnabled, selectionMode]);
  
  // Check if a specific row is selected
  const isRowSelected = useCallback((rowKey: string | number) => {
    return selectedRowKeys.includes(rowKey);
  }, [selectedRowKeys]);
  
  // Select all rows
  const selectAll = useCallback(() => {
    if (!isSelectionEnabled || selectionMode === 'single') return;
    
    setSelectedRowKeys(allRowKeys);
  }, [isSelectionEnabled, selectionMode, allRowKeys]);
  
  // Deselect all rows
  const selectNone = useCallback(() => {
    if (!isSelectionEnabled) return;
    
    setSelectedRowKeys([]);
  }, [isSelectionEnabled]);
  
  // Invert current selection
  const selectInvert = useCallback(() => {
    if (!isSelectionEnabled || selectionMode === 'single') return;
    
    const invertedKeys = allRowKeys.filter(key => !selectedRowKeys.includes(key));
    setSelectedRowKeys(invertedKeys);
  }, [isSelectionEnabled, selectionMode, allRowKeys, selectedRowKeys]);
  
  return {
    selectedRowKeys,
    selectedRows,
    rowSelection,
    setSelectedRowKeys: setSelectedRowKeysCallback,
    toggleRowSelection,
    selectAll,
    selectNone,
    selectInvert,
    isRowSelected,
    isAllSelected,
    isSomeSelected,
    selectedCount,
    selectionMode,
    selectionType
  };
}