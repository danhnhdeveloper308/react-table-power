import React from 'react';
import { ReactNode } from 'react';
import { 
  ColumnDef, 
  SortingState as TanStackSortingState, 
  ColumnFiltersState, 
  VisibilityState, 
  Table as TanStackTable, 
  RowSelectionState, 
  PaginationState,
  ExpandedState,
  HeaderGroup,
  Header,
  Cell,
  Row,
  ColumnSort
} from '@tanstack/react-table';

// ==================== Re-export @tanstack/react-table types ====================
export type SortingState = TanStackSortingState;
export type { ColumnFiltersState, VisibilityState, RowSelectionState, PaginationState, ExpandedState };

// ==================== Base Types ====================
export interface BaseTableData {
  id?: string | number;
  [key: string]: any;
}

export type TableSize = 'small' | 'medium' | 'large';
export type SortDirection = 'asc' | 'desc' | false;
export type LoadingVariant = 'skeleton' | 'spinner' | 'pulse';
export type DialogMode = 'view' | 'edit' | 'create' | 'delete';
export type ExportFormat = 'csv' | 'excel' | 'pdf';
export type FilterType = 'text' | 'select' | 'boolean' | 'date' | 'dateRange' | 'number' | 'custom';
export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'primary';
export type TablePosition = 'top' | 'bottom' | 'both';
export type ColorScheme = 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | 'info';
export type ActionPosition = 'inline' | 'dropdown';
export type ColumnAlignment = 'left' | 'center' | 'right';
export type StickyPosition = 'left' | 'right' | false;

// ==================== Column Configuration ====================
export interface TableColumn<T extends BaseTableData = BaseTableData> {
  id?: string | number;
  accessorKey?: string | keyof T;
  header?: string | React.ReactNode;
  cell?: (props: { row: T; value: any; index: number; column?: TableColumn<T> }) => React.ReactNode;
  footer?: string | React.ReactNode;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableResizing?: boolean;
  /**
   * Whether this column can be hidden by the user
   * @default true
   */
  enableHiding?: boolean;
  enablePinning?: boolean;
  meta?: Record<string, any>;
  exportable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: FilterType;
  filterOptions?: FilterOption[];
  width?: number | string;
  minWidth?: number | string;
  maxWidth?: number | string;
  align?: ColumnAlignment;
  sticky?: StickyPosition;
  canHide?: boolean;
  size?: number;
  minSize?: number;
  maxSize?: number;
  /**
   * Whether this column is visible by default
   * @default true
   */
  defaultVisible?: boolean;
  /**
   * Whether to truncate text in this column if it's too long
   * @default false
   */
  truncate?: boolean;
}

// ==================== Table Component Props ====================
export interface TableProps<T extends BaseTableData = BaseTableData> extends React.HTMLAttributes<HTMLTableElement> {
  /**
   * Data to be displayed in the table
   */
  data: T[];
  
  /**
   * Column definitions
   */
  columns: TableColumn<T>[];
  
  /**
   * Size of the table cells
   * @default 'medium'
   */
  size?: TableSize;
  
  /**
   * Whether to apply zebra striping to rows
   * @default false
   */
  striped?: boolean;
  
  /**
   * Whether to display borders around cells
   * @default false
   */
  bordered?: boolean;
  
  /**
   * Whether to highlight rows on hover
   * @default true
   */
  highlightOnHover?: boolean;
  
  /**
   * Whether the header should stick to the top when scrolling
   * @default false
   */
  stickyHeader?: boolean;

  /**
   * Alternative name for striped
   */
  zebra?: boolean;
  
  /**
   * Whether to apply rounded corners
   */
  rounded?: boolean;
  
  /**
   * Whether table should take full width
   */
  fullWidth?: boolean;
  
  /**
   * Use more compact spacing
   */
  dense?: boolean;
  
  /**
   * Table title (optional)
   */
  title?: string;

  /**
   * Visual variant/theme of the table
   */
  variant?: string;
  
