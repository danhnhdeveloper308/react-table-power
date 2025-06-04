import React, { useState, useRef, useEffect, useMemo } from 'react';
import { cn } from '../../utils/cn';
import { FilterConfig, FilterType } from '../../types';
import { generateId } from '../../utils';

// Icons
import { Filter, X, ChevronDown, ChevronUp, Plus, Save, Trash, Search, Settings, Check, Edit } from '../../icons';

// Export this interface so it can be used by other components
export interface FilterPreset {
  id: string;
  name: string;
  filters: Record<string, any>;
  createdAt?: number;
  updatedAt?: number;
}

export interface FilterGroup {
  id: string;
  filters: Record<string, any>;
  operator?: 'AND' | 'OR';
}

export interface AdvancedFilterPanelLabels {
  searchPlaceholder?: string;
  clearFiltersButton?: string;
  savePresetButton?: string;
  addFilterButton?: string;
  presetNamePlaceholder?: string;
  noFiltersMessage?: string;
  addGroupButton?: string;
}

export interface AdvancedFilterPanelProps {
  /**
   * Available filter configurations
   */
  configs: FilterConfig[];

  /**
   * Current filter values
   */
  values: Record<string, any>;

  /**
   * Callback when a filter value changes
   */
  onFilterChange: (field: string, value: any) => void;

  /**
   * Callback to clear all filters
   */
  onClearFilters?: () => void;

  /**
   * Whether to allow saving filter presets
   */
  allowPresets?: boolean;

  /**
   * Initial filter presets
   */
  initialPresets?: FilterPreset[];

  /**
   * Callback when presets change
   */
  onPresetsChange?: (presets: FilterPreset[]) => void;

  /**
   * Whether the panel is expanded
   */
  expanded?: boolean;

  /**
   * Callback when the expanded state changes
   */
  onExpandedChange?: (expanded: boolean) => void;

  /**
   * Whether to allow complex filtering with groups
   */
  allowComplexFilters?: boolean;

  /**
   * Optional filter groups for complex filtering
   */
  filterGroups?: FilterGroup[];

  /**
   * Callback when a filter group is added
   */
  onAddFilterGroup?: () => void;

  /**
   * Callback when a filter group is removed
   */
  onRemoveFilterGroup?: (groupId: string) => void;

  /**
   * Callback when a filter group is updated
   */
  onUpdateFilterGroup?: (groupId: string, filters: Record<string, any>) => void;

  /**
   * Callback when a filter group operator is changed
   */
  onSetFilterGroupOperator?: (groupId: string, operator: 'AND' | 'OR') => void;

  /**
   * Key for persisting filter presets
   */
  persistKey?: string;

  /**
   * Custom labels for the panel
   */
  labels?: AdvancedFilterPanelLabels;

  /**
   * Class name for the panel
   */
  className?: string;
}

/**
 * An advanced filter panel that supports complex filtering and filter presets
 */
