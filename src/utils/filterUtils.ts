import { TableColumn, FilterConfig, BaseTableData } from '../types';

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
 * Apply filters to data (client-side filtering)
 * @param data The data to filter
 * @param filters The filters to apply
 * @param filterConfigs The filter configurations
 * @returns Filtered data
 */
export function applyFilters<T extends BaseTableData>(
  data: T[],
  filters: Record<string, any>,
  filterConfigs: FilterConfig[]
): T[] {
  // If no filters are active, return all data
  if (!filters || Object.keys(filters).length === 0) {
    return data;
  }

  // Apply all active filters
  return data.filter((row) => {
    return Object.entries(filters).every(([key, value]) => {
      // Skip empty filters
      if (value === undefined || value === null || value === '') {
        return true;
      }

      // Find filter configuration
      const config = filterConfigs.find((c) => c.key === key);
      if (!config) return true;

      // Get the value from the row
      const rowValue = row[key];
      if (rowValue === undefined) return false;

      // Apply filter based on type
      switch (config.type) {
        case 'text': {
          if (typeof value !== 'string') return true;
          const stringValue = String(rowValue).toLowerCase();
          return stringValue.includes(value.toLowerCase());
        }

        case 'select': {
          if (Array.isArray(value)) {
            // Multi-select
            return value.length === 0 || value.some((v) => String(v) === String(rowValue));
          }
          return String(value) === String(rowValue);
        }

        case 'boolean': {
          if (value === 'all') return true;
          const boolValue = value === 'true' || value === true;
          return rowValue === boolValue;
        }

        case 'date': {
          const dateValue = rowValue instanceof Date ? rowValue : new Date(rowValue);
          
          // If filter value is a date range
          if (Array.isArray(value) && value.length === 2) {
            const [start, end] = value;
            const startDate = start ? new Date(start) : null;
            const endDate = end ? new Date(end) : null;
            
            if (startDate && endDate) {
              return dateValue >= startDate && dateValue <= endDate;
            } else if (startDate) {
              return dateValue >= startDate;
            } else if (endDate) {
              return dateValue <= endDate;
            }
            return true;
          }
          
          // Single date comparison - match the day
          const filterDate = new Date(value);
          return (
            dateValue.getFullYear() === filterDate.getFullYear() &&
            dateValue.getMonth() === filterDate.getMonth() &&
            dateValue.getDate() === filterDate.getDate()
          );
        }

        case 'number': {
          const numValue = Number(rowValue);
          if (isNaN(numValue)) return false;
          
          // If value is a range
          if (Array.isArray(value) && value.length === 2) {
            const [min, max] = value;
            if (min !== null && max !== null) {
              return numValue >= min && numValue <= max;
            } else if (min !== null) {
              return numValue >= min;
            } else if (max !== null) {
              return numValue <= max;
            }
            return true;
          }
          
          return numValue === Number(value);
        }

        default:
          return true;
      }
    });
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