  /**
   * Row expansion configuration
   */
  rowExpansion?: RowExpansionConfig;
  
  /**
   * Event handlers for table interactions
   */
  eventHandlers?: EventHandlersConfig<T>;
}

// ==================== FilterOptions ====================
export interface FilterOption {
  label: string;
  value: string | number | boolean;
  /**
   * Whether this option is disabled
   */
  disabled?: boolean;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: FilterType;
  placeholder?: string;
  options?: FilterOption[];
  render?: (props: { onChange: (value: any) => void; filter: FilterConfig }) => React.ReactNode;
  defaultValue?: any;
  /**
   * Additional metadata for the filter
   */
  meta?: {
    /**
     * Filter category for grouping
     */
    category?: string;
    /**
     * Any other metadata properties
     */
    [key: string]: any;
  };
}

// ==================== Pagination Configuration ====================
export interface PaginationConfig {
  enabled?: boolean;
  /**
   * Current page number (1-based)
   * @default 1
   */
  current: number;
  pageSize: number;
  pageSizeOptions?: number[];
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: boolean | ((total: number, range: [number, number]) => string);
  position?: TablePosition;
  total?: number; // Add total property
}

// ==================== Selection Configuration ====================
export interface SelectionConfig {
  enabled?: boolean;
  type?: 'checkbox' | 'radio';
  mode?: 'single' | 'multiple';
  selectionType?: 'checkbox' | 'radio' | 'row';
  selectedRowKeys?: (string | number)[];
  onSelect?: (selectedRowKeys: (string | number)[], selectedRows: BaseTableData[]) => void;
  preserveSelectedRowsOnPageChange?: boolean;
  rowKey?: string | ((record: BaseTableData, index: number) => string | number);
}

// ==================== Sort Configuration ====================
export interface SortConfig {
  field: string;
  direction: SortDirection;
}

// ==================== Global Search Configuration ====================
export interface GlobalSearchConfig {
  enabled?: boolean;
  placeholder?: string;
  debounceMs?: number;
  fields?: string[];
  searchFields?: string[];
  caseSensitive?: boolean;
  autoFocus?: boolean;
  onChange?: (value: string) => void;
}

// ==================== Action Configuration ====================
export interface ActionConfig<T extends BaseTableData = BaseTableData> {
  key: string;
  label?: string;
  icon?: React.ReactNode;
  onClick?: (record: T, index: number) => void;
  hidden?: (record: T) => boolean;
  disabled?: (record: T) => boolean;
  tooltip?: string;
  variant?: ButtonVariant;
  permissions?: string[];
  type?: 'create' | 'edit' | 'delete' | 'view' | 'custom';
  confirmation?: {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
  };
  formComponent?: React.ComponentType<any>;
  position?: ActionPosition;
  colorScheme?: ColorScheme;
  showInToolbar?: boolean;
}

// ==================== Built-in Action Configuration ====================
export interface BuiltInActionsConfig {
  create?: boolean | Partial<ActionConfig>;
  edit?: boolean | Partial<ActionConfig>;
  view?: boolean | Partial<ActionConfig>;
  delete?: boolean | Partial<ActionConfig>;
  position?: ActionPosition;
  maxInlineActions?: number;
  tooltips?: boolean;
  showLabels?: boolean;
  actionButtonVariant?: ButtonVariant;
  // Form components for each action type
  createFormComponent?: React.ComponentType<any>;
  editFormComponent?: React.ComponentType<any>;
  viewFormComponent?: React.ComponentType<any>;
  deleteFormComponent?: React.ComponentType<any>;
}

// ==================== Bulk Action Configuration ====================
export interface BulkActionConfig {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick: (selectedRows: BaseTableData[], selectedRowKeys: (string | number)[]) => void;
  disabled?: (selectedCount: number) => boolean;
  tooltip?: string;
  variant?: ButtonVariant;
  permissions?: string[];
}

