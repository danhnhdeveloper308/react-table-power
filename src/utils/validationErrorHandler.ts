/**
 * Comprehensive validation error handler for multiple validation libraries
 * Provides special handling for Zod, Yup, Joi, React Hook Form, Formik, and more
 */

// Type definitions for different validation libraries
interface ZodIssue {
  code: string;
  path: (string | number)[];
  message: string;
  expected?: string;
  received?: string;
}

interface ZodError {
  issues: ZodIssue[];
  errors?: ZodIssue[];
  format?: () => Record<string, any>;
  name?: string;
  message?: string;
}

interface YupValidationError {
  inner: Array<{
    path: string;
    message: string;
    params?: Record<string, any>;
  }>;
  errors?: string[];
  message?: string;
}

interface JoiValidationError {
  details: Array<{
    message: string;
    path: string[];
    type: string;
  }>;
  message?: string;
}

interface ReactHookFormError {
  type: string;
  message?: string;
  ref?: any;
}

/**
 * Specifically detect Zod errors - improved detection logic with debug logging
 */
export function isZodError(error: unknown): error is ZodError {
  // For debugging - helps identify what type of error we're dealing with
  if (error && typeof error === 'object') {
    const errorObj = error as any;
    
    // Check for Zod error constructor name
    if (errorObj.constructor && errorObj.constructor.name === 'ZodError') {
      console.log("✓ Identified Zod error by constructor name");
      return true;
    }
    
    // Check for Zod's issues array structure
    if ('issues' in errorObj && Array.isArray(errorObj.issues)) {
      console.log("✓ Identified Zod error by issues array");
      
      // Log the issues to help diagnose the structure
      console.log("Zod validation issues:", errorObj.issues);
      return true;
    }
    
    // Check for 'zodError' property - some wrappers might include this
    if ('zodError' in errorObj) {
      console.log("✓ Identified Zod error by zodError property");
      return true;
    }
    
    // Examine the error structure to help debugging
    console.log("Error object structure:", Object.keys(errorObj));
    
    // Check for errors property that might contain the Zod issues
    if ('errors' in errorObj) {
      console.log("Error contains 'errors' property:", errorObj.errors);
    }
    
    // Check for Zod's format method - a unique feature of Zod errors
    if (typeof errorObj.format === 'function') {
      console.log("✓ Identified Zod error by format method");
      return true;
    }
  }
  
  return false;
}

export function isYupError(error: unknown): error is YupValidationError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('inner' in error && Array.isArray((error as any).inner))
  );
}

export function isJoiError(error: unknown): error is JoiValidationError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('details' in error && Array.isArray((error as any).details))
  );
}

export function isReactHookFormError(error: unknown): error is ReactHookFormError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'ref' in error
  );
}

/**
 * Extract error message from any error object
 * @param error Any error type
 * @returns A human-readable error message
 */
export function extractErrorMessage(error: unknown): string {
  if (!error) return '';

  // Handle string errors directly
  if (typeof error === 'string') {
    return error;
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message || 'An error occurred';
  }

  // Handle objects with error messages
  if (typeof error === 'object' && error !== null) {
    // Extract from React Hook Form field error objects
    if (isReactHookFormError(error)) {
      return typeof error.message === 'string' ? error.message : `Field validation failed: ${error.type}`;
    }

    // Extract from objects with message property
    if ('message' in error && typeof (error as any).message === 'string') {
      return (error as any).message;
    }

    // Zod specific error handling
    if (isZodError(error)) {
      if (Array.isArray((error as ZodError).issues) && (error as ZodError).issues.length > 0) {
        // Return first issue's message
        return (error as ZodError).issues[0].message || 'Validation failed';
      }
      return (error as ZodError).message || 'Zod validation failed';
    }

    // Yup errors
    if (isYupError(error)) {
      if (Array.isArray((error as YupValidationError).inner) && (error as YupValidationError).inner.length > 0) {
        return (error as YupValidationError).inner[0].message || 'Validation failed';
      }
      return (error as YupValidationError).message || 'Yup validation failed';
    }

    // Joi errors
    if (isJoiError(error)) {
      if (Array.isArray((error as JoiValidationError).details) && (error as JoiValidationError).details.length > 0) {
        return (error as JoiValidationError).details[0].message || 'Validation failed';
      }
      return (error as JoiValidationError).message || 'Joi validation failed';
    }

    // Try to stringify the error
    try {
      return JSON.stringify(error);
    } catch {
      return 'An unknown error occurred';
    }
  }

  // For all other types
  return String(error);
}

