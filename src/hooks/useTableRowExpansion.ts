import { useState, useCallback, useMemo, useEffect } from 'react';
import { ExpandedState } from '@tanstack/react-table';
import { BaseTableData, RowExpansionConfig } from '../types';
import { safeToString, getPropertyValue } from '../utils/typeUtils';

interface UseTableRowExpansionOptions<T extends BaseTableData = BaseTableData> {
  /**
   * Data to be displayed in the table
   */
  data: T[];
  
  /**
   * Row expansion configuration
   */
  rowExpansionConfig?: RowExpansionConfig;
  
  /**
   * Key to identify rows (defaults to 'id')
   */
  rowKey?: string;
  
  /**
   * Callback when row expansion changes
   */
  onExpandChange?: (expandedRowKeys: (string | number)[], expandedRows: T[]) => void;
  
  /**
   * Enable persistence of expanded state
   */
  persist?: boolean;
  
  /**
   * Key for persisting expanded state
   */
  persistKey?: string;
}

interface UseTableRowExpansionReturn<T extends BaseTableData = BaseTableData> {
  /**
   * Currently expanded row keys
   */
  expandedRowKeys: (string | number)[];
  
  /**
   * Currently expanded row objects
   */
  expandedRows: T[];
  
  /**
   * TanStack React Table compatible expanded state
   */
  expanded: ExpandedState;
  
  /**
   * Set expanded row keys
   */
  setExpandedRowKeys: (keys: (string | number)[]) => void;
  
  /**
   * Toggle expansion for a specific row
   */
  toggleRowExpansion: (rowKey: string | number) => void;
  
  /**
   * Expand a specific row
   */
  expandRow: (rowKey: string | number) => void;
  
  /**
   * Collapse a specific row
   */
  collapseRow: (rowKey: string | number) => void;
  
  /**
   * Expand all rows
   */
  expandAll: () => void;
  
  /**
   * Collapse all rows
   */
  collapseAll: () => void;
  
  /**
   * Check if a specific row is expanded
   */
  isRowExpanded: (rowKey: string | number) => boolean;
  
  /**
   * Render method for expanded row content
   */
  renderExpandedRow: (record: T, index: number) => React.ReactNode | undefined;
  
  /**
   * Check if row expansion is enabled
   */
  isEnabled: boolean;
}

/**
 * Hook for managing table row expansion
 */