// ==================== Export Configuration ====================
export interface ExportConfig {
  enabled?: boolean;
  formats?: ExportFormat[];
  filename?: string;
  includeHeaders?: boolean;
  dateFormat?: string;
  numberFormat?: string;
  onlyVisible?: boolean;
  showSelectedOnly?: boolean;
  customExporter?: (format: ExportFormat, data: BaseTableData[], columns: TableColumn[]) => void;
}

// ==================== Row Expansion Configuration ====================
export interface RowExpansionConfig {
  enabled?: boolean;
  expandedRowKeys?: (string | number)[];
  expandedRowRender?: (record: BaseTableData, index: number) => React.ReactNode;
  renderExpandedRow?: (record: BaseTableData, index: number) => React.ReactNode;
  onExpand?: (expanded: boolean, record: BaseTableData) => void;
  expandedRowClassName?: string;
  expandIcon?: {
    collapsed?: React.ReactNode;
    expanded?: React.ReactNode;
  };
}

// ==================== Dialog Configuration ====================
export interface DialogConfig {
  title?: string;
  description?: string;
  customRenderer?: React.ComponentType<any>;
  width?: string | number;
  closeOnClickOutside?: boolean;
  closeOnEsc?: boolean;
}

// ==================== Loading Configuration ====================
export interface LoadingConfig {
  variant?: LoadingVariant;
  rows?: number;
  customRenderer?: React.ComponentType<any>;
}

// ==================== Server Data Configuration ====================
export interface ServerDataConfig<T extends BaseTableData = BaseTableData> {
  /**
   * Server API endpoint for data fetching
   */
  endpoint?: string;
  
  /**
   * HTTP method to use for the request
   * @default 'GET'
   */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  
  /**
   * Custom fetch function for data retrieval
   * If provided, this will be used instead of the default fetch
   */
  fetchFn?: (url: string, options: RequestInit) => Promise<any>;
  
  /**
   * Key in the API response that contains the data array
   * @default 'data'
   */
  resultsKey?: string;
  
  /**
   * Key in the API response that contains the total count
   * @default 'total'
   */
  totalKey?: string;
  
  /**
   * Additional headers to be sent with the request
   */
  headers?: Record<string, string>;
  
  /**
   * Request body data transformer
   */
  requestTransformer?: (params: any) => any;
  
  /**
   * Response data transformer
   */
  responseTransformer?: (data: any) => any;
  
  /**
   * Callback function when data fetch is successful
   */
  onSuccess?: (data: any) => void;
  
  /**
   * Callback function when data fetch fails
   */
  onError?: (error: Error) => void;
  
  /**
   * Function to fetch data manually
   * This is used when serverData.endpoint is not provided
   */
  onDataFetch?: (options: {
    pageIndex: number;
    pageSize: number;
    filters: Record<string, any>;
    sorting: SortingState;
    globalFilter: string;
  }) => Promise<{ data: T[]; total?: number; totalCount?: number }>;
  
  /**
   * Additional parameters to be sent with the request
   */
  params?: Record<string, any>;
  
  /**
   * Timeout for the request in milliseconds
   * @default 30000
   */
  timeout?: number;
  
  /**
   * Whether to include credentials in the request
   * @default true
   */
  withCredentials?: boolean;
  
  /**
   * CRUD operation endpoints
   */
  crudEndpoints?: {
    create?: string;
    read?: string;
    update?: string;
    delete?: string;
    bulk?: string;
  };
  
  /**
   * CRUD operation methods
   */
  crudMethods?: {
    create?: 'POST' | 'PUT';
    update?: 'PUT' | 'PATCH';
    delete?: 'DELETE' | 'POST';
    bulk?: 'POST' | 'DELETE';
  };
  
  /**
   * Map response data for different CRUD operations
   */
  responseMap?: {
    create?: (response: any) => any;
    update?: (response: any) => any;
    delete?: (response: any) => any;
    bulk?: (response: any) => any;
  };
}

// ==================== Table Theme Configuration ====================
export interface TableThemeConfig {
  /**
   * Theme mode - light or dark
   */
  theme?: 'light' | 'dark' | 'system';