/**
 * Format an error message for display
 * @param error Any error type
 * @returns A formatted error message for UI display
 */
export function formatErrorForDisplay(error: unknown): string {
  return extractErrorMessage(error);
}

/**
 * Create path string from array path (used by Zod)
 * @param path Array path from Zod issues
 * @returns Dot notation path string
 */
function createPathString(path: (string | number)[]): string {
  if (path.length === 0) return '';
  
  return path.reduce((result, segment, index) => {
    if (index === 0) return String(segment);
    if (typeof segment === 'number') return `${result}[${segment}]`;
    return `${result}.${segment}`;
  }, '') as string;
}

/**
 * Special handler for Zod errors
 * @param error Zod error object
 * @returns Record with field names as keys and error messages as values
 */
function extractZodErrors(error: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  
  // Log that we're in the Zod error extractor
  console.log("Extracting Zod errors...");
  
  if (!error || typeof error !== 'object') {
    console.log("Invalid error object for Zod extraction");
    return result;
  }
  
  // Access the errors safely
  const zodError = error as any;
  
  // Try to get issues array
  let issues: any[] = [];
  
  if ('issues' in zodError && Array.isArray(zodError.issues)) {
    issues = zodError.issues;
    console.log("Found Zod issues array:", issues.length, "items");
  } else if ('errors' in zodError && Array.isArray(zodError.errors)) {
    issues = zodError.errors;
    console.log("Found Zod errors array:", issues.length, "items");
  } else if ('zodError' in zodError && zodError.zodError && 'issues' in zodError.zodError) {
    issues = zodError.zodError.issues;
    console.log("Found nested Zod issues array:", issues.length, "items");
  }
  
  // Process each issue
  issues.forEach(issue => {
    // Log the issue structure to help with debugging
    console.log("Processing Zod issue:", issue);
    
    if (issue && typeof issue === 'object') {
      // Get the path and message
      let path: (string | number)[] = [];
      let message: string = '';
      
      if ('path' in issue && Array.isArray(issue.path)) {
        path = issue.path;
      }
      
      if ('message' in issue && typeof issue.message === 'string') {
        message = issue.message;
      }
      
      // Create a dot-notation path string
      const fieldPath = path.length > 0 ? createPathString(path) : '_error';
      
      // Add to results
      result[fieldPath] = message;
      
      console.log(`Mapped Zod error: ${fieldPath} => ${message}`);
    }
  });
  
  // If we have no results from issues but we have a format method, use it
  if (Object.keys(result).length === 0 && typeof zodError.format === 'function') {
    try {
      console.log("Using Zod format() method");
      const formattedErrors = zodError.format();
      console.log("Formatted Zod errors:", formattedErrors);
      
      // Process the formatted errors
      const processFormattedErrors = (obj: any, parentPath: string = '') => {
        for (const key in obj) {
          const path = parentPath ? `${parentPath}.${key}` : key;
          
          if (key === '_errors' && Array.isArray(obj[key]) && obj[key].length > 0) {
            // This is an array of error messages for the current path
            result[parentPath || '_error'] = obj[key][0];
            console.log(`Added formatted Zod error: ${parentPath || '_error'} => ${obj[key][0]}`);
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            // Recursively process nested objects
            processFormattedErrors(obj[key], key === '_errors' ? parentPath : path);
          }
        }
      };
      
      processFormattedErrors(formattedErrors);
    } catch (e) {
      console.error("Error using Zod format():", e);
    }
  }
  
  // For empty results, try to extract from the error message directly
  if (Object.keys(result).length === 0 && 'message' in zodError) {
    result['_error'] = String(zodError.message);
    console.log("Falling back to error message:", zodError.message);
  }
  
  // Log the final extracted errors
  console.log("Final extracted Zod errors:", result);
  
  return result;
}

