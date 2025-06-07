import { useState, useCallback, useMemo, useEffect } from 'react';
import { BaseTableData, TableColumn, FilterConfig, FilterType } from '../types';
import { applyFilters } from '../utils/filterUtils';

interface UseTableFilterOptions<T extends BaseTableData = BaseTableData> {
  /**
   * Data to be filtered
   */
  data: T[];
  
  /**
   * Column definitions
   */
  columns: TableColumn<T>[];
  
  /**
   * Filter configurations
   */
  filterConfigs?: FilterConfig[];
  
  /**
   * Initial filter values
   */
  initialFilters?: Record<string, any>;
  
  /**
   * Whether filtering is server-side
   */
  serverSide?: boolean;
  
  /**
   * Callback when filters change
   */
  onFilterChange?: (filters: Record<string, any>) => void;
  
  /**
   * Enable persistence of filters
   */
  persist?: boolean;
  
  /**
   * Key for persisting filters
   */
  persistKey?: string;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: Record<string, any>;
  isDefault?: boolean; // Changed from optional property to match other interfaces
  createdAt: string | number; // Accept either string or number to be compatible with both interfaces
}

interface UseTableFilterReturn<T extends BaseTableData = BaseTableData> {
  /**
   * Current filter values
   */
  filters: Record<string, any>;
  
  /**
   * Set filter for a specific field
   */
  setFilter: (field: string, value: any) => void;
  
  /**
   * Set multiple filters at once
   */
  setFilters: (filters: Record<string, any>) => void;
  
  /**
   * Remove filter for a specific field
   */
  removeFilter: (field: string) => void;
  
  /**
   * Clear all filters
   */
  clearFilters: () => void;
  
  /**
   * Reset filters to initial values
   */
  resetFilters: () => void;
  
  /**
   * Filtered data based on current filters
   */
  filteredData: T[];
  
  /**
   * Whether any filters are active
   */
  hasActiveFilters: boolean;
  
  /**
   * Count of active filters
   */
  activeFilterCount: number;
  
  /**
   * Available filter configurations
   */
  filterConfigs: FilterConfig[];
  
  /**
   * Save current filters as a preset
   */
  saveFilterPreset: (name: string, filters?: Record<string, any>) => FilterPreset;
  
  /**
   * Load filters from a preset
   */
  loadFilterPreset: (presetId: string) => Record<string, any> | null;
  
  /**
   * Available filter presets
   */
  filterPresets: FilterPreset[];
  
  /**
   * Delete a filter preset
   */
  deleteFilterPreset: (presetId: string) => boolean;
  
  /**
   * Set default filter preset
   */
  setDefaultFilterPreset: (presetId: string) => boolean;

  /**
   * Check if a filter supports multiple values
   */
  supportsMultipleValues: (field: string) => boolean;
}

/**
 * Hook for managing table filtering
 */
