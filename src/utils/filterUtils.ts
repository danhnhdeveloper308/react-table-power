import { TableColumn, FilterConfig, BaseTableData } from '../types';
import { getNestedValue } from './typeUtils';

/**
 * Helper function to infer the appropriate filter type from column data
 * @param value The sample value to infer type from
 * @returns The appropriate FilterType for the provided value
 */
export function inferFilterType(value: any): 'text' | 'select' | 'boolean' | 'date' | 'dateRange' | 'number' {
  // Determine filter type based on value type
  if (value === null || value === undefined) {
    return 'text'; // Default to text for empty values
  }

  if (typeof value === 'boolean') {
    return 'boolean';
  }

  if (typeof value === 'number') {
    return 'number';
  }

  if (value instanceof Date) {
    return 'date';
  }

  // Try to detect if string is a date
  if (typeof value === 'string') {
    // Check for ISO date format
    if (/^\d{4}-\d{2}-\d{2}(T|\s)/.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return 'date';
      }
    }

    // Check for other common date formats
    if (/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return 'date';
      }
    }
  }

  // Default to text for any other type
  return 'text';
}

/**
 * Generate unique filter options from the data for a specific column
 * @param data The table data
 * @param key The column key to generate options for
 * @param limit Maximum number of options to return (defaults to 50)
 * @returns Array of filter options
 */
export function generateFilterOptions(
  data: BaseTableData[],
  key: string,
  limit: number = 50
) {
  const valuesSet = new Set<any>();
  const options: { label: string; value: any }[] = [];

  // Collect unique values
  data.forEach((row) => {
    if (row[key] !== undefined && row[key] !== null) {
      valuesSet.add(row[key]);
    }
  });

  // Convert to options array
  valuesSet.forEach((value) => {
    if (options.length < limit) {
      options.push({
        label: String(value),
        value: value,
      });
    }
  });

  // Sort options alphabetically
  return options.sort((a, b) => {
    if (typeof a.value === 'string' && typeof b.value === 'string') {
      return a.value.localeCompare(b.value);
    }
    return String(a.label).localeCompare(String(b.label));
  });
}

/**
 * Generate filter configurations from table columns
 * @param columns The table columns
 * @param data Sample data to infer types and generate options
 * @returns Array of filter configurations
 */
export function generateFilterConfigs<T extends BaseTableData>(
  columns: TableColumn<T>[],
  data: T[] = []
): FilterConfig[] {
  return columns
    .filter((column) => column.filterable !== false && column.accessorKey)
    .map((column) => {
      const key = String(column.accessorKey);
      const label = typeof column.header === 'string' ? column.header : key;
      
      // Use the column's filter type if specified
      let type = column.filterType;
      let options = column.filterOptions;

      // If no type is specified, try to infer from data
      if (!type && data.length > 0) {
        const sampleRow = data.find((row) => row[key] !== undefined && row[key] !== null);
        if (sampleRow) {
          type = inferFilterType(sampleRow[key]);
        } else {
          type = 'text'; // Default to text if no data available
        }
      }

      // Generate options for select type if not provided
      if (type === 'select' && !options && data.length > 0) {
        options = generateFilterOptions(data, key);
      }

      return {
        key,
        label,
        type: type || 'text',
        options,
        placeholder: `Filter by ${label}`,
      };
    });
}

/**
 * Apply text filter for string values
 * @param value The value to filter
 * @param filterValue The filter value to compare against
 * @returns Whether the value passes the filter
 */
export function applyTextFilter(value: any, filterValue: string): boolean {
  if (value === null || value === undefined) return false;
  const stringValue = String(value).toLowerCase();
  const stringFilterValue = String(filterValue).toLowerCase();
  return stringValue.includes(stringFilterValue);
}

/**
 * Apply numeric filter for number values
 * @param value The value to filter
 * @param filterValue The filter value (can be a range or single value)
 * @returns Whether the value passes the filter
 */
export function applyNumberFilter(value: any, filterValue: any): boolean {
  if (value === null || value === undefined) return false;
  
  // Convert to number
  const numValue = Number(value);
  if (isNaN(numValue)) return false;
  
  // Check if filter is a range {min, max}
  if (typeof filterValue === 'object' && filterValue !== null) {
    const { min, max } = filterValue;
    const hasMin = min !== undefined && min !== null && !isNaN(Number(min));
    const hasMax = max !== undefined && max !== null && !isNaN(Number(max));
    
    if (hasMin && hasMax) {
      return numValue >= Number(min) && numValue <= Number(max);
    } else if (hasMin) {
      return numValue >= Number(min);
    } else if (hasMax) {
      return numValue <= Number(max);
    }
    return true;
  }
  
  // Single value comparison
  const numFilterValue = Number(filterValue);
  if (isNaN(numFilterValue)) return false;
  
  return numValue === numFilterValue;
}

/**
 * Apply date filter for date values
 * @param value The value to filter (date string, Date object, or timestamp)
 * @param filterValue The filter value (can be a range or single date)
 * @returns Whether the value passes the filter
 */
