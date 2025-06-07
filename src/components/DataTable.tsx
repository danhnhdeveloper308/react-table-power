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
import TableEmpty from './table/TableEmpty';
import TableRowActions from './table/TableRowActions';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';
import TableLoading from './TableLoading';
import DialogLoadingState from './DialogLoadingState';
import Checkbox from './form/Checkbox';
import ThemeProvider from './ThemeProvider';
import BatchActionsBar from './BatchActionsBar'; // Import the new component

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
import { TableSettings } from '../hooks';
import AppendableDialog from './AppendableDialog';

// Add this type declaration at the top of the file
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
  // Get global default configs
  const defaultConfig = useDataTableConfig();

  // Flag to ensure we only render fully on the client side
  const [clientSideRendered, setClientSideRendered] = useState(false);

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

  // Thêm state nội bộ cho dữ liệu bên trong DataTable
  const [internalData, setInternalData] = useState<T[]>(data);
  
  // Theo dõi thay đổi của dữ liệu đầu vào từ props
  useEffect(() => {
    setInternalData(data);
  }, [data]);
  
  // Dữ liệu thực tế sử dụng trong component (dùng internalData thay vì data)
  const actualData = useMemo(() => internalData, [internalData]);
  
  // Built-in delete function - xử lý xóa record nội bộ và không phụ thuộc onDataChange
  const builtInOnDelete = useCallback(async (recordId: string | number): Promise<boolean> => {
    console.log('Built-in delete operation for record ID:', recordId);
    
    try {
      // Xóa record khỏi dữ liệu nội bộ
      const updatedData = internalData.filter(item => {
        const itemId = item.id;
        return itemId !== recordId;
      });
      
      // Cập nhật state nội bộ
      setInternalData(updatedData);
      
      // Nếu có onDataChange, gọi để thông báo cho parent component
      if (eventHandlers?.onDataChange) {
        eventHandlers.onDataChange(updatedData);
      }
      
      return true;
    } catch (error) {
      console.error('Error in built-in delete operation:', error);
      return false;
    }
  }, [internalData, eventHandlers?.onDataChange]);

  // Built-in batch delete function - xử lý xóa nhiều records nội bộ
  const builtInBatchDelete = useCallback(async (selectedRows: T[]): Promise<boolean> => {
    if (selectedRows.length === 0) return false;
    
    console.log('Built-in batch delete operation for', selectedRows.length, 'records');
    
    try {
      setIsLoading(true);
      
      const selectedIds = selectedRows
        .map(row => row.id)
        .filter((id): id is string | number => id !== undefined);
      
      // Xóa records khỏi dữ liệu nội bộ
      const updatedData = internalData.filter(item => {
        const itemId = item.id;
        return itemId === undefined || !selectedIds.includes(itemId);
      });
      
      // Cập nhật state nội bộ
      setInternalData(updatedData);
      
      // Xóa selection sau khi xóa thành công
      setSelectedRowKeys([]);
        
      // Nếu có onDataChange, gọi để thông báo cho parent component
      if (eventHandlers?.onDataChange) {
        eventHandlers.onDataChange(updatedData);
      }
      
      return true;
    } catch (error) {
      console.error('Error in built-in batch delete operation:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [internalData, eventHandlers?.onDataChange]);
  
  // Cải thiện batch delete handler với logic đúng
  const handleBatchDelete = useCallback(async (selectedRows: T[]): Promise<boolean> => {
    if (selectedRows.length === 0) return false;

    // Nếu có handler tùy chỉnh, dùng nó trước
    if (eventHandlers?.onDelete) {
      try {
        setIsLoading(true);
        
        const results: Array<{id: string | number; success: boolean; error?: any}> = [];
        
        for (const row of selectedRows) {
          const rowId = row.id;
          if (rowId !== undefined) {
            try {
              const success = await eventHandlers.onDelete(rowId);
              results.push({ id: rowId, success });
            } catch (error) {
              console.error(`Error deleting row with ID ${rowId}:`, error);
              results.push({ id: rowId, success: false, error });
            }
          }
        }
        
        const successCount = results.filter(r => r.success).length;
        
        if (successCount > 0) {
          const successfullyDeletedIds = results
            .filter(result => result.success)
            .map(result => result.id);
          
          // Cập nhật selection
          setSelectedRowKeys(prev => prev.filter(key => !successfullyDeletedIds.includes(key)));
          
          // Nếu có refresh handler, gọi nó
          if (eventHandlers?.onRefresh) {
            setTimeout(() => eventHandlers.onRefresh?.(), 100);
          } 
          // Nếu không có refresh handler, cập nhật dữ liệu nội bộ
          else {
            const newData = internalData.filter(item => {
              const itemId = item.id;
              return itemId === undefined || !successfullyDeletedIds.includes(itemId);
            });
            setInternalData(newData);
            
            // Thông báo thay đổi nếu có callback
            if (eventHandlers?.onDataChange) {
              eventHandlers.onDataChange(newData);
            }
          }
        }
        
        return successCount > 0;
      } catch (error) {
        console.error("Error in user-provided batch delete operation:", error);
        return false;
      } finally {
        setIsLoading(false);
      }
    }

    // Sử dụng built-in batch delete nếu không có handler tùy chỉnh
    console.log('Using built-in batch delete');
    return await builtInBatchDelete(selectedRows);
  }, [eventHandlers?.onDelete, eventHandlers?.onRefresh, eventHandlers?.onDataChange, internalData, builtInBatchDelete]);

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
      size,
      theme: theme?.theme || 'system',
      variant: theme?.variant || 'default',
      striped,
      hover,
      bordered,
      sticky,
      colorScheme: theme?.colorScheme || 'default',
      borderRadius: theme?.borderRadius || 'md'
    },
    // Use persistSettings options from props if provided
    tableId: persistSettings?.persistKey || props.tableId || 'rpt-table',
    useUrlAsKey: persistSettings?.useUrlAsKey,
    tableIdentifier: persistSettings?.tableIdentifier,
    persistKey: persistSettings?.persistKey,
    onChange: persistSettings?.onChange
  });
  
  // Merge default configs with props
  const mergedSettings = useMemo(() => {
    // Start with DataTableProvider defaults
    const baseSettings = {
      size: defaultConfig.size || 'medium',
      striped: defaultConfig.striped ?? false,
      bordered: defaultConfig.bordered ?? false,
      hover: defaultConfig.hover ?? true,
      sticky: defaultConfig.sticky ?? false,
      animate: defaultConfig.animations?.enabled ?? true,
      pagination: defaultConfig.pagination ?? true,
      theme: defaultConfig.theme || {
        theme: 'system',
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

    // Override with explicit props (props take precedence over defaults)
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
        persistKey: filteringOptions.persistKey || getCurrentStorageKey()
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
    theme, defaultConfig.theme,
    dialog, defaultConfig.dialog,
    loadingConfig, defaultConfig.loading,
    persistSettings, defaultConfig.persistSettings,
    props.tableId, filteringOptions, defaultConfig.filterDefaults,
    getCurrentStorageKey
  ]);
  
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
    persistKey: filteringOptions.persistKey || getCurrentStorageKey()
  });

  // Mark the component as mounted on client side
  useEffect(() => {
    setClientSideRendered(true);
    
    // Log storage key being used if in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Table settings are being stored with key:', getCurrentStorageKey());
    }
  }, [getCurrentStorageKey]);

  // Use the column visibility hook
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
    persistKey: 'rpt-columns', // Key for localStorage
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
    onSubmit: async (data: Record<string, any>, type: DialogType) => {
      // Add explicit type assertion to ensure type is recognized as DialogType
      const dialogType = type as DialogType;
      
      // Special handling for delete operations
      if (dialogType === 'delete') {
        console.log('Delete operation detected - skipping form validation');
        try {
          // Extract ID for deletion
          const deleteId = data && typeof data === 'object' && 'id' in data ? data.id : undefined;
          console.log('Handling delete for id:', deleteId);
          
          // Nếu có user handler, sử dụng nó
          if (eventHandlers?.onDelete) {
            const success = await eventHandlers.onDelete(deleteId);
            
            // Call after submission handlers if needed
            if (builtInActions?.formHandling?.onAfterSubmit) {
              builtInActions.formHandling.onAfterSubmit(dialogType, data, success);
            }
            
            if (eventHandlers?.onAfterSubmit) {
              eventHandlers.onAfterSubmit(dialogType, data, success);
            }
            
            return success;
          } 
          // Nếu không có user handler, sử dụng built-in
          else if (deleteId !== undefined) {
            console.log('Using built-in delete function');
            const success = await builtInOnDelete(deleteId);
            
            // Call after submission handlers if needed
            if (builtInActions?.formHandling?.onAfterSubmit) {
              builtInActions.formHandling.onAfterSubmit(dialogType, data, success);
            }
            
            if (eventHandlers?.onAfterSubmit) {
              eventHandlers.onAfterSubmit(dialogType, data, success);
            }
            
            return success;
          }
          
          return false;
        } catch (error) {
          console.error('Error in delete operation:', error);
          return false;
        }
      }
      
      // Log the submitted data to help debug
      console.log(`Submitting ${type} dialog with data:`, JSON.stringify(data));
      
      // Use form handling context to get validated data
      if (builtInActions?.formHandling?.autoHandleFormSubmission) {
        try {
          // Get validated data from form
          const validatedData = await formHandling.validateAndGetFormData(type as DialogMode);
          
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
              ...safeData,
              id: data.id // Ensure ID is preserved for edit operations
            };
          }
          
          // Allow pre-submission transformation via builtInActions
          if (builtInActions.formHandling.onBeforeSubmit) {
            const beforeResult = await builtInActions.formHandling.onBeforeSubmit(type as DialogMode, processedData);
            if (beforeResult === false) {
              return false; // Prevent submission
            } else if (beforeResult !== undefined && beforeResult !== null) {
              processedData = beforeResult; // Use transformed data
            }
          }
          
          // Allow pre-submission transformation via eventHandlers
          if (eventHandlers?.onBeforeSubmit) {
            const beforeResult = await eventHandlers.onBeforeSubmit(type as DialogMode, processedData);
            if (beforeResult === false) {
              return false; // Prevent submission
            } else if (beforeResult !== undefined && beforeResult !== null) {
              processedData = beforeResult; // Use transformed data
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
              console.log('Calling onCreate with data:', processedData);
              success = eventHandlers?.onCreate ? await eventHandlers.onCreate(processedData) : true;
              break;
            case 'edit':
              // Ensure we have both the processed data AND the ID for updates
              // Type-safe access to ID
              const recordId = 'id' in processedData ? processedData.id : undefined;
              console.log(`Calling onUpdate with data: ${JSON.stringify(processedData)}, id: ${recordId}`);
              success = eventHandlers?.onUpdate ? await eventHandlers.onUpdate(processedData, recordId) : true;
              break;
            case 'delete':
              // Type-safe access to ID for delete operations
              const deleteId = data && typeof data === 'object' && 'id' in data ? data.id : undefined;
              console.log('Calling onDelete with id:', deleteId);
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
        // Original direct submission behavior for backward compatibility
        try {
          let success: boolean;
          
          switch (type) {
            case 'create':
              console.log('Legacy: Calling onCreate with data:', data);
              success = eventHandlers?.onCreate ? await eventHandlers.onCreate(data) : true;
              break;
            case 'edit':
              // For edit operations, ensure we always have the ID with type safety
              const editId = data && typeof data === 'object' && 'id' in data ? data.id : undefined;
              console.log(`Legacy: Calling onUpdate with data: ${JSON.stringify(data)}, id: ${editId}`);
              success = eventHandlers?.onUpdate ? await eventHandlers.onUpdate(data, editId) : true;
              break;
            case 'delete':
              // Type-safe access to ID for delete
              const deleteId = data && typeof data === 'object' && 'id' in data ? data.id : undefined;
              console.log('Legacy: Calling onDelete with id:', deleteId);
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
  
  // Apply global search and other logic to internalData thay vì data
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
  const handleRefresh = () => {
    if (eventHandlers?.onRefresh) {
      eventHandlers.onRefresh();
    }
  };

  // Handle create action
  const handleCreateAction = () => {
    // Fix: Create a proper initial object with required BaseTableData fields
    const initialData = { id: undefined } as T;
    openCreateDialog(initialData, 'Thêm mới');
  };
  
  // Handle table settings change
  const handleTableSettingsChange = (settings: TableSettings) => {
    console.log('Table settings changed:', settings);
    
    // Update all settings rather than just calling onDataChange
    if (settings) {
      if (settings.size) updateTableSetting('size', settings.size);
      if (settings.theme) updateTableSetting('theme', settings.theme);
      if (settings.variant) updateTableSetting('variant', settings.variant);
      if (settings.colorScheme) updateTableSetting('colorScheme', settings.colorScheme);
      if (settings.borderRadius) updateTableSetting('borderRadius', settings.borderRadius);
      
      // Boolean settings need special handling as they could be false
      updateTableSetting('striped', !!settings.striped);
      updateTableSetting('bordered', !!settings.bordered);
      updateTableSetting('hover', settings.hover !== false); // true by default
      updateTableSetting('sticky', !!settings.sticky);
    }
    
    // Call callback from persistSettings if provided
    if (persistSettings?.onChange) {
      persistSettings.onChange(settings);
    }
    
    // Keep the original callback if needed
    if (eventHandlers?.onDataChange) {
      eventHandlers.onDataChange(data);
    }
  };
  
  // Handle save table identifier
  const handleSaveTableIdentifier = (identifier: string) => {
    if (!identifier.trim()) return;
    
    try {
      // Use the saveSettingsWithIdentifier function from useTableSettings hook
      const success = saveSettingsWithIdentifier(identifier);

      if (success) {
        // Show success notification
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
  };

  // Check for empty state
  const isEmptyState = !loading && data.length === 0;
  
  // Get table size from settings, with SSR safety
  const effectiveSize = isClient && tableSettings?.size 
    ? tableSettings.size 
    : size;

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

  // Use the normalization function
  const tableSize: TableSize = normalizeTableSize(effectiveSize);
  
  // Get sort direction for a column
  const getSortDirection = (accessor?: string): SortDirection | undefined => {
    if (!accessor) return undefined;
    const sort = sortingState.find(s => s.field === accessor);
    return sort?.direction;
  };
  
  // Create row actions from builtInActions and custom actions
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
            openViewDialog(record, 'Xem chi tiết');
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
            openEditDialog(record, 'Chỉnh sửa');
          },
          ...(typeof builtInActions.edit === 'object' ? builtInActions.edit : {})
        };
        allActions.push(editAction);
      }
      
      // Add delete action - always available với built-in functionality
      if (builtInActions.delete !== false) {
        const deleteAction: ActionConfig<T> = {
          key: 'delete',
          label: 'Xóa',
          type: 'delete',
          tooltip: 'Xóa mục này',
          variant: 'destructive',
          onClick: (record) => {
            // Open delete dialog with confirmation
            openDeleteDialog(
              record, 
              'Xác nhận xóa', 
              'Bạn có chắc chắn muốn xóa mục này không? Hành động này không thể hoàn tác.'
            );
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
  }, [builtInActions, actions, openDeleteDialog]);
  
  // Extract form components from builtInActions with automatic wrapping
  const formComponents = useMemo(() => {
    if (!builtInActions) return {};
    
    const autoHandleSubmission = builtInActions.formHandling?.autoHandleFormSubmission;
    
    // Create wrapped components with proper typing
    const wrapComponent = <P extends DataTableFormProps>(
      Component: React.ComponentType<P> | undefined,
      type: DialogMode
    ) => {
      if (!Component || !autoHandleSubmission) return Component;
      return withFormHandling(Component, type);
    };
    
    return {
      create: wrapComponent(builtInActions.createFormComponent, 'create'),
      edit: wrapComponent(builtInActions.editFormComponent, 'edit'),
      view: wrapComponent(builtInActions.viewFormComponent, 'view'),
      delete: wrapComponent(builtInActions.deleteFormComponent, 'delete'),
      // Kiểm tra tồn tại của customFormComponent trước khi sử dụng
      ...(builtInActions.customFormComponent ? { custom: wrapComponent(builtInActions.customFormComponent, 'custom') } : {})
    };
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

  // Auto-detect user columns for better display
  const isUserColumn = (column: TableColumn<T>): boolean => {
    const key = column.accessorKey as string;
    const id = column.id as string;
    return key === 'name' || id === 'name' || key === 'user' || id === 'user' || 
           column.meta?.isUser === true;
  };

  // Auto-detect status columns for better display
  const isStatusColumn = (column: TableColumn<T>): boolean => {
    const key = column.accessorKey as string;
    const id = column.id as string;
    return key === 'status' || id === 'status' || key?.includes('status') ||
           column.meta?.isStatus === true;
  };

  // Create button for add new record
  const addButton = builtInActions?.create !== false && (
    <button
      className="rpt-add-button"
      onClick={handleCreateAction}
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
        const columnId = String(column.id || column.accessorKey);
        return columnVisibility[columnId] !== false;
      });
    }
    
    // During SSR, just use columns with defaultVisible !== false
    return columns.filter(column => column.defaultVisible !== false);
  }, [columns, columnVisibility, isClient]);

  // Get theme config based on settings and prioritize local settings over global ones
  const effectiveThemeConfig = useMemo(() => {
    // First check if we have local table settings that should override global configs
    if (tableSettings) {
      // Create a theme config from the table settings that will override global config
      const localSettings: TableThemeConfig = {
        theme: tableSettings.theme,
        variant: tableSettings.variant,
        colorScheme: tableSettings.colorScheme,
        borderRadius: tableSettings.borderRadius
      };
      
      // Log settings to help debugging
      if (process.env.NODE_ENV !== 'production') {
        console.debug('DataTable using settings:', tableSettings);
      }
      
      // Return local settings (any undefined values will use defaults in ThemeProvider)
      return localSettings;
    }
    
    // Fall back to the theme prop if provided
    return theme || {};
  }, [tableSettings, theme]);
  
  // Properly apply table features based on settings
  const tableFeatures = useMemo(() => {
    const isStriped = tableSettings?.striped ?? striped;
    const isBordered = tableSettings?.bordered ?? bordered;
    const isHover = tableSettings?.hover ?? hover;
    const isStickyHeader = tableSettings?.sticky ?? sticky;
    
    return {
      striped: isStriped,
      bordered: isBordered,
      highlightOnHover: isHover,
      stickyHeader: isStickyHeader
    };
  }, [tableSettings, striped, bordered, hover, sticky]);
  
  // // Generate table features from size and props
  // const tableFeatures = useMemo(() => ({
  //   striped: striped || defaultConfig?.striped || false,
  //   highlightOnHover: highlightOnHover || defaultConfig?.highlightOnHover || false,
  //   bordered: bordered || defaultConfig?.bordered || false,
  //   stickyHeader: stickyHeader || defaultConfig?.stickyHeader || false,
  //   maxHeight: typeof maxHeight === 'undefined' ? defaultConfig?.maxHeight : maxHeight,
  //   scrollBar: scrollBar || defaultConfig?.scrollBar || false,
  //   overflowXAuto: !!overflowXAuto,
  //   animationLevel: animationLevel || defaultConfig?.animationLevel || 'medium',
  //   density: effectiveSize
  // }), [striped, highlightOnHover, bordered, stickyHeader, maxHeight, 
  //     scrollBar, overflowXAuto, defaultConfig, animationLevel, effectiveSize]);
      
  // Helper method to render the table's empty state
  const renderEmptyState = () => {
    if (emptyStateRenderer) {
      return emptyStateRenderer();
    }
    
    // Safely access tableSettings.emptyState properties with fallbacks
    const emptyStateConfig = tableSettings?.emptyState || {};
    const emptyStateAction = emptyStateConfig.action;
    const emptyStateTitle = emptyStateConfig.title || "Không có dữ liệu";
    const emptyStateMessage = emptyStateConfig.message || "Không tìm thấy kết quả nào phù hợp với tiêu chí tìm kiếm.";
    
    return (
      <EmptyState 
        title={emptyStateTitle}
        message={emptyStateMessage}
        animationStyle={animate ? "fade-in" : "none"}
        iconSize="lg"
        action={emptyStateAction}
        animate={animate}
      />
    );
  };

  // For better loading state management, let's add a dedicated function
  const renderLoadingState = () => {
    if (!loading) return null;
    
    // Ensure all necessary properties are defined with fallbacks
    const effectiveLoadingConfig = {
      variant: loadingConfig?.variant || mergedSettings.loadingConfig.variant,
      spinnerSize: loadingConfig?.spinnerSize || mergedSettings.loadingConfig.spinnerSize,
      text: loadingConfig?.text || mergedSettings.loadingConfig.text,
      spinnerType: loadingConfig?.spinnerType || mergedSettings.loadingConfig.spinnerType,
      skeletonRows: loadingConfig?.skeletonRows || mergedSettings.loadingConfig.skeletonRows,
      skeletonColumns: loadingConfig?.skeletonColumns || (columns.length > 0 ? columns.length : mergedSettings.loadingConfig.skeletonColumns)
    };
    
    // Create optimized loading experience based on configuration
    return (
      <TableLoading 
        loading={true} 
        type={effectiveLoadingConfig.spinnerType}
        size={effectiveLoadingConfig.spinnerSize}
        variant={effectiveLoadingConfig.variant}
        text={effectiveLoadingConfig.text}
        skeletonRows={effectiveLoadingConfig.skeletonRows}
        skeletonColumns={effectiveLoadingConfig.skeletonColumns}
        blur={true}
        disablePointerEvents={true}
        reducedMotion={!animate} // Use reducedMotion if animations are disabled
      />
    );
  };

  // Table content to render within ThemeProvider
  const tableContent = (
    <div className={cn('rpt-container', className)}>
      {/* Toolbar with title, search and actions */}
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
          advancedFiltering={mergedSettings.filteringOptions.advancedFiltering ? {
            enabled: mergedSettings.filteringOptions.advancedFiltering,
            allowPresets: mergedSettings.filteringOptions.allowFilterPresets,
            allowComplexFilters: mergedSettings.filteringOptions.allowComplexFilters,
            // Convert filterPresets to match expected type with createdAt as number
            initialPresets: filterPresets.map(preset => ({
              ...preset,
              createdAt: typeof preset.createdAt === 'string' 
                ? new Date(preset.createdAt).getTime() 
                : preset.createdAt
            })),
            onPresetsChange: filteringOptions.onFilterPresetsChange,
            persistKey: mergedSettings.filteringOptions.persistKey
          } : undefined}
          onRefresh={handleRefresh}
          columns={columns}
          visibleColumns={visibleColumns}
          onToggleColumn={toggleColumnVisibility}
          onHideAllColumns={hideAllColumns}
          onShowAllColumns={showAllColumns}
          onResetColumns={resetColumnVisibility}
          columnVisibility={columnVisibility}
          createButton={addButton}
          hasCreated={!!builtInActions?.create}
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
          tableTheme={effectiveThemeConfig}
          tableSize={tableSettings?.size}
          tableStriped={tableSettings?.striped}
          tableHover={tableSettings?.hover}
          tableBordered={tableSettings?.bordered}
          tableStickyHeader={tableSettings?.sticky}
          currentTableIdentifier={persistSettings?.tableIdentifier || ''}
          onSaveTableIdentifier={handleSaveTableIdentifier}
        />
      )}
      
      {/* Table with loading state */}
      <TableContainer
        className={cn(
          tableFeatures.stickyHeader && 'rpt-fixed-header',
          tableFeatures.striped && 'rpt-zebra-striping',
          tableFeatures.highlightOnHover && 'rpt-table-hover',
          tableFeatures.bordered && 'rpt-table-bordered',
        )}
      >
        {/* Replace the existing loading section with the optimized version */}
        {renderLoadingState()}
        
        {error && (
          errorStateRenderer ? 
            errorStateRenderer(error) : 
            <ErrorState />
        )}
        
        {!error && (
          <>
            <div className={cn("rpt-table-wrapper", tableFeatures.stickyHeader && 'rpt-fixed-header')}>
              <Table
                data={data}
                columns={columns}
                size={tableSize}
                striped={tableFeatures.striped}
                bordered={tableFeatures.bordered}
                highlightOnHover={tableFeatures.highlightOnHover}
                className={tableClassName}
                stickyHeader={tableFeatures.stickyHeader}
              >
                <TableHead>
                  <TableHeadRow>
                    {/* Selection column if enabled */}
                    {isSelectionEnabled && (
                      <TableHeadCell className="rpt-select-cell">
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
                      return (
                        <TableHeadCell 
                          key={key || id}
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
                    {hasRowActions && <TableHeadCell isAction={true} className="rpt-action-header-cell">Thao tác</TableHeadCell>}
                  </TableHeadRow>
                </TableHead>
                
                <TableBody>
                  {isEmptyState ? (
                    <tr>
                      <td colSpan={visibleColumns.length + (isSelectionEnabled ? 1 : 0) + (hasRowActions ? 1 : 0)}>
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
                    <AnimatePresence>
                      {paginatedData.map((row, rowIndex) => {
                        const rowId = getRowKey(row, rowIndex);
                        const isSelected = isSelectionEnabled && selectedRowKeys.includes(rowId);
                        const isUpdated = updatedRowKeys.has(rowId);
                        
                        return (
                          <TableRow
                            key={rowId}
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
                              <TableCell className="rpt-select-cell">
                                <Checkbox
                                  checked={isSelected}
                                  onChange={() => handleToggleSelection(rowId)}
                                  aria-label={`Select row ${rowIndex + 1}`}
                                />
                              </TableCell>
                            )}
                            
                            {/* Data cells */}
                            {visibleColumns.map(column => {
                              const { key, id, dataIndex, render, meta } = transformColumn(column);
                              const cellId = `${rowId}-${key || id}`;
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
                            
                            {/* Row actions if provided */}
                            {hasRowActions && (
                              <TableCell isAction={true} className="rpt-action-cell">
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
      <AppendableDialog
        activeDialog={dialogOpen ? (dialogType as DialogType) : undefined}
        activeRecord={dialogData}
        dialogTitle={dialogTitle}
        dialogDescription={dialogDescription}
        loading={dialogLoading}
        error={dialogError ? dialogError.message : null}
        onClose={closeDialog}
        onSubmit={submitDialog}
        formComponents={formComponents}
        closeOnClickOutside={dialog?.closeOnClickOutside}
        closeOnEsc={dialog?.closeOnEsc}
        width={dialog?.width}
        actionsPosition="right"
        buttonSize="md"
        elevatedButtons={true}
        loadingEffect="overlay" // Add this prop to control loading effect
        reducedMotion={!animate} // Add this for accessibility
      />
      
      {/* New Batch Actions Bar */}
      <BatchActionsBar
        selectedCount={selectedRowKeys.length}
        selectedRows={data.filter(row => {
          const id = getRowKey(row, 0);
          return selectedRowKeys.includes(id);
        })}
        onDelete={handleBatchDelete} // Use our improved handleBatchDelete function
        onClearSelection={() => setSelectedRowKeys([])}
        animate={animate}
      />
    </div>
  );

  // Wrap with ThemeProvider using effective theme settings
  return (
    <ThemeProvider themeConfig={effectiveThemeConfig}>
      {tableContent}
    </ThemeProvider>
  );
}

export const DataTable = React.memo(DataTableWithFormHandling);
DataTable.displayName = 'DataTable';
export default DataTable;