  /**
   * Table style variant
   */
  variant?: 'default' | 'modern' | 'minimal' | 'bordered';
  
  /**
   * Color scheme for the table
   */
  colorScheme?: 'default' | 'primary' | 'neutral' | 'custom';
  
  /**
   * Border radius for the table and its components
   */
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  
  /**
   * Button style for action buttons
   */
  actionButtonVariant?: ButtonVariant;
  
  /**
   * Background color for the table header
   */
  headerBackground?: string;
  
  /**
   * Background color for rows on hover
   */
  rowHoverBackground?: string;
  
  /**
   * Background color for selected rows
   */
  selectedRowBackground?: string;
  
  /**
   * Custom colors for the table
   */
  customColors?: {
    primary?: string;
    secondary?: string;
    background?: string;
    border?: string;
    text?: string;
    heading?: string;
  };
}

// ==================== Event Handlers ====================
export interface EventHandlersConfig<T extends BaseTableData = BaseTableData> {
  onRowClick?: (row: T, index: number, event: React.MouseEvent<HTMLTableRowElement>) => void;
  onRowDoubleClick?: (row: T, index: number, event: React.MouseEvent<HTMLTableRowElement>) => void;
  onCellClick?: (row: T, column: TableColumn<T>, event: React.MouseEvent<HTMLTableCellElement>) => void;
  onPageChange?: (page: number, pageSize: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSortChange?: (sorting: SortConfig[]) => void;
  onFilterChange?: (filters: Record<string, any>) => void;
  onGlobalSearchChange?: (search: string) => void;
  onColumnVisibilityChange?: (visibleColumns: string[]) => void;
  onColumnReorder?: (columns: TableColumn<T>[]) => void;
  onSelectionChange?: (selectedRowKeys: (string | number)[], selectedRows: T[]) => void;
  onExpandChange?: (expandedRowKeys: (string | number)[], expandedRows: T[]) => void;
  onRefresh?: () => void;
  onCreate?: (data: any) => void;
  onUpdate?: (data: any, id?: string | number) => void;
  onDelete?: (id?: string | number) => void;
  onDataChange?: (data: T[]) => void;
  /**
   * Callback when a filter preset is saved
   */
  onFilterPresetSave?: (preset: any) => void;
}

// ==================== Main DataTable Props ====================
export interface DataTableProps<T extends BaseTableData = BaseTableData> {
  data: T[];
  columns: TableColumn<T>[];
  tableId?: string;
  title?: string;
  description?: string;
  loading?: boolean;
  loadingConfig?: LoadingConfig;
  pagination?: PaginationConfig | boolean;
  total?: number;
  serverPagination?: boolean;
  selection?: SelectionConfig;
  sorting?: SortConfig[];
  serverSorting?: boolean;
  filters?: FilterConfig[];
  filterValues?: Record<string, any>;
  serverFiltering?: boolean;
  globalSearch?: GlobalSearchConfig;
  actions?: ActionConfig<T>[];
  builtInActions?: BuiltInActionsConfig;
  bulkActions?: BulkActionConfig[];
  export?: ExportConfig | boolean;
  dialog?: DialogConfig;
  rowExpansion?: RowExpansionConfig;
  eventHandlers?: EventHandlersConfig<T>;
  serverData?: ServerDataConfig;
  className?: string;
  tableClassName?: string;
  size?: TableSize;
  striped?: boolean;
  bordered?: boolean;
  hover?: boolean;
  sticky?: boolean;
  resizable?: boolean;
  dragSortable?: boolean;
  columnReordering?: boolean;
  responsive?: boolean;
  virtualized?: boolean;
  accessible?: boolean;
  ariaLabel?: string;
  ariaDescription?: string;
  emptyStateRenderer?: () => React.ReactNode;
  errorStateRenderer?: (error: Error) => React.ReactNode;
  toolbarRenderer?: (defaultToolbar: React.ReactNode) => React.ReactNode;
  theme?: TableThemeConfig;
  animate?: boolean;
  /**
   * Settings for persisting table configuration
   */
  persistSettings?: {
    /**
     * Whether to use URL pathname as part of the storage key
     * @default true
     */
    useUrlAsKey?: boolean;
    /**
     * Custom identifier for this table when multiple tables exist on the same page
     * This will be added to the URL-based key if useUrlAsKey is true
     */
    tableIdentifier?: string;
    /**
     * Custom storage key override
     */
    persistKey?: string;
    /**
     * Callback when settings are changed
     */
    onChange?: (settings: any) => void;
  };
  /**
   * Advanced filtering options
   */
  filteringOptions?: {
    /**
     * Whether to use advanced filtering panel
     * @default false
     */
    advancedFiltering?: boolean;
    /**
     * Whether to allow saving filter presets
     * @default false
     */
    allowFilterPresets?: boolean;
    /**
     * Whether to allow complex filtering with AND/OR logic
     * @default false
     */
    allowComplexFilters?: boolean;
    /**
     * Whether to persist filters across sessions
     * @default false
     */
    persistFilters?: boolean;
    /**
     * Custom key for persisting filters
     */
    persistKey?: string;
    /**
     * Callback when filter presets change
     */
    onFilterPresetsChange?: (presets: any[]) => void;
  };
}

// ==================== Hook Types ====================

// useDataTable types
export interface UseDataTableOptions<T extends BaseTableData = BaseTableData> {
  data: T[];
  columns: TableColumn<T>[];
  tableId?: string;
  pagination?: PaginationConfig;
  total?: number;
  selection?: SelectionConfig;
  sorting?: SortConfig[];
  filters?: FilterConfig[];
  filterValues?: Record<string, any>;
  globalSearch?: GlobalSearchConfig | boolean;
  eventHandlers?: EventHandlersConfig<T>;
  serverData?: ServerDataConfig;
  serverPagination?: boolean;
  serverSorting?: boolean;
  serverFiltering?: boolean;
  serverSideOptions?: ServerSideFetchOptions<T>;
  persistOptions?: PersistStateOptions;
}

export interface UseDataTableReturn<T extends BaseTableData = BaseTableData> {
  table: TanStackTable<T>;
  data: T[];
  filteredData: T[];
  selectedRows: T[];
  loading: boolean;
  error: Error | null;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  sorting: SortConfig[];
  filters: Record<string, any>;
  globalFilter: string;
  selectedRowKeys: (string | number)[];
  columnVisibility: VisibilityState;
  expandedRowKeys: (string | number)[];
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSort: (field: string, direction: SortDirection) => void;
  setSorting: (sorting: SortConfig[]) => void;
  setFilter: (key: string, value: any) => void;
  setFilters: (filters: Record<string, any>) => void;
  clearFilters: () => void;
  setGlobalFilter: (value: string) => void;
  setSelectedRowKeys: (keys: (string | number)[]) => void;
  setExpandedRowKeys: (keys: (string | number)[]) => void;
  setColumnVisibility: (visibility: VisibilityState) => void;
  selectAll: () => void;
  selectNone: () => void;
  selectInvert: () => void;
  refresh: () => void;
  reset: () => void;
}

// useTableExport types
export interface UseTableExportOptions<T extends BaseTableData> {
  data: T[];
  columns: TableColumn<T>[];
  filteredData?: T[];
  filename?: string;
  title?: string;
  exportConfig?: ExportConfig | boolean;
}

export interface ExportOptions<T extends BaseTableData = BaseTableData> {
  includeHeaders?: boolean;
  customHeaders?: Record<string, string>;
  dateFormat?: string;
  numberFormat?: string;
  filterData?: (data: T[]) => T[];
  data?: T[];
}

// useColumnVisibility types
export interface UseColumnVisibilityOptions<T extends BaseTableData = BaseTableData> {
  columns: TableColumn<T>[];
  defaultVisibility?: Record<string, boolean>;
  defaultHidden?: string[];
  storageKey?: string;
  persist?: boolean;
  persistKey?: string;
  onVisibilityChange?: (visibility: Record<string, boolean>) => void;
}

export interface UseColumnVisibilityReturn<T extends BaseTableData = BaseTableData> {
  columns: TableColumn<T>[];
  hiddenColumns: string[];
  visibleColumns: TableColumn<T>[];
  toggleColumn: (columnId: string) => void;
  hideColumn: (columnId: string) => void;
  showColumn: (columnId: string) => void;
  hideAllColumns: () => void;
  showAllColumns: () => void;
  resetColumns: () => void;
  isColumnHidden: (columnId: string) => boolean;
  columnVisibility: Record<string, boolean>;
  toggleColumnVisibility: (columnId: string, value?: boolean) => void;
  toggleAllColumnsVisibility: (value: boolean) => void;
  resetColumnVisibility: () => void;
}

// ==================== Component Props Types ====================

// TablePagination props
export interface TablePaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  pageSizeOptions?: number[];
  showPageSizeOptions?: boolean;
  showJumpToPage?: boolean;
  showTotalRecords?: boolean;
  position?: TablePosition;
  totalLabel?: string;
  renderPagination?: (props: {
    currentPage: number;
    pageCount: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  }) => React.ReactNode;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  currentPage?: number;
  pageSize?: number;
  totalRecords?: number;
}

