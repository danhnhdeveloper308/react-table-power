/**
 * Utility functions for better debugging 
 */

/**
 * Safely extract ID from a record for delete operations
 * @param data The record or ID to extract from
 * @returns The extracted ID or undefined if not found
 */
export function extractRecordId(data: any): string | number | undefined {
  // Handle direct ID values
  if (typeof data === 'string' || typeof data === 'number') {
    return data;
  }
  
  // Handle record objects
  if (data && typeof data === 'object') {
    // Standard 'id' property
    if ('id' in data) {
      return data.id;
    }
    
    // MongoDB style '_id' property
    if ('_id' in data) {
      return data._id;
    }
    
    // Look for any property ending with 'Id' or 'ID'
    for (const key in data) {
      if (key.toLowerCase().endsWith('id')) {
        const value = data[key];
        if (typeof value === 'string' || typeof value === 'number') {
          return value;
        }
      }
    }
  }
  
  return undefined;
}

/**
 * Debug log helper that only logs in development environments
 */
export function debugLog(message: string, data?: any): void {
  if (process.env.NODE_ENV !== 'production') {
    if (data !== undefined) {
      console.log(`[DEBUG] ${message}`, data);
    } else {
      console.log(`[DEBUG] ${message}`);
    }
  }
}

/**
 * Inspect a record to get helpful information about it
 */
export function inspectRecord(record: any): string {
  try {
    if (record === null || record === undefined) {
      return 'null or undefined';
    }
    
    if (typeof record === 'string' || typeof record === 'number' || typeof record === 'boolean') {
      return String(record);
    }
    
    if (typeof record === 'object') {
      const id = 'id' in record ? record.id : ('_id' in record ? record._id : 'unknown');
      const keys = Object.keys(record);
      return `Object with ID: ${id}, keys: [${keys.join(', ')}]`;
    }
    
    return `${typeof record}`;
  } catch (error) {
    return 'Error inspecting record';
  }
}

export default {
  extractRecordId,
  debugLog,
  inspectRecord
};
