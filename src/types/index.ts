/**
 * Enhanced type definitions for react-table-power
 * Comprehensive TypeScript support with generics and advanced types
 */

// Re-export existing types
export * from './utilities';

// Enhanced form types
export * from './forms';

// Advanced TypeScript utilities
export * from './advanced';

// Component type definitions
export * from './components';

// Legacy types for backward compatibility
export type {
  DialogMode,
  DialogType,
  BaseTableData,
  LoadingType,
  LoadingVariant,
  SpinnerType,
  SpinnerSize,
  TableThemeConfig,
  TableSize,
  DialogConfig
} from './utilities';

// Re-export commonly used types for convenience
export type {
  // Form system
  DialogFormMode,
  FormAdapter,
  FormAdapterResult,
  FormAPI,
  FormState,
  FormRenderContext,
  FormValidationError,
  FormSubmissionResult,
  
  // Advanced types
  InferSchema,
  SchemaFormData,
  DeepPartial,
  DeepRequired,
  FieldPath,
  FieldValue,
  TypedFormAPI,
  TypedDialogFormProps,
  TypedFormRenderContext,
  
  // Component types
  BaseComponentProps,
  BaseDialogProps,
  BaseFieldProps,
  InputFieldProps,
  SelectFieldProps,
  CheckboxFieldProps,
  ButtonProps,
  FormTableColumn,
  CrudTableProps,
  FormWizardStep,
  DialogSize,
  ButtonVariant,
  ButtonSize,
  
  // Refs
  FormRef,
  DialogRef,
  TableRef
} from './forms';

/**
 * Utility type for creating strongly-typed table components
 */
export interface TypedTableConfig<T> {
  data: T[];
  keyField: keyof T;
  columns: Array<{
    key: keyof T;
    title: string;
    sortable?: boolean;
    filterable?: boolean;
    render?: (value: T[keyof T], record: T, index: number) => React.ReactNode;
  }>;
}

/**
 * Enhanced dialog configuration with type safety
 */
export interface TypedDialogConfig<T> {
  title: string;
  description?: string;
  data?: T;
  onSubmit?: (data: T) => Promise<boolean> | boolean;
  onCancel?: () => void;
  validation?: (data: T) => Record<string, string> | null;
}

/**
 * Form field configuration with validation
 */
export interface FormFieldConfig<T = any> {
  name: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'checkbox' | 'textarea' | 'date';
  label?: string;
  placeholder?: string;
  required?: boolean;
  validation?: (value: T) => string | null;
  options?: Array<{ label: string; value: T }>;
  defaultValue?: T;
}

/**
 * Table action configuration
 */
export interface TableActionConfig<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (record: T, index: number) => void;
  disabled?: (record: T) => boolean;
  hidden?: (record: T) => boolean;
  variant?: 'primary' | 'secondary' | 'destructive';
}

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: boolean;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

/**
 * Filter configuration
 */
export interface FilterConfig<T = any> {
  key: keyof T;
  type: 'text' | 'select' | 'date' | 'number' | 'boolean';
  label: string;
  options?: Array<{ label: string; value: any }>;
  operator?: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
}

/**
 * Sort configuration
 */
export interface SortConfig<T = any> {
  key: keyof T;
  direction: 'asc' | 'desc';
}

/**
 * Enhanced table configuration
 */
export interface EnhancedTableConfig<T> extends TypedTableConfig<T> {
  // Selection
  selectable?: boolean;
  selectedRows?: (string | number)[];
  onSelectionChange?: (selectedRows: (string | number)[]) => void;
  
  // Pagination
  pagination?: PaginationConfig | boolean;
  
  // Filtering
  filterable?: boolean;
  filters?: FilterConfig<T>[];
  onFilterChange?: (filters: any) => void;
  
  // Sorting
  sortable?: boolean;
  defaultSort?: SortConfig<T>;
  onSortChange?: (sort: SortConfig<T>) => void;
  
  // Actions
  actions?: TableActionConfig<T>[];
  bulkActions?: TableActionConfig<T>[];
  
  // Loading and empty states
  loading?: boolean;
  empty?: React.ReactNode;
  error?: string | Error | null;
  
  // Styling
  striped?: boolean;
  bordered?: boolean;
  hoverable?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Theme configuration
 */
export interface ThemeConfig {
  primaryColor?: string;
  secondaryColor?: string;
  dangerColor?: string;
  successColor?: string;
  warningColor?: string;
  infoColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderRadius?: string;
  fontSize?: string;
  fontFamily?: string;
  spacing?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
}

/**
 * Responsive breakpoint configuration
 */
export interface BreakpointConfig {
  xs?: number; // Mobile
  sm?: number; // Tablet
  md?: number; // Desktop
  lg?: number; // Large desktop
  xl?: number; // Extra large desktop
}

/**
 * Animation configuration
 */
export interface AnimationConfig {
  duration?: number;
  easing?: string;
  disabled?: boolean;
}

/**
 * Accessibility configuration
 */
export interface AccessibilityConfig {
  announceChanges?: boolean;
  keyboardNavigation?: boolean;
  highContrast?: boolean;
  focusVisible?: boolean;
  skipLinks?: boolean;
}

/**
 * Provider configuration for the entire library
 */
export interface ReactTablePowerConfig {
  theme?: ThemeConfig;
  breakpoints?: BreakpointConfig;
  animations?: AnimationConfig;
  accessibility?: AccessibilityConfig;
  defaultFormAdapter?: any;
  locale?: string;
  dateFormat?: string;
  numberFormat?: string;
}

/**
 * Context types
 */
export interface TableContext<T = any> {
  data: T[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  config: EnhancedTableConfig<T>;
}

export interface FormContext<T = any> {
  data: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  dirty: boolean;
  valid: boolean;
  submitting: boolean;
  setValue: (field: string, value: any) => void;
  setError: (field: string, error: string) => void;
  clearError: (field: string) => void;
  submit: () => Promise<void>;
  reset: () => void;
}

export interface DialogContext {
  open: boolean;
  mode: DialogFormMode | null;
  data: any;
  loading: boolean;
  error: string | null;
  openDialog: (mode: DialogFormMode, data?: any) => void;
  closeDialog: () => void;
}

/**
 * Hook return types
 */
export interface UseTableReturn<T = any> {
  data: T[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  pagination: PaginationConfig;
  sorting: SortConfig<T>;
  filters: Record<string, any>;
  selection: (string | number)[];
  actions: {
    selectRow: (id: string | number) => void;
    selectAll: () => void;
    clearSelection: () => void;
    sort: (key: keyof T, direction?: 'asc' | 'desc') => void;
    filter: (filters: Record<string, any>) => void;
    paginate: (page: number, pageSize?: number) => void;
  };
}

export interface UseFormReturn<T = any> {
  data: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  dirty: boolean;
  valid: boolean;
  submitting: boolean;
  actions: {
    setValue: (field: string, value: any) => void;
    setValues: (values: Partial<T>) => void;
    setError: (field: string, error: string) => void;
    clearError: (field: string) => void;
    clearErrors: () => void;
    submit: () => Promise<void>;
    reset: () => void;
    validate: () => Promise<boolean>;
  };
}

export interface UseDialogReturn {
  open: boolean;
  mode: DialogFormMode | null;
  data: any;
  loading: boolean;
  error: string | null;
  actions: {
    openCreate: (data?: any) => void;
    openEdit: (data: any) => void;
    openView: (data: any) => void;
    openDelete: (data: any) => void;
    close: () => void;
    submit: (data: any) => Promise<void>;
  };
}

export default {};