export function applyDateFilter(value: any, filterValue: any): boolean {
  if (value === null || value === undefined) return false;
  
  // Convert value to Date
  let dateValue: Date;
  if (value instanceof Date) {
    dateValue = value;
  } else if (typeof value === 'string' || typeof value === 'number') {
    dateValue = new Date(value);
    if (isNaN(dateValue.getTime())) return false;
  } else {
    return false;
  }
  
  // Remove time part for date-only comparison
  const normalizedValue = new Date(dateValue.setHours(0, 0, 0, 0));
  
  // Check if filter is a range {start, end}
  if (typeof filterValue === 'object' && filterValue !== null) {
    const { start, end } = filterValue;
    const hasStart = start !== undefined && start !== null;
    const hasEnd = end !== undefined && end !== null;
    
    // Convert filter dates
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    
    if (hasStart) {
      startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);
      if (isNaN(startDate.getTime())) startDate = null;
    }
    
    if (hasEnd) {
      endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999); // End of day
      if (isNaN(endDate.getTime())) endDate = null;
    }
    
    if (startDate && endDate) {
      return normalizedValue >= startDate && normalizedValue <= endDate;
    } else if (startDate) {
      return normalizedValue >= startDate;
    } else if (endDate) {
      return normalizedValue <= endDate;
    }
    return true;
  }
  
  // Single date comparison
  let filterDate: Date;
  if (filterValue instanceof Date) {
    filterDate = new Date(filterValue);
  } else {
    filterDate = new Date(filterValue);
    if (isNaN(filterDate.getTime())) return false;
  }
  
  // Normalize filter date
  filterDate.setHours(0, 0, 0, 0);
  
  return normalizedValue.getTime() === filterDate.getTime();
}

/**
 * Applies all filters to a dataset
 * 
 * @param data Data array to filter
 * @param filters Filter values by field
 * @param filterConfigs Filter configuration by field
 * @returns Filtered data array
 */
export function applyFilters<T>(
  data: T[],
  filters: Record<string, any>,
  filterConfigs: FilterConfig[] = []
): T[] {
  if (!data || data.length === 0 || Object.keys(filters).length === 0) {
    return data;
  }

  return data.filter(item => {
    // Check all filters
    for (const [field, value] of Object.entries(filters)) {
      if (value === undefined || value === null) continue;

      // Get the filter configuration
      const filterConfig = filterConfigs.find(config => config.key === field);
      const filterType = filterConfig?.type || 'text';
      
      // Get the item's field value
      const fieldValue = typeof item === 'object' ? getNestedValue(item, field) : null;

      // Skip if the field doesn't exist in the item
      if (fieldValue === undefined || fieldValue === null) continue;

      // Handle arrays for multi-select filters
      if (Array.isArray(value) && value.length > 0) {
        if (Array.isArray(fieldValue)) {
          // If field value is also an array, check for any intersection
          const hasMatch = value.some(val => fieldValue.includes(val));
          if (!hasMatch) return false;
        } else {
          // If field value is a single value, check if it's in the filter values array
          if (!value.includes(fieldValue)) return false;
        }
        continue; // Skip to next filter
      }

      // If value is empty string, skip
      if (value === '') continue;

      // Apply filter based on type
      switch (filterType) {
        case 'text':
          if (!applyTextFilter(fieldValue, value)) return false;
          break;
          
        case 'select':
        case 'multiselect': // Handle both select and multiselect types
          if (typeof value === 'string' || typeof value === 'number') {
            // For single select
            if (String(fieldValue) !== String(value)) return false;
          } else if (Array.isArray(value)) {
            // For multi-select values (handled above, but keeping for clarity)
            if (!value.includes(fieldValue)) return false;
          }
          break;
          
        case 'number':
          if (!applyNumberFilter(fieldValue, value)) return false;
          break;
          
        case 'date':
        case 'dateRange':
          if (!applyDateFilter(fieldValue, value)) return false;
          break;
          
        case 'boolean':
          if (Boolean(fieldValue) !== Boolean(value)) return false;
          break;
          
        default:
          // Fall back to text filter
          if (!applyTextFilter(fieldValue, value)) return false;
      }
    }
    
    return true; // Item passed all filters
  });
}

/**
 * Combine filter state with filter configurations to create a useful filter object
 * @param filters Current filter values
 * @param configs Filter configurations
 * @returns Enhanced filter object with values and metadata
 */
export function enhanceFilters(
  filters: Record<string, any>,
  configs: FilterConfig[]
) {
  return Object.entries(filters).reduce((acc, [key, value]) => {
    const config = configs.find((c) => c.key === key);
    
    acc[key] = {
      value,
      config,
      isActive: value !== undefined && value !== null && value !== '',
    };
    
    return acc;
  }, {} as Record<string, { value: any; config?: FilterConfig; isActive: boolean }>);
}

export default {
  inferFilterType,
  generateFilterOptions,
  generateFilterConfigs,
  applyFilters,
  enhanceFilters,
};