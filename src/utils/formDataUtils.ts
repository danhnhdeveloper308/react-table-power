/**
 * Utility functions for handling form data transformations and validation
 */

/**
 * Ensures the input is a proper object for form submissions
 * Converts primitive values to objects with a value property
 */
export function ensureObjectData(input: any): Record<string, any> {
  // If already an object (but not null) return it
  if (typeof input === 'object' && input !== null && !Array.isArray(input)) {
    return input;
  }
  
  // For arrays, wrap in an object
  if (Array.isArray(input)) {
    return { items: input };
  }
  
  // For primitives, wrap in an object with a value property
  if (input !== undefined && input !== null) {
    return { value: input };
  }
  
  // Return empty object for undefined/null
  return {};
}

/**
 * Safely get a value from an object, returns undefined if path doesn't exist
 */
export function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  
  return current;
}

/**
 * Set a nested value in an object
 */
export function setNestedValue(obj: any, path: string, value: any): void {
  if (!obj || !path) return;
  
  const parts = path.split('.');
  const lastPart = parts.pop();
  let current = obj;
  
  for (const part of parts) {
    if (!current[part] || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }
  
  if (lastPart) {
    current[lastPart] = value;
  }
}

/**
 * Recursively removes undefined and null values from an object
 */
export function cleanObject(obj: Record<string, any>): Record<string, any> {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    // Skip null and undefined values
    if (value === null || value === undefined) return acc;
    
    // Recursively clean nested objects
    if (typeof value === 'object' && !Array.isArray(value)) {
      const cleaned = cleanObject(value);
      // Only include non-empty objects
      if (Object.keys(cleaned).length > 0) {
        acc[key] = cleaned;
      }
      return acc;
    }
    
    // Include arrays and primitives as-is
    acc[key] = value;
    return acc;
  }, {} as Record<string, any>);
}

/**
 * Convert form data for submission
 */
export function prepareFormData(data: Record<string, any>): Record<string, any> {
  // Clone the data to avoid mutating the original
  const result = { ...data };
  
  // Perform any needed transformations
  
  // Clean the object (remove undefined/null values)
  return cleanObject(result);
}