// TableHeader props
export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  className?: string;
  sticky?: boolean;
  renderHeaderCell?: (column: Header<any, unknown>, index: number) => React.ReactNode;
}

// ColumnVisibilityToggle props
export interface ColumnVisibilityToggleProps<T extends BaseTableData = BaseTableData> {
  columns: TableColumn<T>[];
  visibility: {
    columnVisibility: Record<string, boolean>;
    toggleColumnVisibility: (columnId: string, value?: boolean) => void;
    toggleAllColumnsVisibility: (value: boolean) => void;
    resetColumnVisibility: () => void;
    visibleColumns: TableColumn<T>[];
    hiddenColumns: string[];
  };
  onToggleVisibility: (columnId: string) => void;
  onToggleAll: (show: boolean) => void;
  onReset: () => void;
}

// ServerSideFetchOptions
export interface ServerSideFetchOptions<T> {
  onDataFetch?: (options: {
    pageIndex: number;
    pageSize: number;
    filters: Record<string, any>;
    sorting: SortingState;
    globalFilter: string;
  }) => Promise<{
    data: T[];
    totalCount: number;
  }>;
  enabled?: boolean;
  initialSorting?: SortingState;
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
  keepPreviousData?: boolean;
}

// PersistStateOptions
export interface PersistStateOptions {
  enabled?: boolean;
  storageType?: 'localStorage' | 'sessionStorage' | 'server';
  key?: string;
  include?: Array<keyof DataTableState<any>>;
}

