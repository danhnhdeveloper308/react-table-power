/**
 * Advanced TypeScript utility types for react-table-power
 */

// ==================== Advanced Utility Types ====================

/**
 * Make all properties readonly recursively
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Make specific keys required
 */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make specific keys optional
 */
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Extract the value type from an accessor key
 */
export type AccessorValue<T, K extends keyof T> = T[K];

/**
 * Create a type that ensures all keys of T are covered
 */
export type ExhaustiveKeys<T, U extends keyof T = keyof T> = U;

/**
 * Union type for all possible data types in a table cell
 */
export type CellValue = string | number | boolean | Date | null | undefined;

/**
 * Type guard for checking if a value is a valid cell value
 */
export function isCellValue(value: unknown): value is CellValue {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value instanceof Date ||
    value === null ||
    value === undefined
  );
}

/**
 * Extract column keys that have specific value types
 */
export type ColumnsOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * Get only the string keys of an object
 */
export type StringKeys<T> = Extract<keyof T, string>;

/**
 * Get only the number keys of an object
 */
export type NumberKeys<T> = Extract<keyof T, number>;

/**
 * Create a type with only sortable columns
 */
export type SortableColumns<T> = ColumnsOfType<T, string | number | Date>;

/**
 * Create a type with only filterable columns
 */
export type FilterableColumns<T> = keyof T;

/**
 * Type for function that validates table data
 */
export type DataValidator<T> = (data: T[]) => ValidationResult;

/**
 * Validation result interface
 */
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly ValidationError[];
}

/**
 * Validation error interface
 */
export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly rowIndex?: number;
  readonly severity: 'error' | 'warning';
}

/**
 * Type for action permission checker
 */
export type PermissionChecker = (permission: string, context?: any) => boolean;

/**
 * Type for theme customization
 */
export type ThemeCustomizer<T = Record<string, any>> = (defaultTheme: T) => T;

/**
 * Type for column configuration builder
 */
export type ColumnBuilder<T> = {
  [K in keyof T]: {
    key: K;
    header?: string;
    sortable?: boolean;
    filterable?: boolean;
    width?: number | string;
  };
};

/**
 * Type-safe event emitter
 */
export interface TypedEventEmitter<T extends Record<string, any[]>> {
  on<K extends keyof T>(event: K, listener: (...args: T[K]) => void): void;
  off<K extends keyof T>(event: K, listener: (...args: T[K]) => void): void;
  emit<K extends keyof T>(event: K, ...args: T[K]): void;
}

/**
 * Table events map for type-safe event handling
 */
export interface TableEvents<T> {
  'row:click': [row: T, index: number];
  'row:select': [selectedRows: T[]];
  'data:change': [newData: T[]];
  'sort:change': [sortConfig: { field: keyof T; direction: 'asc' | 'desc' }];
  'filter:change': [filters: Record<string, any>];
  'pagination:change': [page: number, pageSize: number];
}

/**
 * Type for creating strongly typed table hooks
 */
export type TypedTableHook<T> = () => {
  data: readonly T[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  updateRow: (id: T extends { id: infer ID } ? ID : string | number, updates: Partial<T>) => Promise<void>;
  deleteRow: (id: T extends { id: infer ID } ? ID : string | number) => Promise<void>;
  createRow: (newRow: Omit<T, 'id'>) => Promise<void>;
};

/**
 * Conditional type for async operations
 */
export type MaybeAsync<T> = T | Promise<T>;

/**
 * Type for table action handlers with proper error handling
 */
export type ActionHandler<T, TResult = void> = (
  data: T,
  context?: ActionContext
) => MaybeAsync<ActionResult<TResult>>;

/**
 * Action context for providing additional information to handlers
 */
export interface ActionContext {
  readonly tableId?: string;
  readonly permissions?: readonly string[];
  readonly user?: any;
  readonly metadata?: Record<string, any>;
}

/**
 * Result of an action with success/error handling
 */
export type ActionResult<T = void> = 
  | { success: true; data: T; message?: string }
  | { success: false; error: string; details?: any };

/**
 * Type for creating type-safe form schemas
 */
export type FormSchema<T> = {
  [K in keyof T]?: {
    type: 'text' | 'number' | 'email' | 'password' | 'select' | 'checkbox' | 'date';
    label?: string;
    required?: boolean;
    validation?: (value: T[K]) => string | null;
    options?: T[K] extends string ? readonly string[] : never;
  };
};

/**
 * Type for table column definitions with strict typing
 */
export type StrictColumnDef<T, K extends keyof T = keyof T> = {
  key: K;
  header: string;
  accessor: (row: T) => T[K];
  sortable?: boolean;
  filterable?: boolean;
  exportable?: boolean;
  width?: number | string;
  render?: (value: T[K], row: T) => React.ReactNode;
};
