/**
 * Type utilities for safely handling values with TypeScript
 */

/**
 * Safely convert any value to string
 */
export function safeToString(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'object') {
    return value.toString ? value.toString() : JSON.stringify(value);
  }
  
  return String(value);
}

/**
 * Check if a value is a Date object
 */
export function isDate(value: any): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Safely convert value to Date or return null if invalid
 */
export function safeToDate(value: any): Date | null {
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return !isNaN(date.getTime()) ? date : null;
  }
  
  return null;
}

/**
 * Utility functions for type operations and data access
 */

/**
 * Safely get a property value from an object using a string key path
 * Supports nested property access like 'user.profile.name'
 */
export function getPropertyValue(obj: any, path: string | number | symbol): any {
  if (!obj || path === undefined || path === null) {
    return undefined;
  }

  const pathStr = String(path);
  
  // Handle simple property access
  if (!pathStr.includes('.')) {
    return obj[pathStr];
  }

  // Handle nested property access
  return pathStr.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

/**
 * Type-safe way to get a nested property value from an object using a path string
 * Supports dot notation (e.g. 'user.address.street')
 * 
 * @param obj The object to get the value from
 * @param path The property path (e.g. 'user.name' or 'items[0].title')
 * @param defaultValue Value to return if the path doesn't exist
 * @returns The value at the path or defaultValue if not found
 */
export function getNestedValue<T = any>(obj: any, path: string, defaultValue?: T): T | undefined {
  try {
    // Return undefined for undefined/null objects
    if (obj === undefined || obj === null) return defaultValue;

    // Handle simple property access
    if (typeof path !== 'string' || path.trim() === '') return obj;

    // Handle array syntax like 'items[0]'
    const sanitizedPath = path.replace(/\[(\w+)\]/g, '.$1');
    const parts = sanitizedPath.split('.');
    
    // Start with the object
    let current = obj;
    
    // Navigate through the path
    for (const part of parts) {
      if (part.trim() === '') continue;
      
      // Return undefined if we hit a null/undefined value before the end
      if (current === undefined || current === null) return defaultValue;
      
      // Get the next level
      current = current[part];
    }
    
    return current !== undefined ? current : defaultValue;
  } catch (error) {
    console.error(`Error getting nested value for path '${path}':`, error);
    return defaultValue;
  }
}

/**
 * Utility function to set a property value on an object
 * Supports dot notation for nested properties
 */
export function setPropertyValue(obj: any, path: string, value: any): void {
  if (!obj || !path) {
    return;
  }

  const keys = path.split('.');
  const lastKey = keys.pop()!;
  let current = obj;

  // Navigate to the parent object
  for (const key of keys) {
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }

  // Set the final value
  current[lastKey] = value;
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Utility function to generate a unique ID
 */
export function generateId(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if a value is an object (and not null)
 */
export function isObject(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Type guard to check if a value is an array
 */
export function isArray<T>(value: unknown): value is Array<T> {
  return Array.isArray(value);
}

/**
 * Type guard to check if a string value is empty
 */
export function isEmptyString(value: unknown): value is '' {
  return typeof value === 'string' && value.trim() === '';
}

/**
 * Type guard to check if a value is null or undefined
 */
export function isNullOrUndefined(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Type guard to check if a value is a function
 */
export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

/**
 * Formats a value based on its type for display in a table
 */
export function formatValueForDisplay(value: unknown): string {
  if (isNullOrUndefined(value) || isEmptyString(value)) {
    return '';
  }

  if (value instanceof Date) {
    return value.toLocaleString();
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (isObject(value) || isArray(value)) {
    try {
      return JSON.stringify(value);
    } catch (error) {
      return '[Complex Object]';
    }
  }

  return String(value);
}

/**
 * Converts a value to a string representation for search/filter operations
 */
export function valueToString(value: unknown): string {
  if (isNullOrUndefined(value)) {
    return '';
  }

  if (typeof value === 'string') {
    return value.toLowerCase();
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value).toLowerCase();
  }

  if (value instanceof Date) {
    return value.toISOString().toLowerCase();
  }

  if (isObject(value) || isArray(value)) {
    try {
      return JSON.stringify(value).toLowerCase();
    } catch (error) {
      return '';
    }
  }

  return String(value).toLowerCase();
}

/**
 * Safely check if two values are equal, handling null/undefined cases
 */
export function safeEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  
  if (isDate(a) && isDate(b)) {
    return a.getTime() === b.getTime();
  }
  
  if (typeof a === 'object' && typeof b === 'object') {
    const aString = JSON.stringify(a);
    const bString = JSON.stringify(b);
    return aString === bString;
  }
  
  return String(a) === String(b);
}

/**
 * Safely compare two dates
 */
export function compareDates(rowValue: any, filterValue: any): boolean {
  const dateValue = safeToDate(rowValue);
  if (!dateValue) return false;
  
  // If filter value is a date range
  if (Array.isArray(filterValue) && filterValue.length === 2) {
    const [start, end] = filterValue;
    const startDate = start ? safeToDate(start) : null;
    const endDate = end ? safeToDate(end) : null;
    
    if (startDate && endDate) {
      // Both start and end dates are provided
      return dateValue >= startDate && dateValue <= endDate;
    } else if (startDate) {
      // Only start date is provided
      return dateValue >= startDate;
    } else if (endDate) {
      // Only end date is provided
      return dateValue <= endDate;
    }
    return true;
  }
  
  // If filter value is a single date
  const filterDate = safeToDate(filterValue);
  if (!filterDate) return false;
  
  // Compare dates without time
  const rowDateString = dateValue.toDateString();
  const filterDateString = filterDate.toDateString();
  
  return rowDateString === filterDateString;
}

/**
 * Safely convert a value to string for display
 */
export function safeStringify(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[Object]';
    }
  }
  return String(value);
}

/**
 * Create a unique ID for table rows
 */
export function createRowId(row: any, index: number): string | number {
  if (row.id !== undefined) return row.id;
  if (row._id !== undefined) return row._id;
  if (row.key !== undefined) return row.key;
  return `row-${index}`;
}

/**
 * Type guard to check if a value is a React element
 */
export function isReactElement(value: any): value is React.ReactElement {
  return value && typeof value === 'object' && value.$$typeof === Symbol.for('react.element');
}

/**
 * Debounce function for search and filter inputs
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Utility function to convert a value to a specific type
 * 
 * @param value The value to convert
 * @param type The target type ('string', 'number', 'boolean', 'date', etc.)
 * @returns The converted value
 */
export function convertType(value: any, type: string): any {
  if (value === null || value === undefined) return value;
  
  switch (type.toLowerCase()) {
    case 'string':
      return safeToString(value);
      
    case 'number':
      const num = Number(value);
      return isNaN(num) ? value : num;
      
    case 'boolean':
      if (typeof value === 'string') {
        const lowered = value.toLowerCase();
        return lowered === 'true' || lowered === '1' || lowered === 'yes';
      }
      return Boolean(value);
      
    case 'date':
      if (value instanceof Date) return value;
      const date = new Date(value);
      return isNaN(date.getTime()) ? value : date;
      
    default:
      return value;
  }
}

/**
 * Determine if a value is a plain object (not null, an array, or a function)
 * 
 * @param value The value to check
 * @returns True if the value is a plain object
 */
export function isPlainObject(value: any): boolean {
  if (value === null || value === undefined) return false;
  return Object.prototype.toString.call(value) === '[object Object]';
}

/**
 * Deep clone an object
 * 
 * @param obj The object to clone
 * @returns A deep clone of the object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  return JSON.parse(JSON.stringify(obj));
}