/**
 * Extract validation errors from any validation library's error object
 * @param errors Error object from any validation library
 * @returns Record with field names as keys and error messages as values
 */
export function extractValidationErrors(errors: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  
  if (!errors) {
    return result;
  }

  // Check for specific error types and use appropriate extractor
  if (isZodError(errors)) {
    console.log("Using Zod error extractor");
    return extractZodErrors(errors);
  }
  
  if (isYupError(errors)) {
    (errors as YupValidationError).inner.forEach(error => {
      if (error.path) {
        result[error.path] = error.message;
      }
    });
    
    // If no path-specific errors found, use the main error message
    if (Object.keys(result).length === 0 && errors.message) {
      result['_error'] = errors.message;
    }
    
    return result;
  }
  
  if (isJoiError(errors)) {
    (errors as JoiValidationError).details.forEach(detail => {
      const path = detail.path.join('.');
      result[path || '_error'] = detail.message;
    });
    return result;
  }

  // Handle React Hook Form errors or any object with nested error structure
  if (typeof errors === 'object' && errors !== null) {
    const processNestedErrors = (obj: any, path: string = '') => {
      if (typeof obj !== 'object' || obj === null) return;
      
      // Handle React Hook Form error format
      if ('message' in obj && 'type' in obj && typeof obj.message === 'string') {
        const fieldPath = path || '_error';
        result[fieldPath] = obj.message;
        return;
      }
      
      // Process object properties recursively
      Object.entries(obj).forEach(([key, value]) => {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (typeof value === 'object' && value !== null) {
          // Special case for RHF errors that have a message property
          if ('message' in value && typeof (value as any).message === 'string') {
            result[currentPath] = (value as any).message;
          } else if ('error' in value && (value as any).error) {
            // Handle Formik-style nested error objects
            result[currentPath] = typeof (value as any).error === 'string' 
              ? (value as any).error 
              : 'Invalid value';
          } else {
            // Continue recursion for nested objects
            processNestedErrors(value, currentPath);
          }
        } else if (typeof value === 'string') {
          // Direct string error
          result[currentPath] = value;
        }
      });
    };
    
    processNestedErrors(errors);
    
    // If still empty, try direct property access as last resort
    if (Object.keys(result).length === 0) {
      Object.entries(errors as object).forEach(([key, value]) => {
        if (typeof value === 'string') {
          result[key] = value;
        } else if (value && typeof value === 'object' && 'message' in value) {
          result[key] = String((value as any).message);
        }
      });
    }
  }

  return result;
}

/**
 * Get field-specific validation errors from a parent error object
 * @param error Any validation error object 
 * @param fieldPath Path to the specific field
 * @returns Error message for that field or undefined
 */
export function getFieldError(error: unknown, fieldPath: string): string | undefined {
  if (!error) return undefined;
  
  const errors = extractValidationErrors(error);
  return errors[fieldPath];
}

/**
 * Get the first validation error message from any supported validation library
 * @param error Any validation error
 * @returns First error message or null if no errors
 */
export function getFirstValidationErrorMessage(error: unknown): string | null {
  if (!error) return null;
  
  // Extract all validation errors
  const errors = extractValidationErrors(error);
  
  // Get the first error message
  const errorValues = Object.values(errors);
  return errorValues.length > 0 ? errorValues[0] : null;
}

/**
 * Helper function to create a custom validation error object 
 * that can be understood by our extraction functions
 * @param fieldErrors Record of field names and error messages
 * @returns Standardized error object
 */
export function createValidationError(fieldErrors: Record<string, string>): Error & { errors: Record<string, string> } {
  const error = new Error('Validation failed') as Error & { errors: Record<string, string> };
  error.errors = fieldErrors;
  return error;
}
