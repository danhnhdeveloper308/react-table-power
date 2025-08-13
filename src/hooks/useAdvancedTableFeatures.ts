/**
 * Advanced table features hook that combines multiple enhancements
 * Provides a unified interface for complex table functionality
 */

import { useMemo, useCallback, useRef, useState } from 'react';
import { BaseTableData, TableColumn, ExportFormat, FilterPreset } from '../types';
import { useVirtualization, VirtualizationConfig } from './useVirtualization';
import { useAdvancedExport, AdvancedExportConfig, ExportProgress } from '../utils/exportUtils';

// ==================== Configuration Interfaces ====================

export interface AdvancedTableConfig<T extends BaseTableData> {
  // Data management
  data: T[];
  columns: TableColumn<T>[];
  
  // Virtualization
  virtualization?: VirtualizationConfig & {
    enabled: boolean;
  };
  
  // Advanced filtering
  advancedFiltering?: {
    enabled: boolean;
    allowPresets: boolean;
    allowComplexQueries: boolean;
    customFilters?: CustomFilter<T>[];
  };
  
  // Bulk operations
  bulkOperations?: {
    enabled: boolean;
    operations: BulkOperation<T>[];
    confirmations?: boolean;
  };
  
  // Performance optimization
  performance?: {
    debounceMs: number;
    memoizeColumns: boolean;
    lazyLoading: boolean;
    cacheResults: boolean;
  };
  
  // Real-time features
  realTime?: {
    enabled: boolean;
    updateInterval?: number;
    onDataUpdate?: (newData: T[]) => void;
  };
  
  // Advanced export
  export?: {
    enabled: boolean;
    formats: ExportFormat[];
    defaultConfig?: AdvancedExportConfig;
    allowCustomization?: boolean;
  };
}

// ==================== Supporting Types ====================

export interface CustomFilter<T extends BaseTableData> {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'range' | 'custom';
  field: keyof T;
  options?: any[];
  validator?: (value: any) => boolean;
  renderer?: (props: FilterRendererProps<T>) => React.ReactNode;
}

export interface FilterRendererProps<T extends BaseTableData> {
  filter: CustomFilter<T>;
  value: any;
  onChange: (value: any) => void;
  onClear: () => void;
}

export interface BulkOperation<T extends BaseTableData> {
  id: string;
  label: string;
  icon?: React.ReactNode;
  handler: (selectedRows: T[]) => Promise<BulkOperationResult>;
  confirmation?: {
    title: string;
    message: string;
    variant?: 'warning' | 'danger';
  };
  permissions?: string[];
  disabled?: (selectedRows: T[]) => boolean;
}

export interface BulkOperationResult {
  success: boolean;
  message?: string;
  affectedRows?: number;
  errors?: Array<{ row: any; error: string }>;
}

// ==================== Hook Implementation ====================

