import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  BaseTableData,
  TableColumn,
  FilterConfig,
  FilterType
} from '../types';
import { safeToString, isDate, getPropertyValue } from '../utils/typeUtils';
import { generateId } from '../utils';

export interface FilterGroup {
  id: string;
  filters: Record<string, any>;
  operator?: 'AND' | 'OR';
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: Record<string, any>;
  groups?: FilterGroup[];
  createdAt?: number;
  updatedAt?: number;
}

interface UseTableFilterOptions<T extends BaseTableData = BaseTableData> {
  data: T[];
  columns: TableColumn<T>[];
  filterConfigs?: FilterConfig[];
  defaultFilters?: Record<string, any>;
  serverSide?: boolean;
  onFilterChange?: (filters: Record<string, any>) => void;
  persistKey?: string;
  persist?: boolean;
  enableComplexFiltering?: boolean;
}

interface UseTableFilterReturn<T extends BaseTableData = BaseTableData> {
  filters: Record<string, any>;
  filteredData: T[];
  activeFilters: string[];
  activeFilterCount: number;
  setFilter: (key: string, value: any) => void;
  removeFilter: (key: string) => void;
  clearFilters: () => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
  getFilterConfig: (key: string) => FilterConfig | undefined;
  filterConfigs: FilterConfig[];
  isFilterActive: (key: string) => boolean;
  // Complex filtering
  filterGroups: FilterGroup[];
  addFilterGroup: () => FilterGroup;
  removeFilterGroup: (groupId: string) => void;
  updateFilterGroup: (groupId: string, filters: Record<string, any>) => void;
  setFilterGroupOperator: (groupId: string, operator: 'AND' | 'OR') => void;
  // Filter presets
  filterPresets: FilterPreset[];
  saveFilterPreset: (name: string, filters?: Record<string, any>) => FilterPreset;
  loadFilterPreset: (presetId: string) => Record<string, any> | null;
  deleteFilterPreset: (presetId: string) => void;
  activePresetId: string | null;
  setActivePresetId: (presetId: string | null) => void;
}

/**
 * Advanced hook for table filtering with presets and complex filtering
 */
