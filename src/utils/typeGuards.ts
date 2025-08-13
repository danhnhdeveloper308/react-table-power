/**
 * Type guards and validation utilities for react-table-power
 */

import { BaseTableData, StrictTableData, CellValue, ValidationResult, ValidationError } from '../types';

// ==================== Basic Type Guards ====================

/**
 * Check if a value is a valid table data object
 */
export function isTableData(value: unknown): value is BaseTableData {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

/**
 * Check if table data has a valid ID
 */
export function hasValidId(data: BaseTableData): data is StrictTableData {
  return (
    data.id !== undefined &&
    data.id !== null &&
    (typeof data.id === 'string' || typeof data.id === 'number') &&
    data.id !== ''
  );
}

/**
 * Check if a value is a valid cell value
 */
export function isValidCellValue(value: unknown): value is CellValue {
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
 * Check if a string is a valid accessor key for a data object
 */
export function isValidAccessorKey<T extends BaseTableData>(
  key: string,
  data: T
): key is keyof T {
  return key in data;
}

/**
 * Check if an array contains only valid table data
 */
export function isValidTableDataArray(value: unknown): value is BaseTableData[] {
  return (
    Array.isArray(value) &&
    value.every(isTableData)
  );
}

// ==================== Validation Functions ====================

/**
 * Validate an array of table data
 */
export function validateTableData<T extends BaseTableData>(
  data: T[],
  options: ValidationOptions = {}
): ValidationResult {
  const errors: ValidationError[] = [];
  const { requireId = false, checkDuplicateIds = true } = options;

  // Check if data is an array
  if (!Array.isArray(data)) {
    errors.push({
      field: 'root',
      message: 'Data must be an array',
      severity: 'error'
    });
    return { isValid: false, errors };
  }

  // Validate each row
  data.forEach((row, index) => {
    if (!isTableData(row)) {
      errors.push({
        field: 'root',
        message: `Row ${index} is not a valid object`,
        rowIndex: index,
        severity: 'error'
      });
      return;
    }

    if (requireId && !hasValidId(row)) {
      errors.push({
        field: 'id',
        message: `Row ${index} is missing a valid ID`,
        rowIndex: index,
        severity: 'error'
      });
    }
  });

  // Check for duplicate IDs
  if (checkDuplicateIds) {
    const ids = new Set<string | number>();
    data.forEach((row, index) => {
      if (hasValidId(row)) {
        if (ids.has(row.id)) {
          errors.push({
            field: 'id',
            message: `Duplicate ID found: ${row.id}`,
            rowIndex: index,
            severity: 'error'
          });
        }
        ids.add(row.id);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate column configuration
 */
export function validateColumns<T extends BaseTableData>(
  columns: any[],
  sampleData?: T[]
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!Array.isArray(columns)) {
    errors.push({
      field: 'columns',
      message: 'Columns must be an array',
      severity: 'error'
    });
    return { isValid: false, errors };
  }

  columns.forEach((column, index) => {
    if (!column || typeof column !== 'object') {
      errors.push({
        field: 'columns',
        message: `Column ${index} is not a valid object`,
        severity: 'error'
      });
      return;
    }

    if (!column.accessorKey && !column.id) {
      errors.push({
        field: 'columns',
        message: `Column ${index} must have either accessorKey or id`,
        severity: 'error'
      });
    }

    // Validate accessor key against sample data
    if (sampleData && sampleData.length > 0 && column.accessorKey) {
      const sampleRow = sampleData[0];
      if (!isValidAccessorKey(column.accessorKey, sampleRow)) {
        errors.push({
          field: 'columns',
          message: `Column ${index} accessorKey "${column.accessorKey}" not found in data`,
          severity: 'warning'
        });
      }
    }
  });

  return {
    isValid: errors.filter(e => e.severity === 'error').length === 0,
    errors
  };
}

// ==================== Type Assertion Functions ====================

/**
 * Assert that a value is valid table data, throw if not
 */
export function assertTableData(value: unknown): asserts value is BaseTableData {
  if (!isTableData(value)) {
    throw new Error('Value is not valid table data');
  }
}

/**
 * Assert that data array is valid, throw if not
 */
export function assertValidTableDataArray<T extends BaseTableData>(
  value: unknown
): asserts value is T[] {
  if (!isValidTableDataArray(value)) {
    throw new Error('Value is not a valid table data array');
  }
}

/**
 * Assert that a table data object has a valid ID
 */
export function assertHasValidId(data: BaseTableData): asserts data is StrictTableData {
  if (!hasValidId(data)) {
    throw new Error('Table data must have a valid ID');
  }
}

// ==================== Helper Types ====================

export interface ValidationOptions {
  readonly requireId?: boolean;
  readonly checkDuplicateIds?: boolean;
  readonly allowEmptyStrings?: boolean;
  readonly strictMode?: boolean;
}

// ==================== Data Transformation Utilities ====================

/**
 * Safely get a nested property value
 */
export function getNestedValue<T extends Record<string, any>>(
  obj: T,
  path: string
): unknown {
  return path.split('.').reduce((current, key) => {
    return current && typeof current === 'object' ? current[key] : undefined;
  }, obj);
}

/**
 * Type-safe property getter
 */
export function getProperty<T extends BaseTableData, K extends keyof T>(
  obj: T,
  key: K
): T[K] {
  return obj[key];
}

/**
 * Create a type-safe row ID getter
 */
export function createRowIdGetter<T extends BaseTableData>(
  getRowId?: (row: T, index: number) => string | number
) {
  return (row: T, index: number): string | number => {
    if (getRowId) {
      return getRowId(row, index);
    }
    
    if (hasValidId(row)) {
      return row.id;
    }
    
    return index;
  };
}

/**
 * Type-safe object key checker
 */
export function hasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return key in obj;
}

/**
 * Create a type-safe column accessor function
 */
export function createAccessor<T extends BaseTableData, K extends keyof T>(
  key: K
) {
  return (row: T): T[K] => row[key];
}