export const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
  configs,
  values = {},
  onFilterChange,
  onClearFilters,
  allowPresets = false,
  initialPresets = [],
  onPresetsChange,
  expanded = false,
  onExpandedChange,
  allowComplexFilters = false,
  filterGroups = [],
  onAddFilterGroup,
  onRemoveFilterGroup,
  onUpdateFilterGroup,
  onSetFilterGroupOperator,
  persistKey,
  labels = {},
  className,
}) => {
  // State
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [selectedConfig, setSelectedConfig] = useState<FilterConfig | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [filterSearch, setFilterSearch] = useState('');
  const [presets, setPresets] = useState<FilterPreset[]>(initialPresets || []);
  const [showPresetsPanel, setShowPresetsPanel] = useState(false);
  const [editingPreset, setEditingPreset] = useState<FilterPreset | null>(null);
  const [newPresetName, setNewPresetName] = useState('');
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [draggedFilterKey, setDraggedFilterKey] = useState<string | null>(null);
  const [dragOverFilterKey, setDragOverFilterKey] = useState<string | null>(null);
  const [isDraggingGroup, setIsDraggingGroup] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [filterHistory, setFilterHistory] = useState<Array<Record<string, any>>>([]);

  // Refs
  const presetsContainerRef = useRef<HTMLDivElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  // Parse labels with defaults
  const panelLabels = {
    searchPlaceholder: labels.searchPlaceholder || 'Search filters...',
    clearFiltersButton: labels.clearFiltersButton || 'Clear All Filters',
    savePresetButton: labels.savePresetButton || 'Save as Preset',
    addFilterButton: labels.addFilterButton || 'Add Filter',
    presetNamePlaceholder: labels.presetNamePlaceholder || 'Preset name',
    noFiltersMessage: labels.noFiltersMessage || 'No filters applied',
    addGroupButton: labels.addGroupButton || 'Add Filter Group',
  };

  // Update expanded state when prop changes
  useEffect(() => {
    setIsExpanded(expanded);
  }, [expanded]);

  // Sync active filters when values change
  useEffect(() => {
    const active = Object.keys(values).filter(
      (key) => values[key] !== undefined && values[key] !== null && values[key] !== ''
    );
    setActiveFilters(active);

    // Add to filter history if values changed and not due to history navigation
    if (historyIndex === filterHistory.length - 1 || historyIndex === -1) {
      // Only add to history if values are different from the last entry
      if (
        filterHistory.length === 0 ||
        JSON.stringify(values) !== JSON.stringify(filterHistory[filterHistory.length - 1])
      ) {
        setFilterHistory((prev) => [...prev, { ...values }]);
        setHistoryIndex(filterHistory.length);
      }
    }
  }, [values]);

  // Sync presets with initialPresets prop
  useEffect(() => {
    if (initialPresets && initialPresets.length > 0) {
      setPresets(initialPresets);
    }
  }, [initialPresets]);

  // Load presets from localStorage if persistKey is provided
  useEffect(() => {
    if (persistKey && typeof window !== 'undefined' && allowPresets) {
      try {
        const savedPresets = localStorage.getItem(`filter-presets-${persistKey}`);
        if (savedPresets) {
          const parsedPresets = JSON.parse(savedPresets) as FilterPreset[];
          if (Array.isArray(parsedPresets) && parsedPresets.length > 0) {
            setPresets(parsedPresets);
          }
        }
      } catch (error) {
        console.warn('Failed to load filter presets:', error);
      }
    }
  }, [persistKey, allowPresets]);

  // Save presets to localStorage when they change
  useEffect(() => {
    if (persistKey && typeof window !== 'undefined' && allowPresets) {
      try {
        localStorage.setItem(`filter-presets-${persistKey}`, JSON.stringify(presets));
      } catch (error) {
        console.warn('Failed to save filter presets:', error);
      }
    }

    // Call onPresetsChange callback if provided
    if (onPresetsChange) {
      onPresetsChange(presets);
    }
  }, [presets, persistKey, allowPresets, onPresetsChange]);

  // Close presets panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        presetsContainerRef.current &&
        !presetsContainerRef.current.contains(event.target as Node)
      ) {
        setShowPresetsPanel(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter configs based on search
  const filteredConfigs = useMemo(() => {
    if (!filterSearch) return configs;
    return configs.filter((config) =>
      config.label.toLowerCase().includes(filterSearch.toLowerCase())
    );
  }, [configs, filterSearch]);

  // Group configs by category if they have one
  const groupedConfigs = useMemo(() => {
    const groups: Record<string, FilterConfig[]> = {
      ungrouped: [],
    };
    
    filteredConfigs.forEach((config) => {
      const category = config.meta?.category || 'ungrouped';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(config);
    });
    
    return groups;
  }, [filteredConfigs]);

  // Handle toggle expand
  const handleToggleExpand = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    if (onExpandedChange) {
      onExpandedChange(newExpandedState);
    }
  };

  // Handle filter change
  const handleFilterChange = (key: string, value: any) => {
    onFilterChange(key, value);
  };

  // Handle clear all filters
  const handleClearAllFilters = () => {
    if (onClearFilters) {
      onClearFilters();
    }
  };

  // Handle saving a preset
  const handleSavePreset = () => {
    // Don't save if there are no active filters or if the name is empty
    if (activeFilters.length === 0 || (editingPreset === null && !newPresetName.trim())) {
      return;
    }

    const timestamp = Date.now();
    
    if (editingPreset) {
      // Update existing preset
      const updatedPresets = presets.map((preset) =>
        preset.id === editingPreset.id
          ? {
              ...preset,
              filters: { ...values },
              updatedAt: timestamp,
            }
          : preset
      );
      setPresets(updatedPresets);
      setEditingPreset(null);
    } else {
      // Create new preset
      const newPreset: FilterPreset = {
        id: generateId('preset'),
        name: newPresetName.trim(),
        filters: { ...values },
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      setPresets([...presets, newPreset]);
      setNewPresetName('');
    }

    setShowPresetsPanel(false);
  };

  // Handle loading a preset
  const handleLoadPreset = (preset: FilterPreset) => {
    // Apply preset filters
    Object.keys(preset.filters).forEach((key) => {
      onFilterChange(key, preset.filters[key]);
    });

    // Clear any filters not in the preset
    Object.keys(values).forEach((key) => {
      if (preset.filters[key] === undefined) {
        onFilterChange(key, undefined);
      }
    });

    setActivePreset(preset.id);
    setShowPresetsPanel(false);
  };

  // Handle deleting a preset
  const handleDeletePreset = (presetId: string) => {
    setPresets(presets.filter((preset) => preset.id !== presetId));
    if (activePreset === presetId) {
      setActivePreset(null);
    }
  };

  // Handle editing a preset
  const handleEditPreset = (preset: FilterPreset) => {
    setEditingPreset(preset);
    setNewPresetName(preset.name);
  };

  // Handle adding a new filter group
  const handleAddFilterGroup = () => {
    if (onAddFilterGroup) {
      onAddFilterGroup();
    }
  };

  // Handle removing a filter group
  const handleRemoveFilterGroup = (groupId: string) => {
    if (onRemoveFilterGroup) {
      onRemoveFilterGroup(groupId);
    }
  };

  // Handle updating a filter group
  const handleUpdateFilterGroup = (groupId: string, field: string, value: any) => {
    if (onUpdateFilterGroup) {
      const currentGroup = filterGroups.find((group) => group.id === groupId);
      if (currentGroup) {
        const updatedFilters = {
          ...currentGroup.filters,
          [field]: value,
        };

        // Remove filter if value is undefined, null, or empty string
        if (value === undefined || value === null || value === '') {
          delete updatedFilters[field];
        }

        onUpdateFilterGroup(groupId, updatedFilters);
      }
    }
  };

  // Handle setting a filter group operator
  const handleSetFilterGroupOperator = (groupId: string, operator: 'AND' | 'OR') => {
    if (onSetFilterGroupOperator) {
      onSetFilterGroupOperator(groupId, operator);
    }
  };

  // Handle undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      
      // Apply the previous state from history
      const previousState = filterHistory[newIndex];
      
      // Clear current filters first
      if (onClearFilters) {
        onClearFilters();
      }
      
      // Then apply filters from history
      Object.entries(previousState).forEach(([key, value]) => {
        onFilterChange(key, value);
      });
    }
  };

  // Handle redo
  const handleRedo = () => {
    if (historyIndex < filterHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      
      // Apply the next state from history
      const nextState = filterHistory[newIndex];
      
      // Clear current filters first
      if (onClearFilters) {
        onClearFilters();
      }
      
      // Then apply filters from history
      Object.entries(nextState).forEach(([key, value]) => {
        onFilterChange(key, value);
      });
    }
  };

  // Handle drag start for filter reordering
  const handleDragStart = (e: React.DragEvent, filterKey: string) => {
    setDraggedFilterKey(filterKey);
    e.dataTransfer.setData('text/plain', filterKey);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over for filter reordering
  const handleDragOver = (e: React.DragEvent, filterKey: string) => {
    e.preventDefault();
    if (draggedFilterKey !== filterKey) {
      setDragOverFilterKey(filterKey);
    }
  };

  // Handle drop for filter reordering
  const handleDrop = (e: React.DragEvent, filterKey: string) => {
    e.preventDefault();
    
    // For now, we don't actually reorder since the filters object is not ordered
    // This would need to be implemented differently with an ordered array of filters
    
    setDraggedFilterKey(null);
    setDragOverFilterKey(null);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedFilterKey(null);
    setDragOverFilterKey(null);
  };

  // Render filter control based on filter type
  const renderFilterControl = (filter: FilterConfig, value: any, onChange: (value: any) => void) => {
    switch (filter.type) {
      case 'text':
        return (
          <input
            type="text"
            className="rpt-filter-input"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={filter.placeholder || `Filter by ${filter.label}`}
          />
        );

      case 'select':
        return (
          <select
            className="rpt-filter-input rpt-filter-select"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">All</option>
            {filter.options?.map((option) => (
              <option key={String(option.value)} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'boolean':
        return (
          <select
            className="rpt-filter-input rpt-filter-select"
            value={value === undefined ? '' : String(value)}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '') {
                onChange(undefined);
              } else if (val === 'true') {
                onChange(true);
              } else {
                onChange(false);
              }
            }}
          >
            <option value="">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );

      case 'date':
        return (
          <input
            type="date"
            className="rpt-filter-input"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case 'dateRange':
        return (
          <div className="rpt-filter-date-range">
            <input
              type="date"
              className="rpt-filter-input rpt-filter-date-from"
              value={(Array.isArray(value) && value[0]) || ''}
              onChange={(e) => {
                const from = e.target.value;
                const to = Array.isArray(value) && value[1] ? value[1] : '';
                onChange([from, to]);
              }}
              placeholder="From"
            />
            <span className="rpt-filter-date-separator">to</span>
            <input
              type="date"
              className="rpt-filter-input rpt-filter-date-to"
              value={(Array.isArray(value) && value[1]) || ''}
              onChange={(e) => {
                const from = Array.isArray(value) && value[0] ? value[0] : '';
                const to = e.target.value;
                onChange([from, to]);
              }}
              placeholder="To"
            />
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            className="rpt-filter-input"
            value={value || ''}
            onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder={filter.placeholder || `Filter by ${filter.label}`}
          />
        );

      case 'custom':
        if (filter.render) {
          return filter.render({ onChange, filter });
        }
        return null;

      default:
        return (
          <input
            type="text"
            className="rpt-filter-input"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={filter.placeholder || `Filter by ${filter.label}`}
          />
        );
    }
  };

  // Count currently active filters
  const activeFilterCount = activeFilters.length;

  return (
    <div
      className={cn(
        'rpt-advanced-filter-panel',
        isExpanded && 'rpt-advanced-filter-panel-expanded',
        className
      )}
      ref={filterPanelRef}
    >
      {/* Filter panel header - designed to match the image */}
      <div className="rpt-advanced-filter-header" onClick={handleToggleExpand}>
        <div className="rpt-advanced-filter-header-content">
          <div className="rpt-advanced-filter-icon">
            <Filter size={16} />
          </div>
          <div className="rpt-advanced-filter-title">
            {activeFilterCount > 0
              ? `${activeFilterCount} bộ lọc được áp dụng`
              : 'Thêm bộ lọc...'}
          </div>
        </div>
        
        <div className="rpt-advanced-filter-actions">
          {activeFilterCount > 0 && (
            <button
              className="rpt-advanced-filter-clear-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleClearAllFilters();
              }}
              title={panelLabels.clearFiltersButton}
            >
              Xoá tất cả
            </button>
          )}
          
          {(historyIndex > 0 || historyIndex < filterHistory.length - 1) && (
            <>
              <button
                className={cn(
                  'rpt-advanced-filter-action-btn',
                  historyIndex <= 0 && 'rpt-advanced-filter-action-btn-disabled'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  handleUndo();
                }}
                disabled={historyIndex <= 0}
                aria-label="Undo"
                title="Undo"
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
                  <path d="M9 14 4 9l5-5" />
                  <path d="M4 9h12a4 4 0 0 1 4 4v3" />
                </svg>
              </button>
              
              <button
                className={cn(
                  'rpt-advanced-filter-action-btn',
                  (historyIndex >= filterHistory.length - 1 || filterHistory.length === 0) &&
                    'rpt-advanced-filter-action-btn-disabled'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRedo();
                }}
                disabled={historyIndex >= filterHistory.length - 1 || filterHistory.length === 0}
                aria-label="Redo"
                title="Redo"
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
                  <path d="m15 14 5-5-5-5" />
                  <path d="M20 9H8a4 4 0 0 0-4 4v3" />
                </svg>
              </button>
            </>
          )}
          
          <ChevronDown
            className={cn('transition-transform', isExpanded && 'rotate-180')}
            size={18}
          />
        </div>
      </div>

      {/* Filter panel content - only shown when expanded */}
      {isExpanded && (
        <div className="rpt-advanced-filter-content">
          {/* Filter search and add group button */}
          <div className="rpt-advanced-filter-toolbar">
            <div className="rpt-advanced-filter-search">
              <div className="rpt-advanced-filter-search-icon">
                <Search size={16} />
              </div>
              <input
                type="text"
                className="rpt-advanced-filter-search-input"
                placeholder={panelLabels.searchPlaceholder}
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
              />
            </div>
            
            {allowComplexFilters && onAddFilterGroup && (
              <button
                className="rpt-advanced-filter-add-group-btn"
                onClick={handleAddFilterGroup}
                aria-label={panelLabels.addGroupButton}
              >
                <Plus size={16} />
                <span>{panelLabels.addGroupButton}</span>
              </button>
            )}
          </div>

          {/* Active filters section */}
          {activeFilterCount > 0 && (
            <div className="rpt-active-filters">
              <div className="rpt-active-filters-title">
                <span>Bộ lọc đã áp dụng</span>
                {activeFilterCount > 0 && (
                  <button 
                    className="rpt-advanced-filter-clear-btn"
                    onClick={handleClearAllFilters}
                  >
                    Xoá tất cả
                  </button>
                )}
              </div>
              
              <div className="rpt-active-filters-list">
                {activeFilters.map(key => {
                  const filter = configs.find(c => c.key === key);
                  if (!filter) return null;
                  
                  let displayValue = '';
                  const value = values[key];
                  
                  if (filter.type === 'select' && filter.options) {
                    const option = filter.options.find(o => String(o.value) === String(value));
                    displayValue = option ? option.label : String(value);
                  } else if (filter.type === 'boolean') {
                    displayValue = value ? 'Yes' : 'No';
                  } else {
                    displayValue = String(value);
                  }
                  
                  // Truncate long values
                  if (displayValue.length > 30) {
                    displayValue = displayValue.substring(0, 27) + '...';
                  }
                  
                  return (
                    <div key={key} className="rpt-active-filter">
                      <span className="rpt-active-filter-label">{filter.label}:</span>
                      <span className="rpt-active-filter-value">{displayValue}</span>
                      <button
                        className="rpt-active-filter-remove"
                        onClick={() => handleFilterChange(key, undefined)}
                        aria-label={`Remove ${filter.label} filter`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filter presets section */}
          {allowPresets && (
            <div className="rpt-filter-presets" ref={presetsContainerRef}>
              <div className="rpt-presets-header">
                <span className="rpt-presets-title">Preset</span>
                
                <div className="rpt-preset-actions">
                  {activeFilterCount > 0 && (
                    <button
                      className="rpt-preset-btn"
                      onClick={() => setShowPresetsPanel(!showPresetsPanel)}
                      aria-label={panelLabels.savePresetButton}
                    >
                      <Save size={14} /> Save
                    </button>
                  )}
                </div>
              </div>
              
              {presets.length > 0 && (
                <div className="rpt-presets-list">
                  {presets.map(preset => (
                    <div key={preset.id} className="rpt-preset-item">
                      <button
                        className={cn('rpt-preset-btn', activePreset === preset.id && 'rpt-preset-active')}
                        onClick={() => handleLoadPreset(preset)}
                      >
                        {preset.name}
                      </button>
                      <button
                        className="rpt-active-filter-remove"
                        onClick={() => handleDeletePreset(preset.id)}
                        aria-label={`Delete preset ${preset.name}`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {showPresetsPanel && (
                <div className="rpt-preset-save">
                  <input
                    type="text"
                    className="rpt-preset-name-input"
                    placeholder={panelLabels.presetNamePlaceholder}
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                  />
                  <button
                    className="rpt-preset-save-btn"
                    onClick={handleSavePreset}
                    disabled={!newPresetName.trim() && !editingPreset}
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Main filter inputs */}
          <div className="rpt-advanced-filter-items">
            {Object.entries(groupedConfigs).map(([category, categoryConfigs]) => (
              <div key={category} className="rpt-advanced-filter-category">
                {category !== 'ungrouped' && (
                  <div className="rpt-advanced-filter-category-header">
                    {category}
                  </div>
                )}
                
                <div className="rpt-advanced-filter-category-items">
                  {categoryConfigs.map(filter => {
                    const isActive = values[filter.key] !== undefined && values[filter.key] !== null && values[filter.key] !== '';
                    return (
                      <div 
                        key={filter.key}
                        className={cn("rpt-filter-item", isActive && "rpt-filter-item-active")}
                      >
                        <div className="rpt-filter-item-header">
                          <div className="rpt-filter-item-label">{filter.label}</div>
                          {isActive && (
                            <button
                              className="rpt-filter-item-remove"
                              onClick={() => handleFilterChange(filter.key, undefined)}
                              aria-label={`Remove ${filter.label} filter`}
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                        <div className="rpt-filter-item-content">
                          {renderFilterControl(
                            filter, 
                            values[filter.key], 
                            value => handleFilterChange(filter.key, value)
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {/* Empty state */}
            {filteredConfigs.length === 0 && (
              <div className="rpt-advanced-filter-empty">
                No matching filters found. Try adjusting your search.
              </div>
            )}
          </div>

          {/* Filter groups section */}
          {allowComplexFilters && filterGroups.length > 0 && (
            <div className="rpt-filter-groups">
              <h4>Filter Groups</h4>
              {filterGroups.map(group => {
                const hasActiveFilters = Object.keys(group.filters).length > 0;
                return (
                  <div
                    key={group.id}
                    className={cn('rpt-filter-group', hasActiveFilters && 'rpt-filter-group-active')}
                  >
                    <div className="rpt-filter-group-header">
                      <div className="rpt-filter-group-title">Filter Group</div>
                      <div className="rpt-filter-group-actions">
                        <select
                          className="rpt-filter-group-operator"
                          value={group.operator || 'AND'}
                          onChange={(e) => handleSetFilterGroupOperator(group.id, e.target.value as 'AND' | 'OR')}
                          aria-label="Group operator"
                        >
                          <option value="AND">AND</option>
                          <option value="OR">OR</option>
                        </select>
                        <button
                          className="rpt-filter-group-remove"
                          onClick={() => handleRemoveFilterGroup(group.id)}
                          aria-label="Remove filter group"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="rpt-filter-group-filters">
                      {configs.map((filter) => {
                        const value = group.filters[filter.key];
                        const isActive = value !== undefined && value !== null && value !== '';
                        return (
                          <div
                            key={`${group.id}-${filter.key}`}
                            className={cn('rpt-filter-item', isActive && 'rpt-filter-item-active')}
                          >
                            <div className="rpt-filter-item-header">
                              <div className="rpt-filter-item-label">{filter.label}</div>
                              {isActive && (
                                <button
                                  className="rpt-filter-item-remove"
                                  onClick={() => handleUpdateFilterGroup(group.id, filter.key, undefined)}
                                  aria-label={`Remove ${filter.label} filter`}
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                            <div className="rpt-filter-item-content">
                              {renderFilterControl(
                                filter,
                                value,
                                (v) => handleUpdateFilterGroup(group.id, filter.key, v)
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Show message when no active filters */}
          {activeFilterCount === 0 && filteredConfigs.length > 0 && (
            <div className="rpt-advanced-filter-no-active">
              {panelLabels.noFiltersMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedFilterPanel;