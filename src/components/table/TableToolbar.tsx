import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { cn } from '../../utils/cn';
import {
  BaseTableData,
  TableColumn,
  FilterConfig,
  GlobalSearchConfig,
  ExportFormat,
  TableThemeConfig,
  TableSize
} from '../../types';
import { Filter, MoreVertical, Refresh } from '../../icons';
import ColumnVisibilityToggle from './ColumnVisibilityToggle';
import AdvancedFilterPanel, { FilterPreset } from './AdvancedFilterPanel';
import { useSafeTableSettings } from '../../hooks/useSafeTableSettings';
import { TableSettings as TableSettingsType } from '../../hooks/useTableSettings';
import TableSettings from './TableSettings';

export interface TableToolbarProps<T extends BaseTableData = BaseTableData> {
  className?: string;
  title?: string;
  description?: string;

  // Global search
  searchValue?: string;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  isSearchActive?: boolean;
  onClearSearch?: () => void;

  // Filters
  filters?: FilterConfig[];
  activeFilters?: Record<string, any>;
  filterValues?: Record<string, any>;
  onFilterChange?: (field: string, value: any) => void;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
  
  // Advanced filtering options
  advancedFiltering?: {
    enabled?: boolean;
    allowPresets?: boolean;
    allowComplexFilters?: boolean;
    initialPresets?: FilterPreset[];
    onPresetsChange?: (presets: FilterPreset[]) => void;
    persistKey?: string;
  };

  // Selection
  selectedCount?: number;
  isAllSelected?: boolean;
  isSomeSelected?: boolean;
  onSelectAll?: () => void;
  onSelectNone?: () => void;
  bulkActions?: { label: string; value: string; icon?: React.ReactNode }[];
  onBulkAction?: (action: string) => void;

  // Export
  export?: { enabled: boolean } | undefined;
  exportFormats?: ExportFormat[];
  onExport?: (format: ExportFormat) => void;
  onExportCurrentView?: () => void;
  onExportSelected?: () => void;

  // Refresh
  onRefresh?: () => void | Promise<void>;

  // Column visibility
  columns?: TableColumn<T>[];
  visibleColumns?: TableColumn<T>[];
  onToggleColumn?: (columnId: string) => void;
  onHideAllColumns?: () => void;
  onShowAllColumns?: () => void;
  onResetColumns?: () => void;
  hasCreated?: boolean;
  createButton?: React.ReactNode;

  // Column visibility object
  columnVisibility?: Record<string, boolean>;

  // Size variants
  size?: 'sm' | 'md' | 'lg';

  // Visual variants
  variant?: 'default' | 'bg-gray' | 'borderless' | 'shadow';

  // Table settings
  onUpdateTableSettings?: <K extends keyof TableSettingsType>(key: K, value: TableSettingsType[K]) => void;
  onTableSettingsChange?: (settings: TableSettingsType) => void;
  tableTheme?: TableThemeConfig;
  tableSize?: TableSize;
  tableStriped?: boolean;
  tableHover?: boolean;
  tableBordered?: boolean;
  tableStickyHeader?: boolean;
  
  // Table Identifier
  /**
   * Current table identifier used for saving settings
   */
  currentTableIdentifier?: string;
  
  /**
   * Callback when a new table identifier is saved
   */
  onSaveTableIdentifier?: (identifier: string) => void;

  /**
   * Selected rows data
   */
  selectedRows?: T[];

  disabled?: boolean;
}

