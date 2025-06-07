/**
 * Utilities for handling type conversions between strings and objects
 */

/**
 * Converts a string value to an object that satisfies Record<string, any>
 * This is useful when APIs expect objects but you have string values
 */
export function stringToRecord(value: string, fieldName: string = 'value'): Record<string, any> {
  return { [fieldName]: value };
}

/**
 * Converts simple values to properly typed objects for form submissions
 */
export function toFormData(value: string | number | boolean | null | undefined): Record<string, any> {
  if (value === null || value === undefined) {
    return {};
  }
  
  if (typeof value === 'object') {
    return value as Record<string, any>;
  }
  
  return { value };
}

/**
 * Converts error messages to proper error objects
 */
export function toErrorObject(errorMessage: string | Error | Record<string, any>): Record<string, any> {
  if (typeof errorMessage === 'string') {
    return { _error: errorMessage };
  }
  
  if (errorMessage instanceof Error) {
    return { 
      _error: errorMessage.message,
      _originalError: errorMessage
    };
  }
  
  return errorMessage as Record<string, any>;
}

/**
 * Safely ensures a value is a record object
 * This is useful for form submission handlers that expect objects
 */
export function ensureRecord(value: any): Record<string, any> {
  if (value === null || value === undefined) {
    return {};
  }
  
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  
  // For arrays, strings, numbers, booleans
  return { value };
}

/**
 * Utility functions for type conversion and validation integration
 */

/**
 * Safely convert any value to a string
 */
export function safeString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[object Object]';
    }
  }
  return String(value);
}

/**
 * Safely convert any value to a number
 */
export function safeNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return isNaN(value) ? null : value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

/**
 * Safely convert any value to a boolean
 */
export function safeBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }
  if (typeof value === 'number') return value !== 0;
  return Boolean(value);
}

/**
 * Extract error messages from various validation error formats
 */
export function extractValidationErrors(errors: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  
  if (!errors || typeof errors !== 'object') {
    return result;
  }
  
  // Handle Zod errors
  if ('issues' in errors && Array.isArray((errors as any).issues)) {
    (errors as any).issues.forEach((issue: any) => {
      if (issue.path && issue.message) {
        const path = Array.isArray(issue.path) ? issue.path.join('.') : String(issue.path);
        result[path] = issue.message;
      }
    });
    return result;
  }
  
  // Handle Yup errors
  if ('inner' in errors && Array.isArray((errors as any).inner)) {
    (errors as any).inner.forEach((error: any) => {
      if (error.path && error.message) {
        result[error.path] = error.message;
      }
    });
    return result;
  }
  
  // Handle object with string values (common format)
  if (typeof errors === 'object') {
    Object.entries(errors).forEach(([key, value]) => {
      if (typeof value === 'string') {
        result[key] = value;
      } else if (value && typeof value === 'object' && 'message' in value) {
        result[key] = String((value as any).message);
      }
    });
  }
  
  return result;
}

/**
 * Transform form data based on schema or field types
 */
export function transformFormData(data: Record<string, any>, fieldTypes?: Record<string, string>): Record<string, any> {
  if (!data || typeof data !== 'object') return {};
  
  const result: Record<string, any> = {};
  
  Object.entries(data).forEach(([key, value]) => {
    const fieldType = fieldTypes?.[key];
    
    switch (fieldType) {
      case 'number':
        result[key] = safeNumber(value);
        break;
      case 'boolean':
        result[key] = safeBoolean(value);
        break;
      case 'string':
        result[key] = safeString(value);
        break;
      default:
        result[key] = value;
    }
  });
  
  return result;
}
