import { useState, useCallback, useMemo, useEffect } from 'react';
import { BaseTableData, TableColumn, GlobalSearchConfig } from '../types';
import { safeToString } from '../utils/typeUtils';

interface UseTableGlobalSearchOptions<T extends BaseTableData = BaseTableData> {
  /**
   * Data to be searched
   */
  data: T[];
  
  /**
   * Column definitions
   */
  columns: TableColumn<T>[];
  
  /**
   * Global search configuration
   */
  globalSearch?: GlobalSearchConfig | boolean;
  
  /**
   * Whether search is server-side
   */
  serverSide?: boolean;
  
  /**
   * Callback when search value changes
   */
  onSearchChange?: (value: string) => void;
  
  /**
   * Debounce time in milliseconds
   */
  debounceTime?: number;
  
  /**
   * Enable persistence of search state
   */
  persist?: boolean;
  
  /**
   * Key for persisting search state
   */
  persistKey?: string;
}

interface UseTableGlobalSearchReturn<T extends BaseTableData = BaseTableData> {
  /**
   * Current search value
   */
  searchValue: string;
  
  /**
   * Set search value
   */
  setSearchValue: (value: string) => void;
  
  /**
   * Clear search
   */
  clearSearch: () => void;
  
  /**
   * Filtered data based on search
   */
  filteredData: T[];
  
  /**
   * Whether search is enabled
   */
  isSearchEnabled: boolean;
  
  /**
   * Search placeholder text
   */
  placeholder: string;
  
  /**
   * Fields to search in
   */
  searchFields: string[];
  
  /**
   * Whether search is case-sensitive
   */
  caseSensitive: boolean;
  
  /**
   * Debounce time in milliseconds
   */
  debounceMs: number;
  
  /**
   * Whether autofocus is enabled
   */
  autoFocus: boolean;
  
  /**
   * Whether search is active
   */
  isSearchActive: boolean;
}

/**
 * Hook for global table search functionality
 */
export function useTableGlobalSearch<T extends BaseTableData = BaseTableData>({
  data,
  columns,
  globalSearch,
  serverSide = false,
  onSearchChange,
  debounceTime,
  persist = false,
  persistKey = 'table-search',
}: UseTableGlobalSearchOptions<T>): UseTableGlobalSearchReturn<T> {
  // Parse global search config
  const config = useMemo(() => {
    if (typeof globalSearch === 'boolean') {
      return { enabled: globalSearch };
    }
    return globalSearch || {};
  }, [globalSearch]);
  
  // Determine if search is enabled
  const isSearchEnabled = useMemo(() => 
    config?.enabled !== false,
    [config]
  );
  
  // Get search fields
  const searchFields = useMemo(() => {
    if (config?.searchFields?.length) {
      return config.searchFields;
    }
    
    if (config?.fields?.length) {
      return config.fields;
    }
    
    // Default to all accessorKey fields from columns
    return columns
      .filter(col => col.accessorKey)
      .map(col => String(col.accessorKey));
  }, [config, columns]);
  
  // Search options
  const placeholder = config?.placeholder || 'Search...';
  const caseSensitive = config?.caseSensitive || false;
  const debounceMs = debounceTime || config?.debounceMs || 300;
  const autoFocus = config?.autoFocus || false;
  
  // Load persisted search value if available
  const loadPersistedSearch = useCallback(() => {
    if (!persist || !persistKey || typeof window === 'undefined') {
      return '';
    }
    
    try {
      const saved = localStorage.getItem(`search-${persistKey}`);
      if (saved) {
        return saved;
      }
    } catch (error) {
      console.warn('Failed to load persisted search:', error);
    }
    
    return '';
  }, [persist, persistKey]);
  
  // Raw search input state (before debounce)
  const [searchInput, setSearchInput] = useState<string>(loadPersistedSearch());
  
  // Debounced search value for filtering
  const [debouncedSearchValue, setDebouncedSearchValue] = useState<string>(searchInput);
  
  // Debounce the search value
  useEffect(() => {
    if (!isSearchEnabled) return;
    
    const timeoutId = setTimeout(() => {
      setDebouncedSearchValue(searchInput);
      
      // Persist search value
      if (persist && persistKey && typeof window !== 'undefined') {
        try {
          localStorage.setItem(`search-${persistKey}`, searchInput);
        } catch (error) {
          console.warn('Failed to persist search:', error);
        }
      }
      
      // Call onSearchChange callback if provided
      if (onSearchChange || config?.onChange) {
        if (onSearchChange) {
          onSearchChange(searchInput);
        }
        
        if (config?.onChange) {
          config.onChange(searchInput);
        }
      }
    }, debounceMs);
    
    return () => clearTimeout(timeoutId);
  }, [searchInput, debounceMs, isSearchEnabled, onSearchChange, config, persist, persistKey]);
  
  // Set search value (raw input)
  const setSearchValue = useCallback((value: string) => {
    if (!isSearchEnabled) return;
    setSearchInput(value);
  }, [isSearchEnabled]);
  
  // Clear search
  const clearSearch = useCallback(() => {
    if (!isSearchEnabled) return;
    setSearchInput('');
    setDebouncedSearchValue('');
  }, [isSearchEnabled]);
  
  // Check if search is active
  const isSearchActive = useMemo(() => 
    Boolean(debouncedSearchValue.trim()),
    [debouncedSearchValue]
  );
  
  // Filter data based on search value (client-side)
  const filteredData = useMemo(() => {
    if (!isSearchEnabled || !isSearchActive || serverSide) {
      return data;
    }
    
    const searchTerm = caseSensitive 
      ? debouncedSearchValue.trim() 
      : debouncedSearchValue.trim().toLowerCase();
    
    if (!searchTerm) {
      return data;
    }
    
    return data.filter(row => {
      // Check if any of the search fields contain the search term
      return searchFields.some(field => {
        // Use type-safe approach to check if field exists in row
        if (!(field in row)) {
          return false;
        }
        
        // Access the value using type assertion since TypeScript can't handle dynamic property access well
        const value = (row as Record<string, unknown>)[field];
        
        if (value === undefined || value === null) {
          return false;
        }
        
        // Use the safe toString function from utils instead of direct toString call
        const stringValue = safeToString(value);
        
        if (!caseSensitive) {
          return stringValue.toLowerCase().includes(searchTerm);
        }
        
        return stringValue.includes(searchTerm);
      });
    });
  }, [
    isSearchEnabled,
    isSearchActive,
    serverSide,
    data,
    debouncedSearchValue,
    caseSensitive,
    searchFields
  ]);
  
  return {
    searchValue: searchInput,
    setSearchValue,
    clearSearch,
    filteredData,
    isSearchEnabled,
    placeholder,
    searchFields,
    caseSensitive,
    debounceMs,
    autoFocus,
    isSearchActive
  };
}