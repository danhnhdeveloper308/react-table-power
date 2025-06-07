/**
 * Get value from an object using a path string
 * @param obj Object to navigate
 * @param path Path using dot notation (e.g., "user.address.street")
 * @param defaultValue Value to return if path doesn't exist
 * @returns The value at the path, or defaultValue if not found
 */
export function deepGet(obj: any, path: string, defaultValue?: any): any {
  if (!obj || typeof obj !== 'object' || !path) return defaultValue;

  const parts = Array.isArray(path) ? path : path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return defaultValue;
    }

    // Handle array indices in path (e.g., "items[0].name")
    const arrayMatch = part.match(/^([^\[]+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, arrayName, indexStr] = arrayMatch;
      current = current[arrayName]?.[parseInt(indexStr, 10)];
    } else {
      current = current[part];
    }
  }

  return current !== undefined ? current : defaultValue;
}

/**
 * Set a value in an object at the specified path
 * @param obj Object to modify
 * @param path Path using dot notation
 * @param value Value to set
 * @returns The modified object
 */
export function deepSet(obj: any, path: string, value: any): any {
  if (!obj || typeof obj !== 'object' || !path) return obj;

  const parts = Array.isArray(path) ? path : path.split('.');
  let current = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    
    // Handle array indices in path
    const arrayMatch = part.match(/^([^\[]+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, arrayName, indexStr] = arrayMatch;
      const arrayIndex = parseInt(indexStr, 10);
      
      if (!current[arrayName]) {
        current[arrayName] = [];
      }
      
      if (!current[arrayName][arrayIndex]) {
        current[arrayName][arrayIndex] = {};
      }
      
      current = current[arrayName][arrayIndex];
    } else {
      if (!current[part] || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part];
    }
  }
  
  const lastPart = parts[parts.length - 1];
  
  // Handle array index in the last part
  const arrayMatch = lastPart.match(/^([^\[]+)\[(\d+)\]$/);
  if (arrayMatch) {
    const [, arrayName, indexStr] = arrayMatch;
    const arrayIndex = parseInt(indexStr, 10);
    
    if (!current[arrayName]) {
      current[arrayName] = [];
    }
    
    current[arrayName][arrayIndex] = value;
  } else {
    current[lastPart] = value;
  }
  
  return obj;
}

/**
 * Check if an object has a property at the specified path
 * @param obj Object to check
 * @param path Path using dot notation
 * @returns Whether the path exists
 */
export function hasPath(obj: any, path: string): boolean {
  return deepGet(obj, path, Symbol('NOT_FOUND')) !== Symbol('NOT_FOUND');
}

/**
 * Flatten a nested object into a single level with dot notation keys
 * @param obj Object to flatten
 * @param prefix Prefix for generated keys
 * @returns Flattened object
 */
export function flattenObject(obj: object, prefix = ''): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, newKey));
    } else {
      result[newKey] = value;
    }
  }
  
  return result;
}