// DataTableState
export interface DataTableState<T> {
  pagination: PaginationState;
  sorting: SortingState;
  columnFilters?: ColumnFiltersState;
  filters?: Record<string, any>;
  columnVisibility: VisibilityState;
  rowSelection: RowSelectionState;
  globalFilter: string;
  expandedRows?: Record<string, boolean>;
}

// TableDialog props
export type DialogType = 'create' | 'edit' | 'delete' | 'view' | 'custom';

export interface TableDialogProps {
  open: boolean;
  type: DialogType;
  title?: string;
  description?: string;
  data?: any;
  onClose: () => void;
  onSubmit?: (data: any) => void;
  loading?: boolean;
  children?: React.ReactNode;
}

// Localization Strings
export interface DataTableLocalization {
  search?: string;
  filter?: string;
  filterTitle?: string;
  clearFilters?: string;
  noResults?: string;
  loading?: string;
  error?: string;
  rowsPerPage?: string;
  rowsOf?: string;
  showingRows?: string;
  selected?: string;
  selectAll?: string;
  exportTitle?: string;
  columnVisibility?: string;
  rowActions?: string;
  bulkActions?: string;
  pagination?: {
    first?: string;
    previous?: string;
    next?: string;
    last?: string;
    ofPages?: string;
  };
}