export function useTableRowExpansion<T extends BaseTableData = BaseTableData>({
  data,
  rowExpansionConfig,
  rowKey = 'id',
  onExpandChange,
  persist = false,
  persistKey = 'table-expansion',
}: UseTableRowExpansionOptions<T>): UseTableRowExpansionReturn<T> {
  // Determine if row expansion is enabled
  const isEnabled = useMemo(() => 
    rowExpansionConfig?.enabled !== false, 
    [rowExpansionConfig]
  );
  
  // Get row key function
  const getRowKey = useCallback((row: T): string | number => {
    // Use safe property access to get the row key
    if (rowKey in row) {
      const keyValue = getPropertyValue(row, rowKey);
      return keyValue !== undefined && keyValue !== null ? keyValue : (row.id ?? '');
    }
    return row.id ?? '';
  }, [rowKey]);
  
  // Load persisted expansion if available
  const loadPersistedExpansion = useCallback(() => {
    if (!persist || !persistKey || typeof window === 'undefined') {
      return rowExpansionConfig?.expandedRowKeys || [];
    }
    
    try {
      const saved = localStorage.getItem(`expansion-${persistKey}`);
      if (saved) {
        const savedKeys = JSON.parse(saved);
        return Array.isArray(savedKeys) ? savedKeys : [];
      }
    } catch (error) {
      console.warn('Failed to load persisted row expansion:', error);
    }
    
    return rowExpansionConfig?.expandedRowKeys || [];
  }, [rowExpansionConfig, persist, persistKey]);
  
  // Expansion state
  const [expandedRowKeys, setExpandedRowKeys] = useState<(string | number)[]>(loadPersistedExpansion());
  
  // Persist expansion when it changes
  useEffect(() => {
    if (persist && persistKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`expansion-${persistKey}`, JSON.stringify(expandedRowKeys));
      } catch (error) {
        console.warn('Failed to persist row expansion:', error);
      }
    }
    
    // Call onExpandChange callback if provided
    if (onExpandChange || rowExpansionConfig?.onExpand) {
      const expandedRowsData = data.filter(row => {
        const key = getRowKey(row);
        return expandedRowKeys.includes(key);
      });
      
      if (onExpandChange) {
        onExpandChange(expandedRowKeys, expandedRowsData);
      }
      
      // Note: This is not ideal as it would trigger multiple times for each row,
      // but it's here to maintain compatibility with the rowExpansionConfig.onExpand API
      if (rowExpansionConfig?.onExpand && expandedRowKeys.length === 1) {
        const rowKey = expandedRowKeys[0];
        const row = data.find(r => getRowKey(r) === rowKey);
        if (row) {
          rowExpansionConfig.onExpand(true, row as BaseTableData);
        }
      }
    }
  }, [expandedRowKeys, data, persist, persistKey, onExpandChange, rowExpansionConfig, getRowKey]);
  
  // Convert to TanStack expanded state
  const expanded = useMemo(() => {
    const expansionMap: ExpandedState = {};
    expandedRowKeys.forEach(key => {
      // Use safeToString instead of toString
      expansionMap[safeToString(key)] = true;
    });
    return expansionMap;
  }, [expandedRowKeys]);
  
  // Get expanded rows data
  const expandedRows = useMemo(() => {
    return data.filter(row => {
      const key = getRowKey(row);
      return expandedRowKeys.includes(key);
    });
  }, [data, expandedRowKeys, getRowKey]);
  
  // Toggle expansion for a specific row
  const toggleRowExpansion = useCallback((rowKey: string | number) => {
    if (!isEnabled) return;
    
    setExpandedRowKeys(prev => {
      const isExpanded = prev.includes(rowKey);
      
      if (isExpanded) {
        return prev.filter(key => key !== rowKey);
      } else {
        return [...prev, rowKey];
      }
    });
  }, [isEnabled]);
  
  // Expand a specific row
  const expandRow = useCallback((rowKey: string | number) => {
    if (!isEnabled) return;
    
    setExpandedRowKeys(prev => {
      if (prev.includes(rowKey)) {
        return prev;
      }
      return [...prev, rowKey];
    });
  }, [isEnabled]);
  
  // Collapse a specific row
  const collapseRow = useCallback((rowKey: string | number) => {
    if (!isEnabled) return;
    
    setExpandedRowKeys(prev => prev.filter(key => key !== rowKey));
  }, [isEnabled]);
  
  // Check if a specific row is expanded
  const isRowExpanded = useCallback((rowKey: string | number) => {
    return expandedRowKeys.includes(rowKey);
  }, [expandedRowKeys]);
  
  // Expand all rows
  const expandAll = useCallback(() => {
    if (!isEnabled) return;
    
    const allRowKeys = data.map(getRowKey);
    setExpandedRowKeys(allRowKeys);
  }, [isEnabled, data, getRowKey]);
  
  // Collapse all rows
  const collapseAll = useCallback(() => {
    if (!isEnabled) return;
    
    setExpandedRowKeys([]);
  }, [isEnabled]);
  
  // Render expanded row content
  const renderExpandedRow = useCallback((record: T, index: number) => {
    if (!isEnabled) return undefined;
    
    if (rowExpansionConfig?.renderExpandedRow) {
      return rowExpansionConfig.renderExpandedRow(record as BaseTableData, index);
    }
    
    if (rowExpansionConfig?.expandedRowRender) {
      return rowExpansionConfig.expandedRowRender(record as BaseTableData, index);
    }
    
    return undefined;
  }, [isEnabled, rowExpansionConfig]);
  
  return {
    expandedRowKeys,
    expandedRows,
    expanded,
    setExpandedRowKeys,
    toggleRowExpansion,
    expandRow,
    collapseRow,
    expandAll,
    collapseAll,
    isRowExpanded,
    renderExpandedRow,
    isEnabled
  };
}