export function useTableFilter<T extends BaseTableData = BaseTableData>({
  data,
  columns,
  filterConfigs = [],
  defaultFilters = {},
  serverSide = false,
  onFilterChange,
  persistKey,
  persist = false,
  enableComplexFiltering = false,
}: UseTableFilterOptions<T>): UseTableFilterReturn<T> {
  // Generate filters from columns if no filterConfigs provided
  const resolvedFilterConfigs = useMemo(() => {
    if (filterConfigs.length > 0) {
      return filterConfigs;
    }
    
    // Auto-generate filter configs from columns
    return columns
      .filter(col => col.filterable !== false)
      .map(col => {
        const key = String(col.accessorKey || col.id || '');
        let type: FilterType = 'text';
        
        // Try to determine filter type from column data
        if (col.filterType) {
          type = col.filterType;
        } else {
          // Try to infer filter type from first non-null value
          const firstNonNullRow = data.find(row => {
            if (!(key in row)) return false;
            const val = getPropertyValue(row, key);
            return val !== null && val !== undefined;
          });
          
          if (firstNonNullRow) {
            const firstValue = getPropertyValue(firstNonNullRow, key);
            
            if (typeof firstValue === 'boolean') {
              type = 'boolean';
            } else if (isDate(firstValue)) {
              type = 'date';
            } else if (typeof firstValue === 'number') {
              type = 'number';
            }
          }
        }
        
        return {
          key,
          label: typeof col.header === 'string' ? col.header : key,
          type,
          options: col.filterOptions,
        } as FilterConfig;
      })
      .filter(config => config.key); // Filter out configs without a key
  }, [columns, filterConfigs, data]);
  
  // Storage keys for persisting filters and presets
  const filtersStorageKey = persist && persistKey ? `filters-${persistKey}` : null;
  const presetsStorageKey = persist && persistKey ? `filter-presets-${persistKey}` : null;
  const activePresetStorageKey = persist && persistKey ? `active-filter-preset-${persistKey}` : null;
  const filterGroupsStorageKey = persist && persistKey ? `filter-groups-${persistKey}` : null;
  
  // Load persisted filters if enabled
  const loadPersistedFilters = useCallback(() => {
    if (!filtersStorageKey || typeof window === 'undefined') {
      return defaultFilters;
    }
    
    try {
      const saved = localStorage.getItem(filtersStorageKey);
      if (saved) {
        return { ...defaultFilters, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Failed to load persisted filters:', error);
    }
    
    return defaultFilters;
  }, [defaultFilters, filtersStorageKey]);
  
  // Load persisted filter presets
  const loadPersistedPresets = useCallback(() => {
    if (!presetsStorageKey || typeof window === 'undefined') {
      return [];
    }
    
    try {
      const saved = localStorage.getItem(presetsStorageKey);
      if (saved) {
        return JSON.parse(saved) as FilterPreset[];
      }
    } catch (error) {
      console.warn('Failed to load persisted filter presets:', error);
    }
    
    return [];
  }, [presetsStorageKey]);
  
  // Load persisted active preset ID
  const loadActivePresetId = useCallback(() => {
    if (!activePresetStorageKey || typeof window === 'undefined') {
      return null;
    }
    
    try {
      const saved = localStorage.getItem(activePresetStorageKey);
      return saved; // Will be null if not saved
    } catch (error) {
      console.warn('Failed to load persisted active preset ID:', error);
    }
    
    return null;
  }, [activePresetStorageKey]);
  
  // Load persisted filter groups
  const loadPersistedFilterGroups = useCallback(() => {
    if (!filterGroupsStorageKey || typeof window === 'undefined' || !enableComplexFiltering) {
      return [];
    }
    
    try {
      const saved = localStorage.getItem(filterGroupsStorageKey);
      if (saved) {
        return JSON.parse(saved) as FilterGroup[];
      }
    } catch (error) {
      console.warn('Failed to load persisted filter groups:', error);
    }
    
    return [];
  }, [filterGroupsStorageKey, enableComplexFiltering]);
  
  // Filter state
  const [filters, setFilters] = useState<Record<string, any>>(loadPersistedFilters());
  
  // Filter presets state
  const [filterPresets, setFilterPresets] = useState<FilterPreset[]>(loadPersistedPresets());
  const [activePresetId, setActivePresetId] = useState<string | null>(loadActivePresetId());
  
  // Filter groups state - for complex filtering
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>(loadPersistedFilterGroups());
  
  // Persist filters when they change
  useEffect(() => {
    if (filtersStorageKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(filtersStorageKey, JSON.stringify(filters));
      } catch (error) {
        console.warn('Failed to persist filters:', error);
      }
    }
    
    // Call onFilterChange callback if provided
    if (onFilterChange) {
      onFilterChange(filters);
    }
  }, [filters, filtersStorageKey, onFilterChange]);
  
  // Persist filter presets when they change
  useEffect(() => {
    if (presetsStorageKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(presetsStorageKey, JSON.stringify(filterPresets));
      } catch (error) {
        console.warn('Failed to persist filter presets:', error);
      }
    }
  }, [filterPresets, presetsStorageKey]);
  
  // Persist active preset ID
  useEffect(() => {
    if (activePresetStorageKey && typeof window !== 'undefined') {
      try {
        if (activePresetId) {
          localStorage.setItem(activePresetStorageKey, activePresetId);
        } else {
          localStorage.removeItem(activePresetStorageKey);
        }
      } catch (error) {
        console.warn('Failed to persist active preset ID:', error);
      }
    }
  }, [activePresetId, activePresetStorageKey]);
  
  // Persist filter groups
  useEffect(() => {
    if (filterGroupsStorageKey && typeof window !== 'undefined' && enableComplexFiltering) {
      try {
        localStorage.setItem(filterGroupsStorageKey, JSON.stringify(filterGroups));
      } catch (error) {
        console.warn('Failed to persist filter groups:', error);
      }
    }
  }, [filterGroups, filterGroupsStorageKey, enableComplexFiltering]);
  
  // Set a filter value
  const setFilter = useCallback((key: string, value: any) => {
    setFilters(prev => {
      // If value is empty, null, or undefined, remove the filter
      if (value === '' || value === null || value === undefined) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      
      return {
        ...prev,
        [key]: value,
      };
    });
    
    // After modifying a filter, clear the active preset
    setActivePresetId(null);
  }, []);
  
  // Remove a filter
  const removeFilter = useCallback((key: string) => {
    setFilters(prev => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
    
    // After modifying a filter, clear the active preset
    setActivePresetId(null);
  }, []);
  
  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
    setActivePresetId(null);
  }, []);
  
  // Reset to default filters
  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setActivePresetId(null);
  }, [defaultFilters]);
  
  // Save filter preset
  const saveFilterPreset = useCallback((name: string, customFilters?: Record<string, any>): FilterPreset => {
    if (!name.trim()) {
      throw new Error('Preset name is required');
    }
    
    const timestamp = Date.now();
    const newPreset: FilterPreset = {
      id: generateId('preset'),
      name: name.trim(),
      filters: customFilters || { ...filters },
      createdAt: timestamp,
      updatedAt: timestamp,
      groups: enableComplexFiltering ? [...filterGroups] : undefined,
    };
    
    setFilterPresets(prevPresets => {
      // Check if we're updating an existing preset with the same name
      const existingIndex = prevPresets.findIndex(p => p.name === name.trim());
      
      if (existingIndex >= 0) {
        // Update existing preset
        const updated = [...prevPresets];
        updated[existingIndex] = {
          ...newPreset,
          id: updated[existingIndex].id,
          createdAt: updated[existingIndex].createdAt,
        };
        return updated;
      }
      
      // Add new preset
      return [...prevPresets, newPreset];
    });
    
    setActivePresetId(newPreset.id);
    
    return newPreset;
  }, [filters, filterGroups, enableComplexFiltering]);
  
  // Load filter preset
  const loadFilterPreset = useCallback((presetId: string): Record<string, any> | null => {
    const preset = filterPresets.find(p => p.id === presetId);
    if (!preset) return null;
    
    // Apply preset filters
    setFilters(preset.filters || {});
    
    // Apply preset filter groups if complex filtering is enabled
    if (enableComplexFiltering && preset.groups) {
      setFilterGroups(preset.groups);
    }
    
    setActivePresetId(presetId);
    
    return preset.filters || {};
  }, [filterPresets, enableComplexFiltering]);
  
  // Delete filter preset
  const deleteFilterPreset = useCallback((presetId: string): void => {
    setFilterPresets(prevPresets => prevPresets.filter(p => p.id !== presetId));
    
    // If we're deleting the active preset, clear the active preset
    if (activePresetId === presetId) {
      setActivePresetId(null);
    }
  }, [activePresetId]);
  
  // Add a new filter group
  const addFilterGroup = useCallback((): FilterGroup => {
    const newGroup: FilterGroup = {
      id: generateId('group'),
      filters: {},
      operator: 'AND',
    };
    
    setFilterGroups(prev => [...prev, newGroup]);
    
    return newGroup;
  }, []);
  
  // Remove a filter group
  const removeFilterGroup = useCallback((groupId: string): void => {
    setFilterGroups(prev => prev.filter(group => group.id !== groupId));
  }, []);
  
  // Update a filter group's filters
  const updateFilterGroup = useCallback((groupId: string, groupFilters: Record<string, any>): void => {
    setFilterGroups(prev => 
      prev.map(group => 
        group.id === groupId ? { ...group, filters: groupFilters } : group
      )
    );
  }, []);
  
  // Set a filter group's operator
  const setFilterGroupOperator = useCallback((groupId: string, operator: 'AND' | 'OR'): void => {
    setFilterGroups(prev => 
      prev.map(group => 
        group.id === groupId ? { ...group, operator } : group
      )
    );
  }, []);
  
  // Get filter configuration for a specific key
  const getFilterConfig = useCallback((key: string) => {
    return resolvedFilterConfigs.find(config => config.key === key);
  }, [resolvedFilterConfigs]);
  
  // Check if a filter is active
  const isFilterActive = useCallback((key: string) => {
    return filters[key] !== undefined && filters[key] !== null && filters[key] !== '';
  }, [filters]);
  
  // Get list of active filter keys
  const activeFilters = useMemo(() => {
    return Object.keys(filters).filter(key => 
      filters[key] !== undefined && filters[key] !== null && filters[key] !== ''
    );
  }, [filters]);
  
  // Get count of active filters
  const activeFilterCount = useMemo(() => activeFilters.length, [activeFilters]);
  
  // Check if any filters are active
  const hasActiveFilters = useMemo(() => activeFilterCount > 0, [activeFilterCount]);
  
  // Helper function to safely convert to Date
  const safeToDate = (value: any): Date | null => {
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      return !isNaN(date.getTime()) ? date : null;
    }
    return null;
  };
  
  // Helper function for date comparison
  const compareDates = (rowValue: any, filterValue: any): boolean => {
    const dateValue = safeToDate(rowValue);
    if (!dateValue) return false;
    
    // If filter value is a date range
    if (Array.isArray(filterValue) && filterValue.length === 2) {
      const [start, end] = filterValue;
      const startDate = start ? safeToDate(start) : null;
      const endDate = end ? safeToDate(end) : null;
      
      if (startDate && endDate) {
        return dateValue >= startDate && dateValue <= endDate;
      } else if (startDate) {
        return dateValue >= startDate;
      } else if (endDate) {
        return dateValue <= endDate;
      }
      return true;
    }
    
    // Single date comparison
    const filterDate = safeToDate(filterValue);
    if (!filterDate) return false;
    
    return dateValue.toDateString() === filterDate.toDateString();
  };
  
  // Apply filter to a row
  const applyFilter = useCallback((row: T, key: string, value: any): boolean => {
    if (value === undefined || value === null || value === '') {
      return true; // Skip empty filters
    }
    
    const config = getFilterConfig(key);
    if (!config) return true; // Skip if no config found
    
    // Use safe property access
    if (!(key in row)) return false;
    const rawValue = getPropertyValue(row, key);
    
    // Handle different filter types
    switch (config.type) {
      case 'text': {
        if (typeof value !== 'string') return true;
        if (rawValue === null || rawValue === undefined) return false;
        
        const cellValue = safeToString(rawValue).toLowerCase();
        return cellValue.includes(value.toLowerCase());
      }
      
      case 'select': {
        if (Array.isArray(value)) {
          // Multi-select: match any value in the array
          return value.length === 0 || value.some(v => 
            safeToString(v) === safeToString(rawValue)
          );
        }
        return safeToString(value) === safeToString(rawValue);
      }
      
      case 'boolean': {
        if (value === 'all') return true;
        const boolValue = value === 'true' || value === true;
        return rawValue === boolValue;
      }
      
      case 'date':
        return compareDates(rawValue, value);
      
      case 'dateRange':
        return compareDates(rawValue, value);
      
      case 'number': {
        if (rawValue === null || rawValue === undefined) return false;
        
        const numValue = Number(rawValue);
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
      
      // Custom filtering can be handled by the parent component
      case 'custom':
        return true;
      
      default:
        return true;
    }
  }, [getFilterConfig]);
  
  // Apply a filter group to a row
  const applyFilterGroup = useCallback((row: T, group: FilterGroup): boolean => {
    if (Object.keys(group.filters).length === 0) return true;
    
    const isAnd = group.operator !== 'OR';
    
    // For AND, all filters must pass
    if (isAnd) {
      return Object.entries(group.filters).every(([key, value]) => 
        applyFilter(row, key, value)
      );
    }
    
    // For OR, any filter can pass
    return Object.entries(group.filters).some(([key, value]) => 
      applyFilter(row, key, value)
    );
  }, [applyFilter]);
  
  // Apply filters to data (client-side filtering)
  const filteredData = useMemo(() => {
    if (serverSide) {
      return data;
    }
    
    let result = [...data];
    
    // Apply main filters
    if (hasActiveFilters) {
      result = result.filter(row => {
        return Object.entries(filters).every(([key, value]) => 
          applyFilter(row, key, value)
        );
      });
    }
    
    // Apply filter groups if complex filtering is enabled
    if (enableComplexFiltering && filterGroups.length > 0) {
      result = result.filter(row => {
        // If no groups have filters, consider all rows matching
        const activeGroups = filterGroups.filter(group => Object.keys(group.filters).length > 0);
        if (activeGroups.length === 0) return true;
        
        // Each group applies its own internal logic (AND/OR),
        // and groups are combined with OR by default
        return activeGroups.some(group => applyFilterGroup(row, group));
      });
    }
    
    return result;
  }, [data, filters, hasActiveFilters, serverSide, enableComplexFiltering, filterGroups, applyFilter, applyFilterGroup]);
  
  return {
    filters,
    filteredData,
    activeFilters,
    activeFilterCount,
    setFilter,
    removeFilter,
    clearFilters,
    resetFilters,
    hasActiveFilters,
    getFilterConfig,
    filterConfigs: resolvedFilterConfigs,
    isFilterActive,
    // Complex filtering
    filterGroups,
    addFilterGroup,
    removeFilterGroup,
    updateFilterGroup,
    setFilterGroupOperator,
    // Filter presets
    filterPresets,
    saveFilterPreset,
    loadFilterPreset,
    deleteFilterPreset,
    activePresetId,
    setActivePresetId
  };
}

export default useTableFilter;