export function useAdvancedTableFeatures<T extends BaseTableData>(
  config: AdvancedTableConfig<T>
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [filterPresets, setFilterPresets] = useState<FilterPreset[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [selectedRows, setSelectedRows] = useState<T[]>([]);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);

  // ==================== Virtualization ====================
  
  const virtualization = useVirtualization({
    data: config.data,
    config: config.virtualization,
    containerRef,
  });

  // ==================== Advanced Export ====================
  
  const { exportData } = useAdvancedExport<T>();

  const handleExport = useCallback(async (
    format: ExportFormat,
    customConfig?: AdvancedExportConfig
  ) => {
    const exportConfig: AdvancedExportConfig = {
      ...config.export?.defaultConfig,
      ...customConfig,
      filename: customConfig?.filename || `table-export-${Date.now()}`,
    };

    setExportProgress(null);
    
    try {
      await exportData(
        format,
        selectedRows.length > 0 ? selectedRows : config.data,
        config.columns,
        exportConfig,
        setExportProgress
      );
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [exportData, config.data, config.columns, selectedRows, config.export?.defaultConfig]);

  // ==================== Advanced Filtering ====================
  
  const applyFilters = useCallback((data: T[], filters: Record<string, any>): T[] => {
    if (!config.advancedFiltering?.enabled || Object.keys(filters).length === 0) {
      return data;
    }

    return data.filter(row => {
      return Object.entries(filters).every(([filterKey, filterValue]) => {
        if (filterValue === undefined || filterValue === null || filterValue === '') {
          return true;
        }

        const customFilter = config.advancedFiltering?.customFilters?.find(f => f.id === filterKey);
        if (customFilter) {
          return customFilter.validator ? customFilter.validator(filterValue) : true;
        }

        // Default filtering logic
        const cellValue = row[filterKey as keyof T];
        if (typeof cellValue === 'string' && typeof filterValue === 'string') {
          return cellValue.toLowerCase().includes(filterValue.toLowerCase());
        }
        
        return cellValue === filterValue;
      });
    });
  }, [config.advancedFiltering]);

  const filteredData = useMemo(() => {
    return applyFilters(config.data, activeFilters);
  }, [config.data, activeFilters, applyFilters]);

  // ==================== Bulk Operations ====================
  
  const executeBulkOperation = useCallback(async (
    operationId: string,
    rows: T[] = selectedRows
  ): Promise<BulkOperationResult> => {
    if (!config.bulkOperations?.enabled) {
      throw new Error('Bulk operations are not enabled');
    }

    const operation = config.bulkOperations.operations.find(op => op.id === operationId);
    if (!operation) {
      throw new Error(`Bulk operation '${operationId}' not found`);
    }

    if (operation.disabled && operation.disabled(rows)) {
      throw new Error('Bulk operation is disabled for selected rows');
    }

    try {
      const result = await operation.handler(rows);
      
      if (result.success) {
        // Clear selection after successful operation
        setSelectedRows([]);
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }, [selectedRows, config.bulkOperations]);

  // ==================== Filter Presets ====================
  
  const saveFilterPreset = useCallback((name: string, filters: Record<string, any>): FilterPreset => {
    const preset: FilterPreset = {
      id: `preset-${Date.now()}`,
      name,
      filters,
      createdAt: new Date(),
    };
    
    setFilterPresets(prev => [...prev, preset]);
    return preset;
  }, []);

  const loadFilterPreset = useCallback((presetId: string) => {
    const preset = filterPresets.find(p => p.id === presetId);
    if (preset) {
      setActiveFilters(preset.filters);
    }
  }, [filterPresets]);

  const deleteFilterPreset = useCallback((presetId: string) => {
    setFilterPresets(prev => prev.filter(p => p.id !== presetId));
  }, []);

  // ==================== Performance Optimization ====================
  
  const memoizedColumns = useMemo(() => {
    if (!config.performance?.memoizeColumns) {
      return config.columns;
    }
    
    return config.columns.map(col => ({
      ...col,
      // Memoize cell renderers if they're functions
      cell: col.cell ? 
        (props: any) => col.cell!(props) : 
        undefined,
    }));
  }, [config.columns, config.performance?.memoizeColumns]);

  // ==================== Real-time Updates ====================
  
  const [realTimeEnabled, setRealTimeEnabled] = useState(config.realTime?.enabled || false);

  const toggleRealTime = useCallback(() => {
    setRealTimeEnabled(prev => !prev);
  }, []);

  // ==================== Return Interface ====================
  
  return {
    // Core data
    data: filteredData,
    columns: memoizedColumns,
    selectedRows,
    setSelectedRows,
    
    // Virtualization
    virtualization: {
      ...virtualization,
      containerRef,
    },
    
    // Filtering
    filtering: {
      activeFilters,
      setActiveFilters,
      applyFilters,
      presets: filterPresets,
      savePreset: saveFilterPreset,
      loadPreset: loadFilterPreset,
      deletePreset: deleteFilterPreset,
    },
    
    // Bulk operations
    bulkOperations: {
      execute: executeBulkOperation,
      operations: config.bulkOperations?.operations || [],
    },
    
    // Export
    export: {
      exportData: handleExport,
      progress: exportProgress,
      formats: config.export?.formats || [],
    },
    
    // Real-time
    realTime: {
      enabled: realTimeEnabled,
      toggle: toggleRealTime,
    },
    
    // Performance metrics
    performance: {
      dataSize: config.data.length,
      filteredSize: filteredData.length,
      selectedSize: selectedRows.length,
      isVirtualized: virtualization.isVirtualized,
    },
  };
}

// ==================== Utility Functions ====================

export function createAdvancedTableConfig<T extends BaseTableData>(
  baseConfig: Partial<AdvancedTableConfig<T>>
): AdvancedTableConfig<T> {
  return {
    data: [],
    columns: [],
    virtualization: {
      enabled: false,
      threshold: 100,
      itemHeight: 50,
      overscan: 5,
    },
    advancedFiltering: {
      enabled: false,
      allowPresets: false,
      allowComplexQueries: false,
    },
    bulkOperations: {
      enabled: false,
      operations: [],
      confirmations: true,
    },
    performance: {
      debounceMs: 300,
      memoizeColumns: true,
      lazyLoading: false,
      cacheResults: true,
    },
    realTime: {
      enabled: false,
      updateInterval: 5000,
    },
    export: {
      enabled: true,
      formats: ['csv', 'excel', 'pdf'],
      allowCustomization: true,
    },
    ...baseConfig,
  };
}

// ==================== Type Guards ====================

export function isAdvancedTableConfig<T extends BaseTableData>(
  config: any
): config is AdvancedTableConfig<T> {
  return (
    config &&
    typeof config === 'object' &&
    Array.isArray(config.data) &&
    Array.isArray(config.columns)
  );
}
