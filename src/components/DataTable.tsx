import React, { useState, useMemo, useEffect, useRef } from 'react';
import { cn } from '../utils/cn';
import { 
  DataTableProps, 
  BaseTableData, 
  SortConfig,
  SortDirection, 
  TableSize,
  TableColumn,
  PaginationConfig,
  GlobalSearchConfig,
  SelectionConfig,
  FilterConfig,
  ActionConfig,
  DialogType
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
import Checkbox from './form/Checkbox';
import { AppendableDialog } from './AppendableDialog';
import ThemeProvider from './ThemeProvider';

// Import hooks
import { useAnimationPreference } from '../hooks/useAnimationPreference';
import { useTableDialog } from '../hooks/useTableDialog';
import { useTableExport } from '../hooks/useTableExport';
import { useColumnVisibility } from '../hooks/useColumnVisibility';
import { useTableSettings, TableSettings } from '../hooks/useTableSettings';
import { useTableFilter, FilterPreset } from '../hooks/useTableFilter';

// For better animations
import { motion, AnimatePresence } from 'framer-motion';

export function DataTable<T extends BaseTableData = BaseTableData>({
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
  // Flag to ensure we only render fully on the client side
  const [isClient, setIsClient] = useState(false);

  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchValue, setSearchValue] = useState('');
  const [sortingState, setSortingState] = useState<SortConfig[]>(sorting);
  const [selectedRowKeys, setSelectedRowKeys] = useState<(string | number)[]>([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState<(string | number)[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [updatedRowKeys, setUpdatedRowKeys] = useState<Set<string | number>>(new Set());

  // Use table settings hook to manage and persist table configuration
  const { 
    settings: tableSettings, 
    updateSetting: updateTableSetting, 
    resetSettings: resetTableSettings,
    getThemeConfig,
    getCurrentStorageKey,
    saveSettingsWithIdentifier
  } = useTableSettings({
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
    setIsClient(true);
    
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
  } = useTableDialog({
    onSubmit: (data, type) => {
      switch (type) {
        case 'create':
          eventHandlers?.onCreate?.(data);
          break;
        case 'edit':
          eventHandlers?.onUpdate?.(data, data.id);
          break;
        case 'delete':
          eventHandlers?.onDelete?.(data.id);
          break;
      }
    }
  });

  // Animation preference
  const animation = useAnimationPreference({
    enabled: animate
  });
  
  // Determine search configuration - moved before processedData
  const isSearchEnabled = globalSearch?.enabled === true || typeof globalSearch === 'object';
  const searchConfig = typeof globalSearch === 'object' ? globalSearch : {} as GlobalSearchConfig;
  
  // Apply global search to already filtered data
  const processedData = useMemo(() => {
    let result = hasActiveFilters ? filteredData : [...data];
    
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
  }, [data, filteredData, hasActiveFilters, sortingState, searchValue, isSearchEnabled, columns, searchConfig]);
  
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
    setFilter(field, value);
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
    openCreateDialog({}, 'Thêm mới');
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
  
  // Get table size from settings
  const effectiveSize = tableSettings?.size || size;
  
  // Map from TableSettings size to TableSize with correct values
  const tableSizeMap: Record<string, TableSize> = {
    sm: 'small',
    small: 'small',
    md: 'medium',
    medium: 'medium',
    lg: 'large',
    large: 'large'
  };
  
  const tableSize = tableSizeMap[effectiveSize] || 'medium';
  
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
      
      // Add delete action
      if (builtInActions.delete !== false) {
        const deleteAction: ActionConfig<T> = {
          key: 'delete',
          label: 'Xóa',
          type: 'delete',
          tooltip: 'Xóa',
          variant: 'destructive',
          onClick: (record) => {
            openDeleteDialog(record, 'Xác nhận xóa', 'Bạn có chắc chắn muốn xóa mục này không? Hành động này không thể hoàn tác.');
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
  }, [builtInActions, actions]);

  // Extract form components from builtInActions
  const formComponents = useMemo(() => {
    if (!builtInActions) return {};
    
    return {
      create: builtInActions.createFormComponent,
      edit: builtInActions.editFormComponent,
      view: builtInActions.viewFormComponent,
      delete: builtInActions.deleteFormComponent,
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
  // instead of sorting them alphabetically
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

  // Get theme config based on settings
  const effectiveThemeConfig = useMemo(() => {
    return tableSettings ? {
      theme: tableSettings.theme,
      variant: tableSettings.variant,
      colorScheme: tableSettings.colorScheme,
      borderRadius: tableSettings.borderRadius,
      ...theme // Merge with any explicitly provided theme props
    } : theme;
  }, [tableSettings, theme]);
  
  // Properly apply table features based on settings
  const tableFeatures = useMemo(() => {
    return {
      striped: tableSettings?.striped ?? striped,
      bordered: tableSettings?.bordered ?? bordered,
      highlightOnHover: tableSettings?.hover ?? hover,
      stickyHeader: tableSettings?.sticky ?? sticky
    };
  }, [tableSettings, striped, bordered, hover, sticky]);
  
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
          advancedFiltering={filteringOptions.advancedFiltering ? {
            enabled: filteringOptions.advancedFiltering,
            allowPresets: filteringOptions.allowFilterPresets,
            allowComplexFilters: filteringOptions.allowComplexFilters,
            initialPresets: filterPresets,
            onPresetsChange: filteringOptions.onFilterPresetsChange,
            persistKey: filteringOptions.persistKey
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
        {loading && (
          <LoadingState 
            loading={true} 
            loadingType='spinner'
            size='md' 
            overlay={true}
            center={true}
          />
        )}
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
                          <TableEmpty message="Không có dữ liệu" />
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
        activeDialog={dialogOpen ? dialogType : undefined}
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
        loadingAnimationType="dots" // or "wave", "pulse", "circle", etc.
        actionsPosition="right"     // or "left", "center", "split"
        buttonSize="md"            // "xs", "sm", "md", "lg", "xl"
        elevatedButtons={true}     // for shadow effect
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

export default DataTable;