export function useTableFilter<T extends BaseTableData = BaseTableData>({
  data,
  columns,
  filterConfigs = [],
  initialFilters = {},
  serverSide = false,
  onFilterChange,
  persist = false,
  persistKey = 'table-filters',
}: UseTableFilterOptions<T>): UseTableFilterReturn<T> {
  // Load persisted filters if available
  const loadPersistedFilters = useCallback(() => {
    if (!persist || typeof window === 'undefined') {
      return initialFilters;
    }
    
    try {
      const saved = localStorage.getItem(`filters-${persistKey}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load persisted filters:', error);
    }
    
    return initialFilters;
  }, [initialFilters, persist, persistKey]);
  
  // Initialize filter state
  const [filters, setFilters] = useState<Record<string, any>>(loadPersistedFilters);
  
  // Load persisted presets if available
  const loadPersistedPresets = useCallback(() => {
    if (!persist || typeof window === 'undefined') {
      return [];
    }
    
    try {
      const saved = localStorage.getItem(`filter-presets-${persistKey}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load persisted filter presets:', error);
    }
    
    return [];
  }, [persist, persistKey]);
  
  // Initialize filter presets
  const [filterPresets, setFilterPresets] = useState<FilterPreset[]>(loadPersistedPresets);
  
  // Persist filters when they change
  useEffect(() => {
    if (persist && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`filters-${persistKey}`, JSON.stringify(filters));
      } catch (error) {
        console.warn('Failed to persist filters:', error);
      }
    }
    
    // Call onFilterChange callback if provided
    if (onFilterChange) {
      onFilterChange(filters);
    }
  }, [filters, persist, persistKey, onFilterChange]);
  
  // Persist filter presets when they change
  useEffect(() => {
    if (persist && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`filter-presets-${persistKey}`, JSON.stringify(filterPresets));
      } catch (error) {
        console.warn('Failed to persist filter presets:', error);
      }
    }
  }, [filterPresets, persist, persistKey]);
  
  // Helper to check if a filter type supports multiple values
  const supportsMultipleValuesByType = useCallback((type: FilterType): boolean => {
    return type === 'select' || type === 'multiselect';
  }, []);
  
  // Get configurations for each field
  const processedFilterConfigs = useMemo(() => {
    // Start with provided filter configs
    if (filterConfigs.length > 0) {
      return filterConfigs.map(config => ({
        ...config,
        // Ensure select and multiselect types support multiple values
        supportsMultipleValues: 
          config.supportsMultipleValues !== undefined ? 
          config.supportsMultipleValues : 
          supportsMultipleValuesByType(config.type)
      }));
    }
    
    // Auto-generate filter configs from columns
    return columns
      .filter(column => column.enableFiltering !== false && column.accessorKey)
      .map(column => {
        const key = column.accessorKey as string;
        const type = column.filterType || 'text';
        
        return {
          key,
          label: column.header as string || key,
          type,
          options: column.filterOptions,
          placeholder: `Filter by ${column.header || key}`,
          // Enhanced support for multiple values
          supportsMultipleValues: 
            column.meta?.supportsMultipleValues !== undefined ? 
            column.meta?.supportsMultipleValues :
            (type === 'select' || type === 'multiselect')
        };
      });
  }, [filterConfigs, columns, supportsMultipleValuesByType]);
  
  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).some(key => {
      const value = filters[key];
      
      // Check for empty arrays
      if (Array.isArray(value) && value.length === 0) {
        return false;
      }
      
      return value !== undefined && value !== null && value !== '';
    });
  }, [filters]);
  
  // Count active filters
  const activeFilterCount = useMemo(() => {
    return Object.keys(filters).filter(key => {
      const value = filters[key];
      
      // Check for empty arrays
      if (Array.isArray(value) && value.length === 0) {
        return false;
      }
      
      return value !== undefined && value !== null && value !== '';
    }).length;
  }, [filters]);
  
  // Apply filters to data (client-side)
  const filteredData = useMemo(() => {
    if (serverSide || !hasActiveFilters) {
      return data;
    }
    
    return applyFilters(data, filters, processedFilterConfigs);
  }, [data, filters, processedFilterConfigs, serverSide, hasActiveFilters]);
  
  // Set filter for a specific field
  const setFilter = useCallback((field: string, value: any) => {
    setFilters(prev => {
      // Check if field supports multiple values
      const config = processedFilterConfigs.find(c => c.key === field);
      const supportsMultiple = config?.supportsMultipleValues;
      
      // Handle array values for multi-select
      if (Array.isArray(value) && supportsMultiple) {
        // If empty array, remove the filter
        if (value.length === 0) {
          const { [field]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [field]: value };
      } 
      // Handle single values
      else if (value === undefined || value === null || value === '') {
        // Remove the filter if value is empty
        const { [field]: _, ...rest } = prev;
        return rest;
      } else {
        return { ...prev, [field]: value };
      }
    });
  }, [processedFilterConfigs]);
  
  // Set multiple filters at once
  const setMultipleFilters = useCallback((newFilters: Record<string, any>) => {
    setFilters(prev => {
      // Process each filter to handle arrays and empty values correctly
      const processedFilters = { ...prev };
      
      Object.entries(newFilters).forEach(([field, value]) => {
        // Check if field supports multiple values
        const config = processedFilterConfigs.find(c => c.key === field);
        const supportsMultiple = config?.supportsMultipleValues;
        
        // Handle array values
        if (Array.isArray(value) && supportsMultiple) {
          if (value.length === 0) {
            delete processedFilters[field];
          } else {
            processedFilters[field] = value;
          }
        } 
        // Handle single values
        else if (value === undefined || value === null || value === '') {
          delete processedFilters[field];
        } else {
          processedFilters[field] = value;
        }
      });
      
      return processedFilters;
    });
  }, [processedFilterConfigs]);
  
  // Remove filter for a specific field
  const removeFilter = useCallback((field: string) => {
    setFilters(prev => {
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  }, []);
  
  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);
  
  // Reset filters to initial values
  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);
  
  // Save current filters as a preset
  const saveFilterPreset = useCallback((name: string, customFilters?: Record<string, any>) => {
    const filtersToSave = customFilters || filters;
    
    // Create a new preset
    const newPreset: FilterPreset = {
      id: `preset-${Date.now()}`,
      name,
      filters: filtersToSave,
      createdAt: new Date().toISOString(), // Using ISO string format
      isDefault: false,
    };
    
    setFilterPresets(prev => [...prev, newPreset]);
    return newPreset;
  }, [filters]);
  
  // Load filters from a preset
  const loadFilterPreset = useCallback((presetId: string) => {
    const preset = filterPresets.find(p => p.id === presetId);
    if (!preset) return null;
    
    setFilters(preset.filters);
    return preset.filters;
  }, [filterPresets]);
  
  // Delete a filter preset
  const deleteFilterPreset = useCallback((presetId: string) => {
    const presetExists = filterPresets.some(p => p.id === presetId);
    if (!presetExists) return false;
    
    setFilterPresets(prev => prev.filter(p => p.id !== presetId));
    return true;
  }, [filterPresets]);
  
  // Set default filter preset
  const setDefaultFilterPreset = useCallback((presetId: string) => {
    const presetExists = filterPresets.some(p => p.id === presetId);
    if (!presetExists) return false;
    
    setFilterPresets(prev => 
      prev.map(p => ({
        ...p,
        isDefault: p.id === presetId
      }))
    );
    return true;
  }, [filterPresets]);
  
  // Check if a field supports multiple values
  const supportsMultipleValues = useCallback((field: string) => {
    const config = processedFilterConfigs.find(c => c.key === field);
    return Boolean(config?.supportsMultipleValues);
  }, [processedFilterConfigs]);
  
  return {
    filters,
    setFilter,
    setFilters: setMultipleFilters,
    removeFilter,
    clearFilters,
    resetFilters,
    filteredData,
    hasActiveFilters,
    activeFilterCount,
    filterConfigs: processedFilterConfigs,
    saveFilterPreset,
    loadFilterPreset,
    filterPresets,
    deleteFilterPreset,
    setDefaultFilterPreset,
    supportsMultipleValues
  };
}