export function TableToolbar<T extends BaseTableData = BaseTableData>({
  className,
  title,
  description,

  // Global search
  searchValue = '',
  onSearch,
  searchPlaceholder = 'Search...',
  isSearchActive,
  onClearSearch,

  // Filters
  filters = [],
  activeFilters = {},
  filterValues = {},
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
  
  // Advanced filtering
  advancedFiltering = { enabled: false },

  // Selection
  selectedCount = 0,
  isAllSelected,
  isSomeSelected,
  onSelectAll,
  onSelectNone,
  bulkActions = [],
  onBulkAction,

  // Export
  export: exportConfig,
  exportFormats = ['csv', 'excel', 'pdf'],
  onExport,
  onExportCurrentView,
  onExportSelected,

  // Refresh
  onRefresh,

  // Column visibility
  columns = [],
  visibleColumns = [],
  onToggleColumn,
  onHideAllColumns,
  onShowAllColumns,
  onResetColumns,
  hasCreated = false,
  createButton,

  // Column visibility object
  columnVisibility,

  // Size variants
  size = 'md',

  // Visual variants
  variant = 'default',

  // Table settings
  onUpdateTableSettings,
  onTableSettingsChange,
  tableTheme,
  tableSize,
  tableStriped,
  tableHover,
  tableBordered,
  tableStickyHeader,
  
  // Table identifier
  currentTableIdentifier,
  onSaveTableIdentifier,

  // Selected rows and batch actions
  selectedRows = [],
  disabled = false
}: TableToolbarProps<T>): React.ReactElement {
  const [showFilters, setShowFilters] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [batchActionLoading, setBatchActionLoading] = useState(false);
  
  // State for advanced filter panel
  const [isAdvancedFilterExpanded, setIsAdvancedFilterExpanded] = useState(false);

  // Initialize table settings hook with useSafeTableSettings to prevent SSR issues
  const {
    settings,
    updateSetting,
    resetSettings,
    getThemeConfig,
    getCurrentStorageKey,
    saveSettingsWithIdentifier,
    isClient
  } = useSafeTableSettings({
    initialSettings: {
      size: tableSize,
      theme: tableTheme?.theme,
      variant: tableTheme?.variant,
      striped: tableStriped,
      hover: tableHover,
      bordered: tableBordered,
      sticky: tableStickyHeader,
      colorScheme: tableTheme?.colorScheme,
      borderRadius: tableTheme?.borderRadius
    },
    tableIdentifier: currentTableIdentifier
  });
  
  // Create fallback implementations for missing methods
  const updateSettings = useCallback((newSettings: Partial<TableSettingsType>) => {
    if (newSettings) {
      // Update each setting individually since updateSettings is not available
      Object.entries(newSettings).forEach(([key, value]) => {
        updateSetting(key as keyof TableSettingsType, value);
      });
    }
  }, [updateSetting]);

  // Find all saved configurations for this table
  const savedConfigurations = useMemo(() => {
    // Only run on client-side
    if (!isClient) return [];
    
    // Fallback implementation for getSavedConfigurations
    try {
      const configs: { id: string; name?: string }[] = [];
      const baseKeyPrefix = 'rpt-settings';
      
      // Skip if we're not in a browser environment
      if (typeof window === 'undefined') return [];
      
      // Get the pathname part of our current key
      const currentKey = getCurrentStorageKey();
      if (!currentKey) return [];
      
      const keyParts = currentKey.split('-');
      // We want everything except the last part (which is the identifier)
      const basePath = keyParts.length > 1 ? keyParts.slice(0, -1).join('-') : currentKey;
      
      // Find all keys that match our base path
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith(baseKeyPrefix)) continue;
        
        // Check if this key is for the same table (same path)
        if (key.startsWith(`${basePath}-`) || key === basePath) {
          // Extract the identifier (last part of key)
          const keyParts = key.split('-');
          const identifier = keyParts[keyParts.length - 1];
          
          configs.push({
            id: identifier,
            name: identifier // We could add custom names in the future
          });
        }
      }
      
      return configs;
    } catch (error) {
      console.warn('Error fetching saved configurations:', error);
      return [];
    }
  }, [getCurrentStorageKey, isClient]);

  const hasSelectedRows = selectedCount > 0;
  const isExportEnabled = exportConfig?.enabled !== false;
  const isAdvancedFilterEnabled = advancedFiltering?.enabled === true && filters.length > 0;
  
  // Determine if we're using standard or advanced filtering
  const useStandardFiltering = filters.length > 0 && !isAdvancedFilterEnabled;
  const useAdvancedFiltering = filters.length > 0 && isAdvancedFilterEnabled;

  // Refs for dropdown menus
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Close filter dropdown
      if (
        showFilters &&
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target as Node)
      ) {
        setShowFilters(false);
      }

      // Close export dropdown
      if (
        showExportOptions &&
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(event.target as Node)
      ) {
        setShowExportOptions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilters, showExportOptions]);

  // Show batch actions when rows are selected
  useEffect(() => {
    setShowBatchActions(selectedRows.length > 0);
  }, [selectedRows]);

  // Handle refresh with animation and proper async support
  const handleRefresh = useCallback(async () => {
    if (!onRefresh || isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      
      // Call the refresh handler (could be async)
      const refreshResult = onRefresh();
      
      // If the refresh handler returns a promise, wait for it
      if (refreshResult && typeof refreshResult === 'object' && 'then' in refreshResult) {
        await refreshResult;
      }
      
      console.log('[TableToolbar] Data refresh completed successfully');
    } catch (error) {
      console.error('[TableToolbar] Error during data refresh:', error);
      // Could emit an error event here if needed
    } finally {
      // Reset refreshing state after animation
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    }
  }, [onRefresh, isRefreshing]);

  // Handle table settings update
  const handleUpdateSetting = useCallback(<K extends keyof TableSettingsType>(key: K, value: TableSettingsType[K]) => {
    // Update local settings
    updateSetting?.(key, value);

    // Call parent handler if provided
    if (onUpdateTableSettings) {
      onUpdateTableSettings(key, value);
    }

    // Notify about all settings change
    if (onTableSettingsChange && settings) {
      // Get updated settings and pass to callback
      const updatedSettings = { ...settings, [key]: value };
      onTableSettingsChange(updatedSettings);
    }
  }, [updateSetting, onUpdateTableSettings, onTableSettingsChange, settings]);
  
  // Handle saving table identifier
  const handleSaveTableIdentifier = useCallback((identifier: string) => {
    if (onSaveTableIdentifier) {
      onSaveTableIdentifier(identifier);
    }
  }, [onSaveTableIdentifier]);

  // Handle saving all table settings with tableIdentifier
  const handleSaveAllSettings = useCallback((identifier: string) => {
    if (!identifier.trim() || !isClient) return;
    
    try {
      // Save settings with new identifier using the hook function
      const success = saveSettingsWithIdentifier?.(identifier);
      
      if (success) {
        // Notify parent component about identifier change
        if (onSaveTableIdentifier) {
          onSaveTableIdentifier(identifier);
        }
        
        // Show success message to the user
        alert('Settings have been saved successfully! The page will reload to apply changes.');
        
        // Reload the page after a short delay to apply settings
        setTimeout(() => {
          window.location.reload();
        }, 300);
      } else {
        alert('Failed to save settings. Please try again.');
      }
    } catch (error) {
      console.error('Error saving table settings:', error);
      alert('An error occurred while saving settings.');
    }
  }, [saveSettingsWithIdentifier, onSaveTableIdentifier, isClient]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    if (!filterValues) return 0;
    return Object.values(filterValues).filter(v => v !== undefined && v !== null && v !== '').length;
  }, [filterValues]);

  // Extract table identifier from the storage key if not provided explicitly
  const effectiveTableIdentifier = useMemo(() => {
    // Only extract table identifier on client-side
    if (!isClient) return currentTableIdentifier || '';
    
    // Directly use currentTableIdentifier if provided
    if (currentTableIdentifier) return currentTableIdentifier;
    
    // Try to extract it from storage key if available
    try {
      const key = getCurrentStorageKey();
      if (key) {
        const parts = key.split('-');
        // Last part is typically the identifier
        if (parts.length > 1) {
          return parts[parts.length - 1];
        }
      }
    } catch (e) {
      console.warn("Error extracting table identifier:", e);
    }
    
    return ''; // Fallback to empty string
  }, [currentTableIdentifier, isClient, getCurrentStorageKey]);

  return (
    <>
      <div
        className={cn(
          'rpt-toolbar',
          hasSelectedRows && 'rpt-toolbar-with-selection',
          size === 'sm' && 'rpt-toolbar--sm',
          size === 'lg' && 'rpt-toolbar--lg',
          variant === 'bg-gray' && 'rpt-toolbar--bg-gray',
          variant === 'borderless' && 'rpt-toolbar--borderless',
          variant === 'shadow' && 'rpt-toolbar--shadow',
          className
        )}
      >
        {/* Main toolbar content */}
        {/* Left section: Title and Description */}
        <div className="rpt-toolbar-left">
          {title && <h3 className="rpt-toolbar-title">{title}</h3>}
          {description && <p className="rpt-toolbar-description">{description}</p>}
        </div>

        {/* Right section: Search, Filters, and Actions */}
        <div className="rpt-toolbar-right">
          {/* Standard Filter button */}
          {useStandardFiltering && onFilterChange && (
            <div className="rpt-filter-dropdown" ref={filterDropdownRef}>
              <button
                className={cn(
                  'rpt-toolbar-btn rpt-filter-btn',
                  activeFilterCount > 0 && 'rpt-filter-active'
                )}
                onClick={() => setShowFilters(!showFilters)}
                title="Filter data"
              >
                <Filter size={16} className="rpt-toolbar-btn-icon rpt-filter-icon" />
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <span className="rpt-filter-badge">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {showFilters && (
                <div className="rpt-column-dropdown">
                  <div className="rpt-column-header">
                    <h4 className="rpt-column-title">Filters</h4>
                    {activeFilterCount > 0 && onClearFilters && (
                      <div className="rpt-column-actions">
                        <button
                          className="rpt-column-action-btn"
                          onClick={onClearFilters}
                        >
                          Clear all
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="rpt-column-list">
                    <div className="rpt-filters-grid">
                      {filters.map((filter) => (
                        <div key={filter.key} className="rpt-filter">
                          <div className="rpt-filter-label">{filter.label}</div>
                          <div className="rpt-filter-control">
                            {filter.type === 'select' && (
                              <select
                                className="rpt-filter-input rpt-filter-select"
                                value={filterValues[filter.key] || ''}
                                onChange={(e) => onFilterChange(filter.key, e.target.value)}
                              >
                                <option value="">All</option>
                                {filter.options?.map((option) => (
                                  <option
                                    key={option.value.toString()}
                                    value={option.value.toString()}
                                    disabled={option.disabled}
                                  >
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            )}

                            {filter.type === 'text' && (
                              <input
                                type="text"
                                className="rpt-filter-input"
                                value={filterValues[filter.key] || ''}
                                onChange={(e) => onFilterChange(filter.key, e.target.value)}
                                placeholder={filter.placeholder || `Filter by ${filter.label}`}
                              />
                            )}

                            {filter.type === 'number' && (
                              <input
                                type="number"
                                className="rpt-filter-input"
                                value={filterValues[filter.key] || ''}
                                onChange={(e) => onFilterChange(filter.key, e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder={filter.placeholder || `Filter by ${filter.label}`}
                              />
                            )}

                            {filter.type === 'date' && (
                              <input
                                type="date"
                                className="rpt-filter-input"
                                value={filterValues[filter.key] || ''}
                                onChange={(e) => onFilterChange(filter.key, e.target.value)}
                              />
                            )}

                            {filter.type === 'boolean' && (
                              <select
                                className="rpt-filter-input rpt-filter-select"
                                value={filterValues[filter.key] === undefined ? '' : String(filterValues[filter.key])}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '') {
                                    onFilterChange(filter.key, undefined);
                                  } else if (value === 'true') {
                                    onFilterChange(filter.key, true);
                                  } else {
                                    onFilterChange(filter.key, false);
                                  }
                                }}
                              >
                                <option value="">All</option>
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                              </select>
                            )}

                            {(filterValues[filter.key] !== undefined &&
                              filterValues[filter.key] !== '' &&
                              filterValues[filter.key] !== null) && (
                                <button
                                  className="rpt-filter-clear"
                                  onClick={() => onFilterChange(filter.key, undefined)}
                                  aria-label="Clear filter"
                                >
                                  ×
                                </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Global search */}
          <div className="rpt-toolbar-search">
            {onSearch && (
              <>
                <input
                  type="text"
                  className="rpt-toolbar-search-input"
                  value={searchValue}
                  onChange={(e) => onSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                />
                <div className="rpt-toolbar-search-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.3-4.3"></path>
                  </svg>
                </div>
                {searchValue && (
                  <button
                    className="rpt-toolbar-search-clear"
                    onClick={onClearSearch}
                    aria-label="Clear search"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Table Settings - Only render when client-side */}
          {isClient && (
            <TableSettings
              settings={settings}
              onUpdateSetting={handleUpdateSetting}
              onResetSettings={resetSettings}
              onSaveTableIdentifier={handleSaveTableIdentifier}
              currentTableIdentifier={effectiveTableIdentifier}
              onSaveAllSettings={handleSaveAllSettings}
              savedConfigurations={savedConfigurations}
            />
          )}

          {/* Toolbar section with buttons */}
          <div className="rpt-toolbar-section">
            

            {/* Create button */}
            {createButton && (
              <div className="rpt-add-button">
                {createButton}
              </div>
            )}

            {/* Refresh button */}
            {onRefresh && (
              <button
                className="rpt-refresh-btn"
                onClick={handleRefresh}
                title="Refresh data"
                disabled={isRefreshing || disabled}
              >
                <Refresh
                  size={16}
                  className={cn("rpt-refresh-icon", isRefreshing && "rpt-refresh-spin")}
                />
                <span className="rpt-refresh-text">
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </span>
              </button>
            )}

            {/* Export */}
            {isExportEnabled && onExport && (
              <div className="rpt-export-dropdown" ref={exportDropdownRef}>
                <button
                  className="rpt-toolbar-btn rpt-export-btn"
                  onClick={() => setShowExportOptions(!showExportOptions)}
                  title="Export data"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="rpt-toolbar-btn-icon rpt-export-icon"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span>Export</span>
                </button>

                {showExportOptions && (
                  <div className="rpt-column-dropdown">
                    <div className="rpt-column-header">
                      <h4 className="rpt-column-title">Export data</h4>
                    </div>
                    <div className="rpt-column-list">
                      {onExportCurrentView && (
                        <button
                          className="rpt-dropdown-item"
                          onClick={() => {
                            onExportCurrentView();
                            setShowExportOptions(false);
                          }}
                        >
                          Export current view
                        </button>
                      )}

                      {exportFormats.map((format) => (
                        <button
                          key={format}
                          className="rpt-dropdown-item"
                          onClick={() => {
                            onExport(format);
                            setShowExportOptions(false);
                          }}
                        >
                          Export as {format.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Column visibility */}
            {columns.length > 0 && onToggleColumn && (
              <div className="rpt-column-visibility">
                <ColumnVisibilityToggle
                  columns={columns.filter(col => col.enableHiding !== false)}
                  visibleColumns={visibleColumns}
                  onToggleColumn={onToggleColumn}
                  onShowAllColumns={onShowAllColumns}
                  onHideAllColumns={onHideAllColumns}
                  onResetColumns={onResetColumns}
                  columnVisibility={columnVisibility}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Advanced Filter Panel - shown below the toolbar */}
        {useAdvancedFiltering && onFilterChange && (
          <AdvancedFilterPanel
            configs={filters}
            values={filterValues || {}}
            onFilterChange={onFilterChange}
            onClearFilters={onClearFilters}
            allowPresets={advancedFiltering.allowPresets}
            initialPresets={advancedFiltering.initialPresets}
            onPresetsChange={advancedFiltering.onPresetsChange}
            expanded={isAdvancedFilterExpanded}
            onExpandedChange={setIsAdvancedFilterExpanded}
            allowComplexFilters={advancedFiltering.allowComplexFilters}
            persistKey={advancedFiltering.persistKey || effectiveTableIdentifier}
            labels={{
              searchPlaceholder: 'Search filters...',
              clearFiltersButton: 'Clear All Filters',
              savePresetButton: 'Save as Preset',
              addFilterButton: 'Add Filter',
              presetNamePlaceholder: 'Preset name',
              noFiltersMessage: 'No filters applied',
              addGroupButton: 'Add Filter Group',
            }}
          />
        )}
      </div>
    </>
  );
}

export default TableToolbar;
