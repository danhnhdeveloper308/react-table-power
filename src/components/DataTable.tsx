import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { cn } from '../utils/cn';
import { 
  BaseTableData,
  DataTableProps,
  TableThemeConfig,
  FilterConfig,
  GlobalSearchConfig,
  DialogType,
  DialogMode,
  SelectionConfig,
  TableSize,
  SortDirection,
  ActionConfig,
  DataTableFormProps,
  TableColumn,
  PaginationConfig,
  SortConfig
} from '../types';

// Import components
import Table from './table/Table';
import TableContainer from './table/TableContainer';
import TableHead from './table/TableHead';
import TableBody from './table/TableBody';
import TableHeadRow from './table/TableHeadRow';
import TableRow from './table/TableRow';
import TableHeadCell from './table/TableHeadCell';
import TableCell from './table/TableCell';
import TableToolbar from './table/TableToolbar';
import TablePagination from './table/TablePagination';
import TableRowActions from './table/TableRowActions';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';
import Checkbox from './form/Checkbox';
import ThemeProvider from './ThemeProvider';
import BatchActionsBar from './BatchActionsBar';

import OptimizedDialog from './OptimizedDialog';

// Import hooks
import { useAnimationPreference } from '../hooks/useAnimationPreference';
import { useTableDialog } from '../hooks/useTableDialog';
import { useTableExport } from '../hooks/useTableExport';
import { useColumnVisibility } from '../hooks/useColumnVisibility';
import { useTableFilter } from '../hooks/useTableFilter';
import { 
  FormHandlingProvider, 
  useFormHandling,
  withFormHandling 
} from '../contexts/FormHandlingContext';

// Import DataTableConfig context
import { useDataTableConfig } from '../contexts/DataTableConfigContext';

// For better animations
import { motion, AnimatePresence } from 'framer-motion';
import useSafeTableSettings from '../hooks/useSafeTableSettings';
import { TableSettings, useLoadingStateManager } from '../hooks';

declare global {
  interface Window {
    __REACT_TABLE_POWER_COMPONENTS?: Record<string, boolean>;
  }
}

// Register the non-SSR component reference for TableSettings
if (typeof window !== 'undefined') {
  // Make sure the property exists before using it
  window.__REACT_TABLE_POWER_COMPONENTS = window.__REACT_TABLE_POWER_COMPONENTS || {};
  window.__REACT_TABLE_POWER_COMPONENTS.TableSettings = true;
}

// Wrap the main component with FormHandlingProvider
const DataTableWithFormHandling = <T extends BaseTableData = BaseTableData>(props: DataTableProps<T>) => {
  return (
    <FormHandlingProvider>
      <DataTableInner {...props} />
    </FormHandlingProvider>
  );
};

