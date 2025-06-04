import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnFiltersState,
  PaginationState,
  SortingState as TanStackSortingState,
  RowSelectionState,
  VisibilityState,
  ExpandedState,
  createColumnHelper,
  Column,
} from '@tanstack/react-table';
import {
  BaseTableData,
  TableColumn,
  UseDataTableOptions,
  UseDataTableReturn,
  SortConfig,
  SortDirection,
  FilterConfig,
  GlobalSearchConfig,
} from '../types';
import { generateId } from '../utils';

/**
 * Main hook for table data management
 * Provides sorting, filtering, pagination, and selection functionality
 */
export function useDataTable<T extends BaseTableData = BaseTableData>({
  data,
  columns: userColumns,
  tableId: userTableId,
  pagination,
  total: totalProp,
  selection,
  sorting: initialSorting = [],
  filters: filterConfigs = [],
  filterValues: initialFilterValues = {},
  globalSearch: globalSearchConfig,
  eventHandlers,
  serverData,
  serverPagination = false,
  serverSorting = false,
  serverFiltering = false,
}: UseDataTableOptions<T>): UseDataTableReturn<T> {
  // Generate a unique table ID if not provided
  const tableIdRef = useRef(userTableId || generateId('table'));

  // States for table features
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data_, setData] = useState<T[]>(data);
  
  // Pagination state
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: pagination?.current ? pagination.current - 1 : 0,
    pageSize: pagination?.pageSize || 10,
  });

  // Sorting state
  const [sorting, setSorting] = useState<TanStackSortingState>(
    initialSorting.map(sort => ({
      id: sort.field,
      desc: sort.direction === 'desc',
    }))
  );

  // Filter state
  const [filters, setFilters] = useState<Record<string, any>>(initialFilterValues);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Global search state
  const [globalFilter, setGlobalFilter] = useState<string>('');

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Row selection state
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  
  // Expanded rows state
  const [expanded, setExpanded] = useState<ExpandedState>({});

  // Convert user columns to TanStack columns format
  const columnHelper = useMemo(() => createColumnHelper<any>(), []);
  
  const columns = useMemo(() => {
    return userColumns.map(col => {
      const columnDef: any = {
        id: col.id?.toString() || col.accessorKey?.toString(),
        accessorKey: col.accessorKey?.toString(),
        header: col.header,
        cell: col.cell ? 
          (info: any) => col.cell?.({ 
            row: info.row.original, 
            value: info.getValue(), 
            index: info.row.index,
            column: col
          }) : 
          undefined,
        footer: col.footer,
        enableSorting: col.enableSorting ?? col.sortable ?? true,
        enableColumnFilter: col.enableFiltering ?? col.filterable ?? true,
        meta: {
          ...col.meta,
          align: col.align || 'left',
          width: col.width,
          minWidth: col.minWidth,
          maxWidth: col.maxWidth,
          size: col.size,
          minSize: col.minSize,
          maxSize: col.maxSize,
        }
      };
      
      return columnDef;
    });
  }, [userColumns]);

  // Calculate total number of records
  const total = useMemo(() => {
    if (serverPagination) {
      return totalProp ?? 0;
    }
    return data.length;
  }, [serverPagination, totalProp, data.length]);

  // Server-side data fetching
  const fetchServerData = useCallback(async () => {
    if (!serverData?.onDataFetch) return;

    try {
      setLoading(true);
      setError(null);
      
      // Use the correctly typed parameter structure for onDataFetch
      const result = await serverData.onDataFetch({
        pageIndex: paginationState.pageIndex,
        pageSize: paginationState.pageSize,
        filters,
        sorting: sorting.map(sort => ({ 
          id: sort.id, 
          desc: sort.desc 
        })),
        globalFilter
      });
      
      // Handle the result data with proper type safety
      setData(result.data as T[]);
      
      // Handle total count from either property name (for backwards compatibility)
      if (result.totalCount !== undefined) {
        // If we had a setTotal function, we would call it here
      } else if (result.total !== undefined) {
        // Handle legacy API responses that use 'total' instead of 'totalCount'
      }
      
      setLoading(false);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(err?.message || 'Unknown error'));
      setLoading(false);
      
      if (serverData.onError) {
        serverData.onError(err instanceof Error ? err : new Error(err?.message || 'Unknown error'));
      }
    }
  }, [
    serverData,
    paginationState.pageIndex,
    paginationState.pageSize,
    sorting,
    filters,
    globalFilter
  ]);

  // Fetch data when dependencies change
  useEffect(() => {
    if (serverData?.onDataFetch) {
      fetchServerData();
    } else {
      setData(data);
    }
  }, [data, fetchServerData, serverData]);

  // Create the table instance
  const table = useReactTable({
    data: data_,
    columns,
    state: {
      sorting,
      pagination: paginationState,
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
      expanded,
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: !serverFiltering ? getFilteredRowModel() : undefined,
    getPaginationRowModel: !serverPagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: !serverSorting ? getSortedRowModel() : undefined,
    onSortingChange: setSorting,
    onPaginationChange: setPaginationState,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onExpandedChange: setExpanded,
    manualPagination: serverPagination,
    manualSorting: serverSorting,
    manualFiltering: serverFiltering,
    enableMultiSort: true,
    pageCount: serverPagination ? Math.ceil(total / paginationState.pageSize) : undefined,
  });

  // Public API methods
  const setPage = useCallback((page: number) => {
    setPaginationState(prev => ({ ...prev, pageIndex: page - 1 }));
    
    if (eventHandlers?.onPageChange) {
      eventHandlers.onPageChange(page, paginationState.pageSize);
    }
  }, [paginationState.pageSize, eventHandlers]);

  const setPageSize = useCallback((size: number) => {
    setPaginationState(prev => ({ 
      pageSize: size,
      pageIndex: 0 // Reset to first page when changing page size
    }));
    
    if (eventHandlers?.onPageSizeChange) {
      eventHandlers.onPageSizeChange(size);
    }
  }, [eventHandlers]);

  const setSort = useCallback((field: string, direction: SortDirection) => {
    if (!field) return;
    
    const newSorting: TanStackSortingState = direction === false
      ? []
      : [{ id: field, desc: direction === 'desc' }];
    
    setSorting(newSorting);
    
    if (eventHandlers?.onSortChange) {
      const sortConfigs: SortConfig[] = newSorting.map(s => ({
        field: s.id,
        direction: s.desc ? 'desc' : 'asc'
      }));
      
      eventHandlers.onSortChange(sortConfigs);
    }
  }, [eventHandlers]);

  const setSortingArray = useCallback((sortingArray: SortConfig[]) => {
    const newSorting: TanStackSortingState = sortingArray.map(sort => ({
      id: sort.field,
      desc: sort.direction === 'desc',
    }));
    
    setSorting(newSorting);
    
    if (eventHandlers?.onSortChange) {
      eventHandlers.onSortChange(sortingArray);
    }
  }, [eventHandlers]);

  const setFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Also set column filters for TanStack Table
    if (value === undefined || value === null || value === '') {
      setColumnFilters(prev => prev.filter(filter => filter.id !== key));
    } else {
      setColumnFilters(prev => {
        const existing = prev.findIndex(filter => filter.id === key);
        if (existing >= 0) {
          const newFilters = [...prev];
          newFilters[existing] = { id: key, value };
          return newFilters;
        }
        return [...prev, { id: key, value }];
      });
    }
    
    // Reset to first page when filters change
    setPaginationState(prev => ({ ...prev, pageIndex: 0 }));
    
    if (eventHandlers?.onFilterChange) {
      eventHandlers.onFilterChange({ ...filters, [key]: value });
    }
  }, [filters, eventHandlers]);

  const setFiltersObject = useCallback((newFilters: Record<string, any>) => {
    setFilters(newFilters);
    
    // Update column filters for TanStack Table
    const columnFiltersArray: ColumnFiltersState = [];
    
    for (const [key, value] of Object.entries(newFilters)) {
      if (value !== undefined && value !== null && value !== '') {
        columnFiltersArray.push({ id: key, value });
      }
    }
    
    setColumnFilters(columnFiltersArray);
    
    // Reset to first page when filters change
    setPaginationState(prev => ({ ...prev, pageIndex: 0 }));
    
    if (eventHandlers?.onFilterChange) {
      eventHandlers.onFilterChange(newFilters);
    }
  }, [eventHandlers]);

  const clearFilters = useCallback(() => {
    setFilters({});
    setColumnFilters([]);
    
    // Reset to first page when filters change
    setPaginationState(prev => ({ ...prev, pageIndex: 0 }));
    
    if (eventHandlers?.onFilterChange) {
      eventHandlers.onFilterChange({});
    }
  }, [eventHandlers]);

  const setGlobalFilterValue = useCallback((value: string) => {
    setGlobalFilter(value);
    
    // Reset to first page when search changes
    setPaginationState(prev => ({ ...prev, pageIndex: 0 }));
    
    if (eventHandlers?.onGlobalSearchChange) {
      eventHandlers.onGlobalSearchChange(value);
    }
  }, [eventHandlers]);

  const setSelectedRowKeys = useCallback((keys: (string | number)[]) => {
    // Convert array of keys to TanStack rowSelection format
    const selectionMap: RowSelectionState = {};
    keys.forEach(key => {
      selectionMap[key.toString()] = true;
    });
    
    setRowSelection(selectionMap);
    
    if (eventHandlers?.onSelectionChange) {
      // Fix: Type safety for filtering with generic constraint
      const selectedRows = data_.filter(row => {
        const id = row.id?.toString();
        return id !== undefined && keys.includes(id);
      });
      
      eventHandlers.onSelectionChange(keys, selectedRows);
    }
  }, [data_, eventHandlers]);

  const setExpandedRowKeys = useCallback((keys: (string | number)[]) => {
    // Convert array of keys to TanStack expanded format
    const expandedMap: ExpandedState = {};
    keys.forEach(key => {
      expandedMap[key.toString()] = true;
    });
    
    setExpanded(expandedMap);
    
    if (eventHandlers?.onExpandChange) {
      // Fix: Type safety for filtering with generic constraint
      const expandedRows = data_.filter(row => {
        const id = row.id?.toString();
        return id !== undefined && keys.includes(id);
      });
      
      eventHandlers.onExpandChange(keys, expandedRows);
    }
  }, [data_, eventHandlers]);

  const selectAll = useCallback(() => {
    const allRowKeys = data_.map(row => row.id as string | number).filter(Boolean);
    setSelectedRowKeys(allRowKeys);
  }, [data_, setSelectedRowKeys]);

  const selectNone = useCallback(() => {
    setSelectedRowKeys([]);
  }, [setSelectedRowKeys]);

  const selectInvert = useCallback(() => {
    const allRowKeys = data_.map(row => row.id as string | number).filter(Boolean);
    const selectedKeys = Object.entries(rowSelection)
      .filter(([, selected]) => selected)
      .map(([key]) => {
        const numKey = parseInt(key, 10);
        return !isNaN(numKey) ? numKey : key;
      });
    
    const invertedSelection = allRowKeys.filter(key => !selectedKeys.includes(key));
    setSelectedRowKeys(invertedSelection);
  }, [data_, rowSelection, setSelectedRowKeys]);

  const refresh = useCallback(() => {
    if (eventHandlers?.onRefresh) {
      eventHandlers.onRefresh();
    }
    
    if (serverData?.onDataFetch) {
      fetchServerData();
    }
  }, [eventHandlers, serverData, fetchServerData]);

  const reset = useCallback(() => {
    // Reset all states to initial values
    setPaginationState({
      pageIndex: pagination?.current ? pagination.current - 1 : 0,
      pageSize: pagination?.pageSize || 10,
    });
    
    setSorting(initialSorting.map(sort => ({
      id: sort.field,
      desc: sort.direction === 'desc',
    })));
    
    setFilters(initialFilterValues);
    setColumnFilters([]);
    setGlobalFilter('');
    setRowSelection({});
  }, [pagination, initialSorting, initialFilterValues]);

  // Get selected rows data
  const selectedRows = useMemo(() => {
    return data_.filter(row => {
      const id = row.id?.toString();
      return id !== undefined && rowSelection[id];
    });
  }, [data_, rowSelection]);

  // Convert selected row keys
  const selectedRowKeys = useMemo(() => {
    return Object.entries(rowSelection)
      .filter(([, selected]) => selected)
      .map(([key]) => {
        const numKey = parseInt(key, 10);
        return !isNaN(numKey) ? numKey : key;
      });
  }, [rowSelection]);

  // Convert expanded row keys
  const expandedRowKeys = useMemo(() => {
    return Object.entries(expanded)
      .filter(([, isExpanded]) => isExpanded)
      .map(([key]) => {
        const numKey = parseInt(key, 10);
        return !isNaN(numKey) ? numKey : key;
      });
  }, [expanded]);

  // Convert sorting state from TanStack format to SortConfig[]
  const sortingConfigs = useMemo(() => {
    return sorting.map(sort => ({
      field: sort.id,
      direction: sort.desc ? 'desc' : 'asc' as SortDirection
    }));
  }, [sorting]);

  // Get filtered data (client-side)
  const filteredData = useMemo(() => {
    return table.getFilteredRowModel().rows.map(row => row.original);
  }, [table]);

  // Return the public API
  return {
    table,
    data: data_,
    filteredData,
    selectedRows,
    loading,
    error,
    pagination: {
      current: paginationState.pageIndex + 1,
      pageSize: paginationState.pageSize,
      total,
      totalPages: Math.ceil(total / paginationState.pageSize),
    },
    sorting: sortingConfigs,
    filters,
    globalFilter,
    selectedRowKeys,
    columnVisibility,
    expandedRowKeys,
    setPage,
    setPageSize,
    setSort,
    setSorting: setSortingArray,
    setFilter,
    setFilters: setFiltersObject,
    clearFilters,
    setGlobalFilter: setGlobalFilterValue,
    setSelectedRowKeys,
    setExpandedRowKeys,
    setColumnVisibility,
    selectAll,
    selectNone,
    selectInvert,
    refresh,
    reset,
  };
}