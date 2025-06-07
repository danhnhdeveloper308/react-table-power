import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FilterConfig } from '../../types';
import { ChevronDown, Search, Filter, X, Plus, Save, Trash } from '../../icons';

export interface FilterPreset {
  id: string;
  name: string;
  filters: Record<string, any>;
  createdAt: number;
}

export interface AdvancedFilterPanelProps {
  configs: FilterConfig[];
  values: Record<string, any>;
  onFilterChange: (field: string, value: any) => void;
  onClearFilters?: () => void;
  allowPresets?: boolean;
  allowComplexFilters?: boolean;
  initialPresets?: FilterPreset[];
  onPresetsChange?: (presets: FilterPreset[]) => void;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  persistKey?: string;
  labels?: {
    searchPlaceholder?: string;
    clearFiltersButton?: string;
    savePresetButton?: string;
    addFilterButton?: string;
    presetNamePlaceholder?: string;
    noFiltersMessage?: string;
    addGroupButton?: string;
    [key: string]: string | undefined;
  };
}

const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
  configs,
  values,
  onFilterChange,
  onClearFilters,
  allowPresets = false,
  allowComplexFilters = false,
  initialPresets = [],
  onPresetsChange,
  expanded = false,
  onExpandedChange,
  persistKey,
  labels = {}
}) => {
  // State for panel controls
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [searchTerm, setSearchTerm] = useState('');
  const [presetName, setPresetName] = useState('');
  const [presets, setPresets] = useState<FilterPreset[]>(initialPresets || []);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  
  // Refs for tracking DOM elements
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Calculate active filters
  const activeFilters = useMemo(() => {
    return Object.entries(values).filter(([_, value]) => 
      value !== undefined && value !== null && value !== ''
    );
  }, [values]);
  
  const activeFilterCount = activeFilters.length;
  
  // Toggle panel expansion
  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (onExpandedChange) {
      onExpandedChange(newState);
    }
  };
  
  // Effect to load presets from localStorage
  useEffect(() => {
    if (!allowPresets) return;
    
    try {
      const key = `rpt-filter-presets-${persistKey || 'default'}`;
      const storedPresets = localStorage.getItem(key);
      
      if (storedPresets) {
        const parsed = JSON.parse(storedPresets) as FilterPreset[];
        if (Array.isArray(parsed)) {
          setPresets(parsed);
        }
      } else if (initialPresets?.length) {
        setPresets(initialPresets);
      }
    } catch (error) {
      console.error('Error loading filter presets:', error);
    }
  }, [allowPresets, persistKey, initialPresets]);
  
  // Effect to save presets to localStorage
  useEffect(() => {
    if (!allowPresets) return;
    
    try {
      const key = `rpt-filter-presets-${persistKey || 'default'}`;
      localStorage.setItem(key, JSON.stringify(presets));
      
      // Notify parent component
      if (onPresetsChange) {
        onPresetsChange(presets);
      }
    } catch (error) {
      console.error('Error saving filter presets:', error);
    }
  }, [presets, allowPresets, persistKey, onPresetsChange]);
  
  // Save current filters as a preset
  const saveAsPreset = () => {
    if (!presetName.trim() || Object.keys(values).length === 0) return;
    
    const newPreset: FilterPreset = {
      id: `preset-${Date.now()}`,
      name: presetName.trim(),
      filters: { ...values }, // Clone the current filter values
      createdAt: Date.now()
    };
    
    setPresets(prev => [...prev, newPreset]);
    setPresetName('');
    setActivePresetId(newPreset.id);
  };
  
  // Apply a preset
  const applyPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    
    // Clear existing filters first
    if (onClearFilters) onClearFilters();
    
    // Apply preset filters one by one
    Object.entries(preset.filters).forEach(([field, value]) => {
      onFilterChange(field, value);
    });
    
    setActivePresetId(presetId);
  };
  
  // Delete a preset
  const deletePreset = (e: React.MouseEvent, presetId: string) => {
    e.stopPropagation();
    
    setPresets(prev => prev.filter(p => p.id !== presetId));
    
    if (activePresetId === presetId) {
      setActivePresetId(null);
    }
  };
  
  // Clear all filters
  const handleClearFilters = () => {
    if (onClearFilters) onClearFilters();
    setActivePresetId(null);
  };
  
  // Filter configs based on search term
  const filteredConfigs = useMemo(() => {
    if (!searchTerm.trim()) return configs;
    
    const lowercasedSearch = searchTerm.toLowerCase();
    return configs.filter(config => 
      config.label.toLowerCase().includes(lowercasedSearch) || 
      config.key.toLowerCase().includes(lowercasedSearch)
    );
  }, [configs, searchTerm]);
  
  // Handle remove filter
  const handleRemoveFilter = (field: string) => {
    onFilterChange(field, undefined);
    
    // When removing a filter, also clear active preset if set
    if (activePresetId) {
      setActivePresetId(null);
    }
  };
  
  return (
    <div className="rpt-advanced-filter-panel" ref={panelRef}>
      <div 
        className="rpt-filter-panel-header"
        onClick={toggleExpanded}
      >
        <div className="rpt-filter-panel-title">
          <Filter size={16} />
          <span>
            Filters
            {activeFilterCount > 0 && (
              <span className="rpt-filter-count">{activeFilterCount}</span>
            )}
          </span>
        </div>
        <div className="rpt-filter-panel-toggle">
          <ChevronDown 
            size={18} 
            className={`rpt-chevron ${isExpanded ? 'rpt-chevron-up' : ''}`}
          />
        </div>
      </div>
      
      {isExpanded && (
        <div className="rpt-filter-panel-content rpt-scrollable">
          {/* Filter search */}
          <div className="rpt-filter-search">
            <input
              type="text"
              className="rpt-filter-search-input"
              placeholder={labels.searchPlaceholder || "Search filters..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="rpt-filter-search-icon">
              <Search size={16} />
            </div>
          </div>
          
          {/* Filter presets section */}
          {allowPresets && (
            <div className="rpt-filter-presets">
              <div className="rpt-presets-header">
                <h5 className="rpt-presets-title">Saved Filters</h5>
              </div>
              
              {presets.length > 0 && (
                <div className="rpt-presets-list">
                  {presets.map(preset => (
                    <div key={preset.id} className="rpt-preset-item">
                      <button
                        className={`rpt-preset-btn ${activePresetId === preset.id ? 'rpt-preset-active' : ''}`}
                        onClick={() => applyPreset(preset.id)}
                        title={preset.name}
                      >
                        <span className="rpt-preset-name">{preset.name}</span>
                      </button>
                      <button
                        className="rpt-preset-delete"
                        onClick={(e) => deletePreset(e, preset.id)}
                        title="Delete preset"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="rpt-preset-save">
                <input
                  type="text"
                  className="rpt-preset-name-input"
                  placeholder={labels.presetNamePlaceholder || "Preset name"}
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                />
                <button
                  className="rpt-preset-save-btn"
                  onClick={saveAsPreset}
                  disabled={!presetName.trim() || Object.keys(values).length === 0}
                >
                  <Save size={14} />
                  {labels.savePresetButton || "Save Preset"}
                </button>
              </div>
            </div>
          )}
          
          {/* Active filters section */}
          <div className="rpt-filters-main">
            <div className="rpt-filters-section-header">
              <h5 className="rpt-filters-section-title">Active Filters</h5>
            </div>
            
            {activeFilters.length > 0 ? (
              <div className="rpt-filters-grid">
                {activeFilters.map(([field, value]) => {
                  const config = configs.find(c => c.key === field);
                  if (!config) return null;
                  
                  return (
                    <div key={field} className="rpt-filter-item">
                      <div className="rpt-filter-header">
                        <span className="rpt-filter-label" title={config.label}>{config.label}</span>
                        <button
                          className="rpt-filter-remove"
                          onClick={() => handleRemoveFilter(field)}
                          title="Remove filter"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      
                      <FilterControl
                        config={config}
                        value={values[field]}
                        onChange={(value) => onFilterChange(field, value)}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rpt-filters-empty">
                <Filter className="rpt-empty-filter-icon" />
                <span>{labels.noFiltersMessage || "No filters applied"}</span>
              </div>
            )}
          </div>
          
          {/* Available filters list */}
          <div className="rpt-filters-section-header">
            <h5 className="rpt-filters-section-title">Available Filters</h5>
          </div>
          
          <div className="rpt-filters-grid">
            {filteredConfigs.map(config => {
              // Skip if already active
              if (values[config.key] !== undefined && values[config.key] !== null && values[config.key] !== '') {
                return null;
              }
              
              return (
                <div key={config.key} className="rpt-filter-item">
                  <div className="rpt-filter-header">
                    <span className="rpt-filter-label" title={config.label}>{config.label}</span>
                  </div>
                  
                  <FilterControl
                    config={config}
                    value={values[config.key] || ''}
                    onChange={(value) => onFilterChange(config.key, value)}
                  />
                </div>
              );
            })}
          </div>
          
          {/* Actions */}
          <div className="rpt-filters-actions">
            {activeFilterCount > 0 && (
              <button
                className="rpt-clear-filters-btn"
                onClick={handleClearFilters}
              >
                <Trash size={14} />
                {labels.clearFiltersButton || "Clear All"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Component for rendering different filter control types
const FilterControl: React.FC<{
  config: FilterConfig;
  value: any;
  onChange: (value: any) => void;
}> = ({ config, value, onChange }) => {
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };
  
  switch (config.type) {
    case 'select':
      return (
        <div className="rpt-filter-control">
          <select
            className="rpt-filter-input rpt-filter-select"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">All</option>
            {config.options?.map((option) => (
              <option
                key={option.value.toString()}
                value={option.value.toString()}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          {value && (
            <button
              className="rpt-filter-clear"
              onClick={handleClear}
              title="Clear filter"
            >
              <X size={12} />
            </button>
          )}
        </div>
      );
      
    case 'multiselect':
      // Simplified multiselect - could be enhanced with a proper multiselect component
      return (
        <div className="rpt-filter-control">
          <select
            className="rpt-filter-input rpt-filter-select"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            multiple={false} // Simplified for this example
          >
            <option value="">All</option>
            {config.options?.map((option) => (
              <option
                key={option.value.toString()}
                value={option.value.toString()}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          {value && (
            <button
              className="rpt-filter-clear"
              onClick={handleClear}
              title="Clear filter"
            >
              <X size={12} />
            </button>
          )}
        </div>
      );
    
    case 'text':
      return (
        <div className="rpt-filter-control">
          <input
            type="text"
            className="rpt-filter-input"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={config.placeholder || `Filter by ${config.label}`}
          />
          {value && (
            <button
              className="rpt-filter-clear"
              onClick={handleClear}
              title="Clear filter"
            >
              <X size={12} />
            </button>
          )}
        </div>
      );
      
    case 'number':
      return (
        <div className="rpt-filter-control">
          <input
            type="number"
            className="rpt-filter-input"
            value={value || ''}
            onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder={config.placeholder || `Filter by ${config.label}`}
          />
          {value !== '' && value !== undefined && (
            <button
              className="rpt-filter-clear"
              onClick={handleClear}
              title="Clear filter"
            >
              <X size={12} />
            </button>
          )}
        </div>
      );
      
    case 'date':
      return (
        <div className="rpt-filter-control">
          <input
            type="date"
            className="rpt-filter-input"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
          {value && (
            <button
              className="rpt-filter-clear"
              onClick={handleClear}
              title="Clear filter"
            >
              <X size={12} />
            </button>
          )}
        </div>
      );
      
    case 'dateRange':
      // For simplicity, we're just handling a single date value
      // A real dateRange would need more complex UI and state handling
      return (
        <div className="rpt-filter-control">
          <div className="rpt-filter-range">
            <input
              type="date"
              className="rpt-filter-input rpt-filter-range-input"
              value={(value && value.from) || ''}
              onChange={(e) => onChange({ ...value, from: e.target.value })}
              placeholder="From"
            />
            <span className="rpt-filter-range-separator">to</span>
            <input
              type="date"
              className="rpt-filter-input rpt-filter-range-input"
              value={(value && value.to) || ''}
              onChange={(e) => onChange({ ...value, to: e.target.value })}
              placeholder="To"
            />
          </div>
          {value && (value.from || value.to) && (
            <button
              className="rpt-filter-clear"
              onClick={handleClear}
              style={{ top: '25%', right: '0.25rem' }}
              title="Clear filter"
            >
              <X size={12} />
            </button>
          )}
        </div>
      );
      
    case 'boolean':
      return (
        <div className="rpt-filter-control">
          <select
            className="rpt-filter-input rpt-filter-select"
            value={value === undefined ? '' : String(value)}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '') onChange(undefined);
              else if (val === 'true') onChange(true);
              else onChange(false);
            }}
          >
            <option value="">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
          {value !== undefined && (
            <button
              className="rpt-filter-clear"
              onClick={handleClear}
              title="Clear filter"
            >
              <X size={12} />
            </button>
          )}
        </div>
      );
      
    default:
      return (
        <div className="rpt-filter-control">
          <input
            type="text"
            className="rpt-filter-input"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={config.placeholder || `Filter by ${config.label}`}
          />
          {value && (
            <button
              className="rpt-filter-clear"
              onClick={handleClear}
              title="Clear filter"
            >
              <X size={12} />
            </button>
          )}
        </div>
      );
  }
};

export default AdvancedFilterPanel;