// The inner component that uses the FormHandlingContext
function DataTableInner<T extends BaseTableData = BaseTableData>({
  data = [],
  columns = [],
  title,
  description,
  loading = false,
  pagination = true,
  total,
  selection,
  sorting = [],
  filters = [],
  globalSearch,
  actions,
  size = 'medium',
  striped = false,
  bordered = false,
  hover = true,
  responsive = true,
  className,
  tableClassName,
  emptyStateRenderer,
  errorStateRenderer,
  loadingConfig,
  eventHandlers,
  builtInActions,
  rowExpansion,
  animate = true,
  export: exportConfig,
  dialog,
  theme,
  sticky = false,
  persistSettings,
  filteringOptions = {},
  ...props
}: DataTableProps<T>): React.ReactElement {
  
  // CRITICAL FIX: Use centralized loading state manager
  const loadingManager = useLoadingStateManager();
  
  // Get global default configs
  const defaultConfig = useDataTableConfig();

  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchValue, setSearchValue] = useState('');
  const [sortingState, setSortingState] = useState<SortConfig[]>(sorting);
  const [selectedRowKeys, setSelectedRowKeys] = useState<(string | number)[]>([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState<(string | number)[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [updatedRowKeys, setUpdatedRowKeys] = useState<Set<string | number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // CRITICAL FIX: Add missing internalData state
  const [internalData, setInternalData] = useState<T[]>(data);
  
  // Theo dõi thay đổi của dữ liệu đầu vào từ props
  useEffect(() => {
    setInternalData(data);
  }, [data]);
  
  // CRITICAL FIX: Simplified refresh without loading manager conflicts
  const triggerRefresh = useCallback(async (reason?: string) => {
    if (!eventHandlers?.onRefresh) {
      console.warn('[DataTable] No refresh handler available');
      return;
    }
    
    try {
      const refreshResult = eventHandlers.onRefresh();
      
      if (refreshResult instanceof Promise) {
        await refreshResult;
      }
      
      console.log('[DataTable] Refresh completed successfully');
    } catch (error) {
      console.error('[DataTable] Error during refresh:', error);
    }
  }, [eventHandlers?.onRefresh]);

  const builtInBatchDelete = useCallback(async (selectedRows: T[]): Promise<boolean> => {
    if (selectedRows.length === 0) return false;
    
    try {
      let successCount = 0;
      
      for (const row of selectedRows) {
        const rowId = row.id;
        if (rowId !== undefined && eventHandlers?.onDelete) {
          try {
            console.log(`[DataTable] Deleting item with ID: ${rowId}`);
            const success = await eventHandlers.onDelete(rowId);
            
            if (success) {
              successCount++;
              console.log(`[DataTable] Successfully deleted item: ${rowId}`);
            } else {
              console.warn(`[DataTable] Failed to delete item: ${rowId}`);
            }
          } catch (error) {
            console.error(`[DataTable] Error deleting row with ID ${rowId}:`, error);
          }
        }
      }
      
      // Clear selection regardless of result
      setSelectedRowKeys([]);
      
      // CRITICAL FIX: Simple refresh without complex state management
      if (successCount > 0) {
        try {
          await triggerRefresh('post-batch-delete');
        } catch (refreshError) {
          console.error('[DataTable] Error during post-batch-delete refresh:', refreshError);
        }
      }
      
      return successCount > 0;
    } catch (error) {
      console.error("[DataTable] Error in batch delete operation:", error);
      setSelectedRowKeys([]);
      return false;
    }
  }, [eventHandlers?.onDelete, triggerRefresh]);

  // CRITICAL FIX: Simplified single delete
  const builtInOnDelete = useCallback(async (id: string | number): Promise<boolean> => {
    if (!eventHandlers?.onDelete) {
      console.warn('[DataTable] No delete handler provided');
      return false;
    }

    try {
      const success = await eventHandlers.onDelete(id);
      
      try {
        await triggerRefresh('post-delete');
      } catch (refreshError) {
        console.error('[DataTable] Error during post-delete refresh:', refreshError);
      }
      
      return success;
    } catch (error) {
      console.error('[DataTable] Error in delete:', error);
      
      try {
        await triggerRefresh('post-delete-error');
      } catch (refreshError) {
        console.error('[DataTable] Error during post-delete-error refresh:', refreshError);
      }
      
      throw error;
    }
  }, [eventHandlers?.onDelete, triggerRefresh]);

  const stableLoadingManager = useRef(loadingManager);
  useEffect(() => {
    stableLoadingManager.current = loadingManager;
  }, [loadingManager]);

  useEffect(() => {
    // Only run once on mount
    const hasData = data && data.length > 0;
    if (hasData && isLoading) {
      setIsLoading(false);
    }
    
    // Cleanup on unmount only
    return () => {
      setIsLoading(false);
      loadingManager.clearAllLoading();
    };
  }, []); 

  const shouldShowLoading = useMemo(() => {
    return loading && data.length === 0;
  }, [loading, data.length]);

  // Merge default configs with props - REMOVE automatic theme detection
  const mergedSettings = useMemo(() => {
    // Start with DataTableProvider defaults only
    const baseSettings = {
      size: defaultConfig.size || 'medium',
      striped: defaultConfig.striped ?? false,
      bordered: defaultConfig.bordered ?? false,
      hover: defaultConfig.hover ?? true,
      sticky: defaultConfig.sticky ?? false,
      animate: defaultConfig.animations?.enabled ?? true,
      pagination: defaultConfig.pagination ?? true,
      theme: defaultConfig.theme || {
        theme: 'light',
        variant: 'default',
        colorScheme: 'default',
        borderRadius: 'md'
      },
      dialog: defaultConfig.dialog || undefined,
      loadingConfig: {
        variant: defaultConfig.loading?.variant || 'overlay',
        spinnerSize: defaultConfig.loading?.spinnerSize || 'md',
        text: defaultConfig.loading?.text || 'Đang tải...',
        spinnerType: defaultConfig.loading?.spinnerType || 'spinner',
        skeletonRows: defaultConfig.loading?.skeletonRows || 5,
        skeletonColumns: defaultConfig.loading?.skeletonColumns || 5,
      },
      persistSettings: defaultConfig.persistSettings ? { enabled: true } : {},
      filteringOptions: {
        advancedFiltering: defaultConfig.filterDefaults?.advancedFiltering,
        allowFilterPresets: defaultConfig.filterDefaults?.allowPresets,
        allowComplexFilters: defaultConfig.filterDefaults?.allowComplexFilters,
        persistFilters: defaultConfig.filterDefaults?.persistFilters,
      },
    };

    // Override with explicit props only (props take precedence over defaults)
    return {
      size: size !== undefined ? size : baseSettings.size,
      striped: striped !== undefined ? striped : baseSettings.striped,
      bordered: bordered !== undefined ? bordered : baseSettings.bordered,
      hover: hover !== undefined ? hover : baseSettings.hover,
      sticky: sticky !== undefined ? sticky : baseSettings.sticky,
      animate: animate !== undefined ? animate : baseSettings.animate,
      pagination: pagination !== undefined ? pagination : baseSettings.pagination,
      theme: theme || baseSettings.theme, // Use explicit theme prop or provider defaults
      dialog: dialog || baseSettings.dialog,
      loadingConfig: loadingConfig || baseSettings.loadingConfig,
      persistSettings: {
        persistKey: props.tableId || 'rpt-table',
        useUrlAsKey: true,
        ...(persistSettings || baseSettings.persistSettings),
      },
      filteringOptions: {
        advancedFiltering: filteringOptions.advancedFiltering !== undefined ?
          filteringOptions.advancedFiltering : baseSettings.filteringOptions.advancedFiltering,
        allowFilterPresets: filteringOptions.allowFilterPresets !== undefined ?
          filteringOptions.allowFilterPresets : baseSettings.filteringOptions.allowFilterPresets,
        allowComplexFilters: filteringOptions.allowComplexFilters !== undefined ?
          filteringOptions.allowComplexFilters : baseSettings.filteringOptions.allowComplexFilters,
        persistFilters: filteringOptions.persistFilters !== undefined ?
          filteringOptions.persistFilters : baseSettings.filteringOptions.persistFilters,
        persistKey: ''
      },
    };
  }, [
    size, defaultConfig.size,
    striped, defaultConfig.striped,
    bordered, defaultConfig.bordered,
    hover, defaultConfig.hover,
    sticky, defaultConfig.sticky,
    animate, defaultConfig.animations?.enabled,
    pagination, defaultConfig.pagination,
    theme, defaultConfig.theme, // Remove automatic theme detection dependencies
    dialog, defaultConfig.dialog,
    loadingConfig, defaultConfig.loading,
    persistSettings, defaultConfig.persistSettings,
    props.tableId, filteringOptions, defaultConfig.filterDefaults,
  ]);

  // Use table settings hook
  const { 
    settings: tableSettings, 
    updateSetting: updateTableSetting, 
    resetSettings: resetTableSettings,
    getThemeConfig,
    getCurrentStorageKey,
    saveSettingsWithIdentifier,
    isClient
  } = useSafeTableSettings({
    initialSettings: {
      size: mergedSettings.size,
      theme: mergedSettings.theme?.theme || 'light', // Use provider defaults
      variant: mergedSettings.theme?.variant || 'default',
      striped: mergedSettings.striped,
      hover: mergedSettings.hover,
      bordered: mergedSettings.bordered,
      sticky: mergedSettings.sticky,
      colorScheme: mergedSettings.theme?.colorScheme || 'default',
      borderRadius: mergedSettings.theme?.borderRadius || 'md'
    },
    // Use persistSettings options from props if provided
    tableId: persistSettings?.persistKey || props.tableId || 'rpt-table',
    useUrlAsKey: persistSettings?.useUrlAsKey,
    tableIdentifier: persistSettings?.tableIdentifier,
    persistKey: persistSettings?.persistKey,
    onChange: persistSettings?.onChange
  });
  
  // // CRITICAL FIX: Update the mergedSettings filteringOptions.persistKey after getCurrentStorageKey is available
  // useEffect(() => {
  //   if (getCurrentStorageKey && mergedSettings.filteringOptions.persistKey === '') {
  //     mergedSettings.filteringOptions.persistKey = getCurrentStorageKey();
  //   }
  // }, [getCurrentStorageKey, mergedSettings.filteringOptions]);

  // CRITICAL FIX: Use a stable persistent key without causing re-renders
  const stablePersistKey = useMemo(() => {
    return getCurrentStorageKey ? getCurrentStorageKey() : 'rpt-table-default';
  }, [getCurrentStorageKey]);

  // Use the table filter hook for advanced filtering
  const {
    filters: filterValues,
    filteredData,
    activeFilterCount,
    setFilter,
    removeFilter,
    clearFilters,
    resetFilters,
    hasActiveFilters,
    saveFilterPreset,
    loadFilterPreset,
    filterPresets
  } = useTableFilter({
    data,
    columns,
    filterConfigs: filters,
    serverSide: false,
    persist: filteringOptions.persistFilters,
    persistKey: filteringOptions.persistKey || stablePersistKey 
  });

  // CRITICAL FIX: Stabilize mergedSettings to prevent infinite loops
  const stableMergedSettings = useMemo(() => {
    const baseSettings = {
      size: defaultConfig.size || 'medium',
      striped: defaultConfig.striped ?? false,
      bordered: defaultConfig.bordered ?? false,
      hover: defaultConfig.hover ?? true,
      sticky: defaultConfig.sticky ?? false,
      animate: defaultConfig.animations?.enabled ?? true,
      pagination: defaultConfig.pagination ?? true,
      theme: defaultConfig.theme || {
        theme: 'light',
        variant: 'default',
        colorScheme: 'default',
        borderRadius: 'md'
      },
      dialog: defaultConfig.dialog || undefined,
      loadingConfig: {
        variant: defaultConfig.loading?.variant || 'overlay',
        spinnerSize: defaultConfig.loading?.spinnerSize || 'md',
        text: defaultConfig.loading?.text || 'Đang tải...',
        spinnerType: defaultConfig.loading?.spinnerType || 'spinner',
        skeletonRows: defaultConfig.loading?.skeletonRows || 5,
        skeletonColumns: defaultConfig.loading?.skeletonColumns || 5,
      },
      persistSettings: defaultConfig.persistSettings ? { enabled: true } : {},
      filteringOptions: {
        advancedFiltering: defaultConfig.filterDefaults?.advancedFiltering,
        allowFilterPresets: defaultConfig.filterDefaults?.allowPresets,
        allowComplexFilters: defaultConfig.filterDefaults?.allowComplexFilters,
        persistFilters: defaultConfig.filterDefaults?.persistFilters,
      },
    };

    return {
      size: size !== undefined ? size : baseSettings.size,
      striped: striped !== undefined ? striped : baseSettings.striped,
      bordered: bordered !== undefined ? bordered : baseSettings.bordered,
      hover: hover !== undefined ? hover : baseSettings.hover,
      sticky: sticky !== undefined ? sticky : baseSettings.sticky,
      animate: animate !== undefined ? animate : baseSettings.animate,
      pagination: pagination !== undefined ? pagination : baseSettings.pagination,
      theme: theme || baseSettings.theme,
      dialog: dialog || baseSettings.dialog,
      loadingConfig: loadingConfig || baseSettings.loadingConfig,
      persistSettings: {
        persistKey: props.tableId || 'rpt-table',
        useUrlAsKey: true,
        ...(persistSettings || baseSettings.persistSettings),
      },
      filteringOptions: {
        advancedFiltering: filteringOptions.advancedFiltering !== undefined ?
          filteringOptions.advancedFiltering : baseSettings.filteringOptions.advancedFiltering,
        allowFilterPresets: filteringOptions.allowFilterPresets !== undefined ?
          filteringOptions.allowFilterPresets : baseSettings.filteringOptions.allowFilterPresets,
        allowComplexFilters: filteringOptions.allowComplexFilters !== undefined ?
          filteringOptions.allowComplexFilters : baseSettings.filteringOptions.allowComplexFilters,
        persistFilters: filteringOptions.persistFilters !== undefined ?
          filteringOptions.persistFilters : baseSettings.filteringOptions.persistFilters,
        persistKey: stablePersistKey 
      },
    };
  }, [
    size, striped, bordered, hover, sticky, animate, pagination,
    defaultConfig.size, defaultConfig.striped, defaultConfig.bordered, defaultConfig.hover, 
    defaultConfig.sticky, defaultConfig.animations?.enabled, defaultConfig.pagination,
    props.tableId, stablePersistKey,
    filteringOptions.advancedFiltering, filteringOptions.allowFilterPresets,
    filteringOptions.allowComplexFilters, filteringOptions.persistFilters
  ]);

  const stableThemeConfig = useMemo(() => {
    if (tableSettings && isClient) {
      return {
        theme: tableSettings.theme || stableMergedSettings.theme?.theme || 'light',
        variant: tableSettings.variant || stableMergedSettings.theme?.variant || 'default',
        colorScheme: tableSettings.colorScheme || stableMergedSettings.theme?.colorScheme || 'default',
        borderRadius: tableSettings.borderRadius || stableMergedSettings.theme?.borderRadius || 'md'
      };
    }
    
    return {
      theme: stableMergedSettings.theme?.theme || 'light',
      variant: stableMergedSettings.theme?.variant || 'default', 
      colorScheme: stableMergedSettings.theme?.colorScheme || 'default',
      borderRadius: stableMergedSettings.theme?.borderRadius || 'md'
    };
  }, [
    tableSettings?.theme, tableSettings?.variant, tableSettings?.colorScheme, tableSettings?.borderRadius,
    stableMergedSettings.theme?.theme, stableMergedSettings.theme?.variant,
    stableMergedSettings.theme?.colorScheme, stableMergedSettings.theme?.borderRadius,
    isClient
  ]);

  const stableTableFeatures = useMemo(() => {
    return {
      striped: tableSettings?.striped ?? striped,
      bordered: tableSettings?.bordered ?? bordered,
      highlightOnHover: tableSettings?.hover ?? hover,
      stickyHeader: tableSettings?.sticky ?? sticky
    };
  }, [
    tableSettings?.striped, tableSettings?.bordered, 
    tableSettings?.hover, tableSettings?.sticky,
    striped, bordered, hover, sticky
  ]);

  const handleTableSettingsChange = useCallback((settings: TableSettings) => {
    console.log('Table settings changed:', settings);
    
    // Only update specific settings to avoid triggering unnecessary re-renders
    if (settings.size !== tableSettings?.size) updateTableSetting('size', settings.size);
    if (settings.theme !== tableSettings?.theme) updateTableSetting('theme', settings.theme);
    if (settings.variant !== tableSettings?.variant) updateTableSetting('variant', settings.variant);
    if (settings.colorScheme !== tableSettings?.colorScheme) updateTableSetting('colorScheme', settings.colorScheme);
    if (settings.borderRadius !== tableSettings?.borderRadius) updateTableSetting('borderRadius', settings.borderRadius);
    if (settings.striped !== tableSettings?.striped) updateTableSetting('striped', !!settings.striped);
    if (settings.bordered !== tableSettings?.bordered) updateTableSetting('bordered', !!settings.bordered);
    if (settings.hover !== tableSettings?.hover) updateTableSetting('hover', settings.hover !== false);
    if (settings.sticky !== tableSettings?.sticky) updateTableSetting('sticky', !!settings.sticky);
    
    persistSettings?.onChange?.(settings);
    
    eventHandlers?.onDataChange?.(data);
  }, [updateTableSetting, persistSettings, eventHandlers, data, tableSettings]);

  const stableAdvancedFiltering = useMemo(() => {
    if (!stableMergedSettings.filteringOptions.advancedFiltering) return undefined;
    
    return {
      enabled: stableMergedSettings.filteringOptions.advancedFiltering,
      allowPresets: stableMergedSettings.filteringOptions.allowFilterPresets,
      allowComplexFilters: stableMergedSettings.filteringOptions.allowComplexFilters,
      initialPresets: filterPresets.map(preset => ({
        ...preset,
        createdAt: typeof preset.createdAt === 'string' 
          ? new Date(preset.createdAt).getTime() 
          : preset.createdAt
      })),
      onPresetsChange: filteringOptions.onFilterPresetsChange,
      persistKey: stablePersistKey
    };
  }, [
    stableMergedSettings.filteringOptions.advancedFiltering,
    stableMergedSettings.filteringOptions.allowFilterPresets,
    stableMergedSettings.filteringOptions.allowComplexFilters,
    filterPresets.length, // Only depend on length to avoid reference changes
    filteringOptions.onFilterPresetsChange,
    stablePersistKey
  ]);

  const { 
    columnVisibility, 
    visibleColumns: hookVisibleColumns, 
    toggleColumnVisibility, 
    showAllColumns, 
    hideAllColumns, 
    resetColumnVisibility 
  } = useColumnVisibility({
    columns,
    persist: true,
    persistKey: 'rpt-columns',
    onVisibilityChange: (visibility) => {
      // Notify about column visibility changes
      eventHandlers?.onColumnVisibilityChange?.(
        Object.entries(visibility)
          .filter(([_, isVisible]) => isVisible)
          .map(([columnId]) => columnId)
      );
    }
  });

  // Access form handling context
  const formHandling = useFormHandling();
  
  // Dialog state using useTableDialog
  const {
    open: dialogOpen,
    dialogType,
    dialogData,
    dialogTitle,
    dialogDescription,
    loading: dialogLoading,
    error: dialogError,
    openCreateDialog,
    openEditDialog,
    openViewDialog,
    openDeleteDialog,
    submitDialog,
    closeDialog,
  } = useTableDialog<T>({
    onSubmit: async (data: Record<string, any>, type: DialogType | null): Promise<boolean> => {
      // Make sure type is not null before proceeding
      if (!type) return false;
      
      // Add explicit type assertion to ensure type is recognized as DialogType
      const dialogType = type as DialogType;
      
      // Special handling for delete operations
      if (dialogType === 'delete') {
        try {
          // Ensure we have an ID to delete with proper type checking
          const deleteId = data && typeof data === 'object' && 'id' in data ? data.id : undefined;
          
          if (deleteId === undefined || (typeof deleteId !== 'string' && typeof deleteId !== 'number')) {
            console.error('[DataTable] Cannot delete: Invalid ID found in data', data);
            return false;
          }
          
          // This ensures both API call and proper refresh
          const success = await builtInOnDelete(deleteId);
          
          // Call after submission handlers if needed
          if (builtInActions?.formHandling?.onAfterSubmit) {
            builtInActions.formHandling.onAfterSubmit(dialogType, data, success);
          }
          
          if (eventHandlers?.onAfterSubmit) {
            eventHandlers.onAfterSubmit(dialogType, data, success);
          }
          
          return success;
        } catch (error) {
          console.error('[DataTable] Error in delete operation:', error);
          return false;
        }
      }
      
      // Use form handling context to get validated data
      if (builtInActions?.formHandling?.autoHandleFormSubmission) {
        try {
          // Get validated data from form - explicitly handle the null case
          const validatedData = await formHandling.validateAndGetFormData(type);
          
          // If validation failed, don't proceed
          if (!validatedData.isValid || !validatedData.data) {
            console.error('Form validation failed for', type);
            
            // Get form errors to display
            const errors = formHandling.getFormErrors(type as DialogMode);
            
            // Handle invalid submission
            if (builtInActions.formHandling.onInvalidSubmit) {
              builtInActions.formHandling.onInvalidSubmit(type as DialogMode, errors);
            }
            
            // Also notify through eventHandlers if available
            if (eventHandlers?.onValidationError) {
              eventHandlers.onValidationError(type as DialogMode, errors);
            }
            
            return false;
          }
          
          // Create a deep copy of the validated data to prevent reference issues
          const safeData = JSON.parse(JSON.stringify(validatedData.data || {}));
          
          // For edit operations, ensure we preserve the ID from original data
          let processedData: Record<string, any> = safeData;
          if (type === 'edit' && data && typeof data === 'object' && data.id) {
            processedData = {
              id: data.id,
              ...safeData,
            };
          }
          
          // Allow pre-submission transformation via builtInActions
          if (builtInActions.formHandling.onBeforeSubmit) {
            const beforeResult = await builtInActions.formHandling.onBeforeSubmit(type as DialogMode, processedData);
            if (beforeResult === false) {
              return false; 
            } else if (beforeResult !== undefined && beforeResult !== null) {
              processedData = beforeResult;
            }
          }
          
          // Allow pre-submission transformation via eventHandlers
          if (eventHandlers?.onBeforeSubmit) {
            const beforeResult = await eventHandlers.onBeforeSubmit(type as DialogMode, processedData);
            if (beforeResult === false) {
              return false;
            } else if (beforeResult !== undefined && beforeResult !== null) {
              processedData = beforeResult; 
            }
          }
          
          // Process data specifically for valid submissions
          if (builtInActions.formHandling.onValidSubmit) {
            const processedResult = await builtInActions.formHandling.onValidSubmit(type as DialogMode, processedData);
            if (processedResult !== undefined && processedResult !== null) {
              processedData = processedResult;
            }
          }
          
          // Final safety check before submission
          if (!processedData) {
            console.error('Processed data is null or undefined');
            return false;
          }
          
          // Call appropriate handler based on type
          let success = false;
          switch (type) {
            case 'create':
              success = eventHandlers?.onCreate ? await eventHandlers.onCreate(processedData) : true;
              break;
            case 'edit':
              const recordId = 'id' in processedData ? processedData.id : undefined;
              success = eventHandlers?.onUpdate ? await eventHandlers.onUpdate(recordId, processedData) : true;
              break;
            case 'delete':
              const deleteId = data && typeof data === 'object' && 'id' in data ? data.id : undefined;
              success = eventHandlers?.onDelete ? await eventHandlers.onDelete(deleteId) : true;
              break;
            default:
              success = true;
          }
          
          // Fire after submission handlers
          if (builtInActions.formHandling.onAfterSubmit) {
            builtInActions.formHandling.onAfterSubmit(type as DialogMode, processedData, success);
          }
          
          if (eventHandlers?.onAfterSubmit) {
            eventHandlers.onAfterSubmit(type as DialogMode, processedData, success);
          }
          
          return success;
        } catch (error) {
          console.error('Error in form submission:', error);
          
          // Try to transform error into form errors if possible
          if (error && typeof error === 'object') {
            try {
              // Safe typecasting with proper type checking
              const errorObj: Record<string, any> = {};
              
              if ('errors' in error) {
                const errorsData = (error as { errors: unknown }).errors;
                
                if (errorsData && typeof errorsData === 'object') {
                  // Convert errors to Record<string, any>
                  Object.entries(errorsData as object).forEach(([key, value]) => {
                    errorObj[key] = value;
                  });

                  formHandling.setFormErrors(errorObj, type as DialogMode);

                  if (builtInActions.formHandling.onInvalidSubmit) {
                    builtInActions.formHandling.onInvalidSubmit(type as DialogMode, errorObj);
                  }
                }
              } else if (error instanceof Error) {
                // Handle standard Error objects
                errorObj.root = error.message;
                formHandling.setFormErrors(errorObj, type as DialogMode);
              }
            } catch (conversionError) {
              console.error('Error converting API errors to form errors:', conversionError);
              // Set a generic error message if conversion fails
              formHandling.setFormErrors({ root: 'Form submission failed' }, type as DialogMode);
            }
          }
          
          return false;
        }
      } else {
        try {
          let success: boolean;
          
          switch (type) {
            case 'create':
              success = eventHandlers?.onCreate ? await eventHandlers.onCreate(data) : true;
              break;
            case 'edit':
              // For edit operations, ensure we always have the ID with type safety
              const editId = data && typeof data === 'object' && 'id' in data ? data.id : undefined;
              success = eventHandlers?.onUpdate ? await eventHandlers.onUpdate(editId, data) : true;
              break;
            case 'delete':
              // Type-safe access to ID for delete
              const deleteId = data && typeof data === 'object' && 'id' in data ? data.id : undefined;
              success = eventHandlers?.onDelete ? await eventHandlers.onDelete(deleteId) : true;
              break;
            default:
              success = true;
          }
          
          return success;
        } catch (error) {
          console.error('Error in form submission:', error);
          return false;
        }
      }
    }
  });

  // Animation preference
  const animation = useAnimationPreference({
    enabled: animate
  });
  
  // Determine search configuration
  const isSearchEnabled = globalSearch?.enabled === true || typeof globalSearch === 'object';
  const searchConfig = typeof globalSearch === 'object' ? globalSearch : {} as GlobalSearchConfig;
  
  // Apply global search and other logic to internalData instead of data
  const processedData = useMemo(() => {
    let result = hasActiveFilters ? filteredData : [...internalData];
    
    // Apply global search if enabled and has value
    if (isSearchEnabled && searchValue) {
      const searchFields = searchConfig.fields || 
        columns
          .filter(col => col.enableFiltering !== false)
          .map(col => col.accessorKey as string);
      
      result = result.filter(record => {
        return searchFields.some(field => {
          const value = record[field];
          if (value == null) return false;
          return String(value).toLowerCase().includes(searchValue.toLowerCase());
        });
      });
    }
    
    // Apply sorting
    if (sortingState.length > 0) {
      result = [...result].sort((a, b) => {
        for (const sort of sortingState) {
          const { field, direction } = sort;
          const column = columns.find(col => 
            col.accessorKey === field || col.id === field
          );
          
          // Default sort behavior since we don't have custom sorter in the interface
          const aValue = a[field];
          const bValue = b[field];
          
          if (aValue === bValue) continue;
          
          const compareResult = aValue > bValue ? 1 : -1;
          return direction === 'asc' ? compareResult : -compareResult;
        }
        return 0;
      });
    }
    
    return result;
  }, [internalData, filteredData, hasActiveFilters, sortingState, searchValue, isSearchEnabled, columns, searchConfig]);
  
  // Determine pagination configuration
  const isPaginationEnabled = pagination !== false;
  const paginationConfig = typeof pagination === 'object' ? pagination : {} as PaginationConfig;

  // Export functionality
  const { 
    exportData, 
    availableFormats,
    exportSelected,
    exportCurrentView
  } = useTableExport({
    data,
    columns,
    filteredData: processedData,
    filename: typeof exportConfig === 'object' ? exportConfig.filename : 'table-export',
    title: title,
    exportConfig
  });
  
  // Selection configuration
  const selectionConfig = selection || {} as SelectionConfig;
  const isSelectionEnabled = selection?.enabled === true || typeof selection === 'object';
  const selectionType = selectionConfig.type || 'checkbox';
  const rowKey = selectionConfig.rowKey || 'id';
  
  // Row key extractor function
  const getRowKey = (record: T, index: number): string | number => {
    if (typeof rowKey === 'function') {
      return rowKey(record as any, index);
    }
    return record[rowKey] !== undefined ? record[rowKey] : index;
  };
  
  // Apply pagination
  const paginatedData = useMemo(() => {
    if (!isPaginationEnabled) return processedData;
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return processedData.slice(startIndex, endIndex);
  }, [processedData, currentPage, pageSize, isPaginationEnabled]);
  
  // Total number of items
  const totalItems = useMemo(() => {
    return total !== undefined ? total : processedData.length;
  }, [total, processedData]);
  
  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / pageSize));
  }, [totalItems, pageSize]);
  
  // Check if all rows are selected
  const isAllSelected = useMemo(() => {
    return (
      paginatedData.length > 0 && 
      paginatedData.every(row => selectedRowKeys.includes(getRowKey(row, 0)))
    );
  }, [paginatedData, selectedRowKeys]);
  
  // Check if some rows are selected
  const isSomeSelected = useMemo(() => {
    return (
      !isAllSelected && 
      paginatedData.some(row => selectedRowKeys.includes(getRowKey(row, 0)))
    );
  }, [paginatedData, selectedRowKeys, isAllSelected]);
  
  // Handle row selection
  const handleToggleSelection = (rowKey: string | number) => {
    setSelectedRowKeys(prev => {
      const isSelected = prev.includes(rowKey);
      const newKeys = isSelected
        ? prev.filter(key => key !== rowKey)
        : [...prev, rowKey];
      
      return newKeys;
    });
    
    if (eventHandlers?.onSelectionChange) {
      const newKeys = selectedRowKeys.includes(rowKey)
        ? selectedRowKeys.filter(key => key !== rowKey)
        : [...selectedRowKeys, rowKey];
      
      // Find the selected rows
      const selectedRows = data.filter(row => {
        const id = getRowKey(row, 0);
        return newKeys.includes(id);
      });
      
      eventHandlers.onSelectionChange(newKeys, selectedRows);
    }
  };
  
  // Handle select all rows
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedRowKeys(prev => 
        prev.filter(key => !paginatedData.some(row => getRowKey(row, 0) === key))
      );
    } else {
      setSelectedRowKeys(prev => {
        const currentPageKeys = paginatedData.map((row, index) => getRowKey(row, index));
        const uniqueKeys = new Set([...prev, ...currentPageKeys]);
        return Array.from(uniqueKeys);
      });
    }
    
    if (eventHandlers?.onSelectionChange) {
      const newKeys = isAllSelected
        ? selectedRowKeys.filter(key => !paginatedData.some(row => getRowKey(row, 0) === key))
        : [...new Set([...selectedRowKeys, ...paginatedData.map((row, index) => getRowKey(row, index))])];
      
      // Find the selected rows
      const selectedRows = data.filter(row => {
        const id = getRowKey(row, 0);
        return newKeys.includes(id);
      });
      
      eventHandlers.onSelectionChange(newKeys, selectedRows);
    }
  };
  
  // Handle row click
  const handleRowClick = (row: T, index: number, event: React.MouseEvent<HTMLTableRowElement>) => {
    if (eventHandlers?.onRowClick) {
      eventHandlers.onRowClick(row, index, event);
    }
  };
  
  // Handle sort change
  const handleSortChange = (field: string) => {
    const newSorting = [...sortingState];
    const currentIndex = newSorting.findIndex(s => s.field === field);
    
    if (currentIndex >= 0) {
      const currentSort = newSorting[currentIndex];
      if (currentSort.direction === 'asc') {
        newSorting[currentIndex] = { field, direction: 'desc' };
      } else {
        newSorting.splice(currentIndex, 1);
      }
    } else {
      newSorting.push({ field, direction: 'asc' });
    }
    
    setSortingState(newSorting);
    
    if (eventHandlers?.onSortChange) {
      eventHandlers.onSortChange(newSorting);
    }
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    
    if (eventHandlers?.onPageChange) {
      eventHandlers.onPageChange(page, pageSize);
    }
  };
  
  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page
    
    if (eventHandlers?.onPageSizeChange) {
      eventHandlers.onPageSizeChange(size);
    }
  };
  
  // Handle search
  const handleSearch = (value: string) => {
    setSearchValue(value);
    setCurrentPage(1); // Reset to first page
    
    if (eventHandlers?.onGlobalSearchChange) {
      eventHandlers.onGlobalSearchChange(value);
    }
  };
  
  // Handle filter change
  const handleFilterChange = (field: string, value: any) => {
    setFilter(field, { value });
    setCurrentPage(1); // Reset to first page when filter changes
    
    if (eventHandlers?.onFilterChange) {
      const updatedFilters = { ...filterValues, [field]: value };
      if (value === undefined || value === null || value === '') {
        delete updatedFilters[field];
      }
      eventHandlers.onFilterChange(updatedFilters);
    }
  };
  
  // Handle clearing filters
  const handleClearFilters = () => {
    clearFilters();
    
    if (eventHandlers?.onFilterChange) {
      eventHandlers.onFilterChange({});
    }
  };
  
  // Handle filter preset save
  const handleSaveFilterPreset = (name: string, filters: Record<string, any>) => {
    const preset = saveFilterPreset(name, filters);
    
    if (eventHandlers?.onFilterPresetSave) {
      eventHandlers.onFilterPresetSave(preset);
    }
    
    return preset;
  };
  
  // Handle filter preset load
  const handleLoadFilterPreset = (presetId: string) => {
    const filters = loadFilterPreset(presetId);
    
    if (filters && eventHandlers?.onFilterChange) {
      eventHandlers.onFilterChange(filters);
    }
    
    return filters;
  };
  
  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await triggerRefresh('manual refresh');
  }, [triggerRefresh]);

  // Handle create action - sửa cách khởi tạo initialData
  const handleCreateAction = () => {
    try {
      // Khởi tạo đúng cách để tránh lỗi type
      const initialData = {} as Partial<T>;
      
      // Gọi openCreateDialog với explicit typing
      openCreateDialog(initialData as T, 'Thêm mới');
    } catch (err) {
      console.error("Error in handleCreateAction:", err);
    }
  };
  
  // CRITICAL FIX: Add back handleSaveTableIdentifier function
  const handleSaveTableIdentifier = useCallback((identifier: string) => {
    if (!identifier.trim()) return;
    
    try {
      console.log(`[DataTable] Saving table identifier: ${identifier}`);
      const success = saveSettingsWithIdentifier(identifier);

      if (success) {
        console.log(`Table settings saved with identifier: ${identifier}`);
        
        if (persistSettings?.onChange) {
          persistSettings.onChange(tableSettings);
        }
      } else {
        console.error('Failed to save table settings with identifier:', identifier);
      }
    } catch (error) {
      console.error('Error while saving table identifier:', error);
    }
  }, [saveSettingsWithIdentifier, persistSettings, tableSettings]);

  // Check for empty state
  const isEmptyState = !loading && data.length === 0;
  
  // Map from TableSettings size to standardized TableSize
  const normalizeTableSize = (sizeValue: string | TableSize | undefined): TableSize => {
    if (!sizeValue) return 'medium';
    
    // Handle shorthand and full versions
    switch(sizeValue) {
      case 'sm':
      case 'small':
        return 'small';
      case 'lg':
      case 'large':
        return 'large';
      case 'md':
      case 'medium':
      default:
        return 'medium';
    }
  };

  const effectiveTableSize = useMemo(() => {
    // Get size from settings first, then fallback to props
    const settingsSize = tableSettings?.size;
    const propsSize = size;
    
    return settingsSize || propsSize || 'medium';
  }, [tableSettings?.size, size, isClient, tableSettings]);

  // CRITICAL FIX: Normalize the effective size for Table component
  const normalizedTableSize = useMemo(() => {
    const targetSize = effectiveTableSize;
    
    // Handle different size formats and ensure it's a valid TableSize
    switch (targetSize) {
      case 'small':
        return 'small';
      case 'large':
        return 'large';
      default:
        return 'medium';
    }
  }, [effectiveTableSize]);

  // Get sort direction for a column
  const getSortDirection = (accessor?: string): SortDirection | undefined => {
    if (!accessor) return undefined;
    const sort = sortingState.find(s => s.field === accessor);
    return sort?.direction;
  };
  
  // Create row actions from built-in actions and custom actions - thêm debug và sửa cách gọi dialog
  const rowActions: ActionConfig<T>[] = useMemo(() => {
    const allActions: ActionConfig<T>[] = [];
    
    // Add built-in actions if configured
    if (builtInActions) {
      // Add view action
      if (builtInActions.view !== false) {
        const viewAction: ActionConfig<T> = {
          key: 'view',
          label: 'Xem chi tiết',
          type: 'view',
          tooltip: 'Xem chi tiết',
          onClick: (record) => {
            try {
              openViewDialog(record, 'Xem chi tiết');
              
            } catch (err) {
              console.error("Error opening view dialog:", err);
            }
          },
          ...(typeof builtInActions.view === 'object' ? builtInActions.view : {})
        };
        allActions.push(viewAction);
      }
      
      // Add edit action
      if (builtInActions.edit !== false) {
        const editAction: ActionConfig<T> = {
          key: 'edit',
          label: 'Chỉnh sửa',
          type: 'edit',
          tooltip: 'Chỉnh sửa',
          onClick: (record) => {
            try {
              if (!record) {
                console.error("Cannot edit null/undefined record");
                return;
              }
              
              // Clone record để tránh mutation
              const recordCopy = { ...record };
              openEditDialog(recordCopy, 'Chỉnh sửa');
              
            } catch (err) {
              console.error("Error opening edit dialog:", err);
            }
          },
          ...(typeof builtInActions.edit === 'object' ? builtInActions.edit : {})
        };
        allActions.push(editAction);
      }
      
      // Add delete action - always available với built-in functionality
      if (builtInActions?.delete !== false) {
        const deleteAction: ActionConfig<T> = {
          key: 'delete',
          label: 'Xóa',
          type: 'delete',
          tooltip: 'Xóa mục này',
          variant: 'destructive',
          onClick: (record) => {
            try {
              // Đảm bảo record không null/undefined
              if (!record) {
                console.error("[DataTable] Cannot delete null/undefined record");
                return;
              }
              
              // Đảm bảo record có ID
              if (record.id === undefined) {
                console.error("[DataTable] Cannot delete record without ID", record);
                return;
              }
              
              // Clone record để tránh mutation
              const recordCopy = { ...record };
              
              // Open delete dialog with confirmation
              openDeleteDialog(
                recordCopy, 
                'Xác nhận xóa', 
                'Bạn có chắc chắn muốn xóa mục này không? Hành động này không thể hoàn tác.'
              );
            } catch (err) {
              console.error("[DataTable] Error opening delete dialog:", err);
            }
          },
          ...(typeof builtInActions.delete === 'object' ? builtInActions.delete : {})
        };
        allActions.push(deleteAction);
      }
    }
    
    // Add custom actions
    if (Array.isArray(actions)) {
      allActions.push(...actions);
    }
    
    return allActions;
  }, [builtInActions, actions, openViewDialog, openEditDialog, openDeleteDialog]);
  // Extract form components from builtInActions with automatic wrapping
  const formComponents = useMemo(() => {
    if (!builtInActions) return {} as Record<DialogType, React.ComponentType<any> | undefined>;
    
    const autoHandleSubmission = builtInActions.formHandling?.autoHandleFormSubmission;
    const skipInitialValidation = builtInActions.formHandling?.skipInitialValidation;
    
    // Create wrapped components with proper typing
    const wrapComponent = <P extends DataTableFormProps>(
      Component: React.ComponentType<P> | undefined,
      type: DialogMode
    ) => {
      if (!Component) return Component;
      
      // For components that don't need form handling, return as is
      if (!autoHandleSubmission) return Component;
      
      // Use withFormHandling HOC
      return withFormHandling(Component, type);
    };
    
    return {
      create: wrapComponent(builtInActions.createFormComponent, 'create'),
      edit: wrapComponent(builtInActions.editFormComponent, 'edit'),
      view: wrapComponent(builtInActions.viewFormComponent, 'view'),
      delete: wrapComponent(builtInActions.deleteFormComponent, 'delete'),
      // Kiểm tra tồn tại của customFormComponent trước khi sử dụng
      ...(builtInActions.customFormComponent ? { custom: wrapComponent(builtInActions.customFormComponent, 'custom') } : {})
    } as Record<DialogType, React.ComponentType<any> | undefined>;
  }, [builtInActions]);

  // Extract row actions if available through builtInActions
  const hasRowActions = rowActions.length > 0;

  // Transform TableColumn to format expected by components
  const transformColumn = (column: TableColumn<T>) => {
    return {
      id: column.id || column.accessorKey as string,
      key: column.id || column.accessorKey as string,
      dataIndex: column.accessorKey as string,
      title: column.header,
      width: column.width,
      align: column.align,
      sortable: column.sortable || column.enableSorting,
      meta: column.meta || {},
      render: column.cell ? 
        (value: any, record: T, index: number) => 
          column.cell?.({ row: record, value, index, column }) : 
        undefined
    };
  };

  const skipInitialValidation = builtInActions?.formHandling?.skipInitialValidation;
  
  // Detect when data changes to mark updated rows
  useEffect(() => {
    // Mark all rows as updated initially
    if (data.length > 0 && updatedRowKeys.size === 0) {
      const newKeys = new Set(data.map((row, index) => getRowKey(row, index)));
      setUpdatedRowKeys(newKeys);
      
      // Clear the updated status after animation completes
      const timeoutId = setTimeout(() => {
        setUpdatedRowKeys(new Set());
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [data]);

  // Auto-detect status columns for better display
  const isStatusColumn = (column: TableColumn<T>): boolean => {
    const key = column.accessorKey as string;
    const id = column.id as string;
    return key === 'status' || id === 'status' || key?.includes('status') ||
           column.meta?.isStatus === true;
  };

  // Create button for add new record - sử đã đúng handleCreateAction
  const addButton = builtInActions?.create !== false && (
    <button
      key="add-button"
      className="rpt-add-button"
      onClick={(e) => {
        e.preventDefault();
        handleCreateAction();
      }}
      aria-label="Add new record"
    >
      <span className="rpt-add-button-icon">+</span>
      <span className="rpt-add-button-text">Tạo mới</span>
    </button>
  );

  // Preserve original column order and show them in correct order
  const visibleColumns = useMemo(() => {
    // When on the client-side, use columnVisibility to filter columns
    if (isClient) {
      return columns.filter(column => {
        const columnId = column.id || column.accessorKey as string;
        return columnVisibility[columnId] !== false;
      });
    }
    
    // During SSR, just use columns with defaultVisible !== false
    return columns.filter(column => column.defaultVisible !== false);
  }, [columns, columnVisibility, isClient]);

  // Table content to render within ThemeProvider
  const tableContent = (
    <div className={cn('rpt-container', className)}>
      {/* Toolbar - FIXED: Never disable actions */}
      {(title || description || isSearchEnabled || actions || columns.length > 0) && (
        <TableToolbar
          title={title}
          description={description}
          searchValue={searchValue}
          onSearch={isSearchEnabled ? handleSearch : undefined}
          searchPlaceholder={searchConfig.placeholder}
          selectedCount={selectedRowKeys.length}
          onClearSearch={() => setSearchValue('')}
          onSelectNone={() => setSelectedRowKeys([])}
          filters={filters}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
          advancedFiltering={stableAdvancedFiltering}
          onRefresh={handleRefresh}
          columns={columns}
          visibleColumns={visibleColumns}
          onToggleColumn={toggleColumnVisibility}
          onHideAllColumns={hideAllColumns}
          onShowAllColumns={showAllColumns}
          onResetColumns={resetColumnVisibility}
          columnVisibility={columnVisibility}
          createButton={builtInActions?.create !== false ? addButton : null}
          exportFormats={availableFormats}
          onExport={exportData}
          onExportCurrentView={() => exportCurrentView('excel')}
          onExportSelected={selectedRowKeys.length > 0 ? 
            () => {
              const selectedRows = data.filter(row => {
                const id = getRowKey(row, 0);
                return selectedRowKeys.includes(id);
              });
              exportSelected('excel', selectedRows);
            } : undefined}
          onUpdateTableSettings={updateTableSetting}
          onTableSettingsChange={handleTableSettingsChange}
          tableTheme={stableThemeConfig}
          tableSize={tableSettings?.size}
          tableStriped={tableSettings?.striped}
          tableHover={tableSettings?.hover}
          tableBordered={tableSettings?.bordered}
          tableStickyHeader={tableSettings?.sticky}
          currentTableIdentifier={persistSettings?.tableIdentifier || ''}
          onSaveTableIdentifier={handleSaveTableIdentifier}
          disabled={false}
        />
      )}
      
      {/* Table with optimized loading states */}
      <TableContainer
        className={cn(
          stableTableFeatures.stickyHeader && 'rpt-fixed-header',
          stableTableFeatures.striped && 'rpt-zebra-striping',
          stableTableFeatures.highlightOnHover && 'rpt-table-hover',
          stableTableFeatures.bordered && 'rpt-table-bordered'
        )}
      >
        {/* CRITICAL FIX: Never show overlay */}
        
        {error && (
          errorStateRenderer ? 
            errorStateRenderer(error) : 
            <ErrorState />
        )}
        
        {!error && (
          <>
            <div className={cn(
              "rpt-table-wrapper", 
              stableTableFeatures.stickyHeader && 'rpt-fixed-header',
              shouldShowLoading && 'rpt-table-wrapper-loading'
            )}>
              <Table
                data={data}
                columns={columns}
                size={normalizedTableSize} // CRITICAL FIX: Use normalizedTableSize
                striped={stableTableFeatures.striped}
                bordered={stableTableFeatures.bordered}
                highlightOnHover={stableTableFeatures.highlightOnHover}
                className={tableClassName}
                stickyHeader={stableTableFeatures.stickyHeader}
              >

                <TableHead>
                  <TableHeadRow>
                    {/* Selection column if enabled */}
                    {isSelectionEnabled && (
                      <TableHeadCell key="selection-header" className="rpt-select-cell">
                        <Checkbox
                          checked={isAllSelected}
                          indeterminate={!isAllSelected && isSomeSelected}
                          onChange={handleSelectAll}
                          aria-label="Select all rows"
                        />
                      </TableHeadCell>
                    )}
                    
                    {/* Header cells */}
                    {visibleColumns.map(column => {
                      const { id, key, dataIndex, title, width, align, sortable } = transformColumn(column);
                      const columnId = column.id || column.accessorKey as string || `column-${id}`;
                      
                      return (
                        <TableHeadCell 
                          key={`header-${columnId}`}
                          width={width}
                          align={align}
                          sortable={sortable}
                          sortDirection={getSortDirection(dataIndex)}
                          onClick={sortable ? () => handleSortChange(dataIndex) : undefined}
                        >
                          {title}
                        </TableHeadCell>
                      );
                    })}
                    
                    {/* Actions column if needed */}
                    {hasRowActions && (
                      <TableHeadCell key="actions-header" isAction={true} className="rpt-action-header-cell">
                        Thao tác
                      </TableHeadCell>
                    )}
                  </TableHeadRow>
                </TableHead>
                
                <TableBody>
                  {/* CRITICAL FIX: Better loading state handling */}
                  {shouldShowLoading && (mergedSettings.loadingConfig.variant === 'skeleton' || !mergedSettings.loadingConfig.variant) ? (
                    // Show loading skeleton rows - only when skeleton variant is used AND actually loading
                    Array.from({ length: mergedSettings.loadingConfig.skeletonRows || 5 }).map((_, index) => (
                      <tr key={`skeleton-${index}`} className="rpt-skeleton-row">
                        {/* Selection column skeleton */}
                        {isSelectionEnabled && (
                          <td key={`skeleton-selection-${index}`} className="rpt-select-cell">
                            <div className="rpt-skeleton rpt-skeleton-checkbox"></div>
                          </td>
                        )}
                        
                        {/* Data column skeletons */}
                        {visibleColumns.map((column, colIndex) => {
                          const columnId = column.id || column.accessorKey as string || `column-${colIndex}`;
                          return (
                            <td key={`skeleton-cell-${index}-${columnId}`} className="rpt-cell">
                              <div className="rpt-skeleton rpt-skeleton-text"></div>
                            </td>
                          );
                        })}
                        
                        {/* Action column skeleton - don't show action buttons when loading */}
                        {hasRowActions && (
                          <td key={`skeleton-actions-${index}`} className="rpt-action-cell">
                            <div className="rpt-skeleton rpt-skeleton-actions"></div>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : isEmptyState ? (
                    <tr key="empty-state">
                      <td 
                        key="empty-cell"
                        colSpan={visibleColumns.length + (isSelectionEnabled ? 1 : 0) + (hasRowActions ? 1 : 0)}
                      >
                        {emptyStateRenderer ? 
                          emptyStateRenderer() : 
                          <EmptyState 
                            title="Không có dữ liệu"
                            message="Không tìm thấy kết quả nào phù hợp với tiêu chí tìm kiếm."
                            animationStyle={animate ? "fade-in" : "none"}
                            animate={animate}
                          />
                        }
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence mode="wait" key={`table-data-${data.length}`}>
                      {paginatedData.map((row, rowIndex) => {
                        const rowId = getRowKey(row, rowIndex);
                        const isSelected = isSelectionEnabled && selectedRowKeys.includes(rowId);
                        const isUpdated = updatedRowKeys.has(rowId);
                        
                        return (
                          <TableRow
                            key={`row-${rowId}`}
                            rowData={row}
                            rowIndex={rowIndex}
                            onClick={(rowData, index, e) => handleRowClick(rowData as T, index, e)}
                            isSelected={isSelected}
                            clickable={!!eventHandlers?.onRowClick}
                            animate={animate}
                            animationDelay={rowIndex}
                            isUpdated={isUpdated}
                            className=""
                          >
                            {/* Selection cell if enabled */}
                            {isSelectionEnabled && (
                              <TableCell key={`selection-${rowId}`} className="rpt-select-cell">
                                <Checkbox
                                  checked={isSelected}
                                  onChange={() => handleToggleSelection(rowId)}
                                  aria-label={`Select row ${rowIndex + 1}`}
                                />
                              </TableCell>
                            )}
                            
                            {/* Data cells */}
                            {visibleColumns.map((column, columnIndex) => {
                              const { key, id, dataIndex, render, meta } = transformColumn(column);
                              const columnId = column.id || column.accessorKey as string || `column-${columnIndex}`;
                              const cellId = `${rowId}-${columnId}`;
                              const value = row[dataIndex];
                              const isStatusCell = isStatusColumn(column);
                              
                              return (
                                <TableCell
                                  key={cellId}
                                  value={value}
                                  column={column}
                                  rowData={row}
                                  rowIndex={rowIndex}
                                  align={column.align}
                                >
                                  {render ?
                                    render(value, row, rowIndex) : 
                                    value
                                  }
                                </TableCell>
                              );
                            })}
                            
                            {/* Row actions - ONLY show when not loading and has data */}
                            {hasRowActions && !loading && !isLoading && (
                              <TableCell key={`actions-${rowId}`} isAction={true} className="rpt-action-cell">
                                <TableRowActions 
                                  rowData={row}
                                  rowIndex={rowIndex}
                                  actions={rowActions}
                                  maxInlineActions={3}
                                  position={builtInActions?.position || 'inline'}
                                  buttonVariant={builtInActions?.actionButtonVariant || 'outline'}
                                  showTooltips={builtInActions?.tooltips !== false}
                                  align="left"
                                />
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            {isPaginationEnabled && totalItems > 0 && (
              <TablePagination 
                currentPage={currentPage}
                pageSize={pageSize}
                totalRecords={totalItems}
                pageSizeOptions={paginationConfig.pageSizeOptions || [10, 20, 50, 100]}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                showPageSizeOptions={paginationConfig.showSizeChanger !== false}
                showJumpToPage={paginationConfig.showQuickJumper}
                showTotalRecords={typeof paginationConfig.showTotal === 'boolean' ? paginationConfig.showTotal : true}
              />
            )}
          </>
        )}
      </TableContainer>

      {/* Dialog for CRUD operations */}
      <OptimizedDialog
        open={dialogOpen}
        dialogType={dialogType}
        dialogTitle={dialogTitle}
        dialogDescription={dialogDescription}
        data={dialogData}
        formComponent={dialogType ? formComponents[dialogType] : undefined}
        onClose={closeDialog}
        onSubmit={submitDialog}
        loading={dialogLoading}
        error={dialogError}
        width={dialog?.width || '500px'}
        closeOnClickOutside={dialog?.closeOnClickOutside}
        closeOnEsc={dialog?.closeOnEsc}
        actionsPosition={'right'}
        buttonSize={'md'}
        elevatedButtons={true}
        reducedMotion={!animate}
        validateOnMount={dialog?.validateOnMount || false}
        skipInitialValidation={skipInitialValidation || false}
      />
      
      {/* Batch Actions Bar - FIXED: Never disable */}
      <BatchActionsBar
        selectedCount={selectedRowKeys.length}
        selectedRows={data.filter(row => {
          const id = getRowKey(row, 0);
          return selectedRowKeys.includes(id);
        })}
        onDelete={builtInBatchDelete}
        onClearSelection={() => setSelectedRowKeys([])}
        animate={animate}
        isLoading={loadingManager.isOperationRunning('batch-delete')}
        disabled={false} // CRITICAL FIX: Never disable
        loadingText="Đang xử lý..."
      />
    </div>
  );

  // Wrap with ThemeProvider using stable theme settings
  return (
    <ThemeProvider themeConfig={stableThemeConfig}>
      {tableContent}
    </ThemeProvider>
  );
}

export const DataTable = React.memo(DataTableWithFormHandling) as <T extends BaseTableData = BaseTableData>(
  props: DataTableProps<T> & { ref?: React.Ref<any> }
) => React.ReactElement;

export default DataTable;
