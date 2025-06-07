import React, { useState } from 'react';
import { FilterConfig, FilterOption, FilterType } from '../../types';

export interface FilterComponentProps {
  config: FilterConfig;
  value: any;
  onChange: (value: any) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Select Filter Component
 */
export function SelectFilter({ config, value, onChange, size = 'md', className }: FilterComponentProps) {
  return (
    <div className="rpt-filter">
      <div className="rpt-filter-label">{config.label}</div>
      <div className="rpt-filter-control">
        <select
          className="rpt-filter-input rpt-filter-select"
          value={value || ''}
          onChange={(e) => onChange(e.target.value || undefined)}
        >
          <option value="">{config.placeholder || 'All'}</option>
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
            onClick={() => onChange(undefined)}
            aria-label={`Clear ${config.label} filter`}
            title="Clear filter"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Text Filter Component
 */
export function TextFilter({ config, value, onChange, size = 'md', className }: FilterComponentProps) {
  return (
    <div className="rpt-filter">
      <div className="rpt-filter-label">{config.label}</div>
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
            onClick={() => onChange(undefined)}
            aria-label={`Clear ${config.label} filter`}
            title="Clear filter"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Number Filter Component
 */
export function NumberFilter({ config, value, onChange, size = 'md', className }: FilterComponentProps) {
  return (
    <div className="rpt-filter">
      <div className="rpt-filter-label">{config.label}</div>
      <div className="rpt-filter-control">
        <input
          type="number"
          className="rpt-filter-input"
          value={value || ''}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
          placeholder={config.placeholder || `Filter by ${config.label}`}
        />
        {(value !== undefined && value !== null) && (
          <button
            className="rpt-filter-clear"
            onClick={() => onChange(undefined)}
            aria-label={`Clear ${config.label} filter`}
            title="Clear filter"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Date Filter Component
 */
export function DateFilter({ config, value, onChange, size = 'md', className }: FilterComponentProps) {
  return (
    <div className="rpt-filter">
      <div className="rpt-filter-label">{config.label}</div>
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
            onClick={() => onChange(undefined)}
            aria-label={`Clear ${config.label} filter`}
            title="Clear filter"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Boolean Filter Component
 */
export function BooleanFilter({ config, value, onChange, size = 'md', className }: FilterComponentProps) {
  return (
    <div className="rpt-filter">
      <div className="rpt-filter-label">{config.label}</div>
      <div className="rpt-filter-control">
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
        {value !== undefined && (
          <button
            className="rpt-filter-clear"
            onClick={() => onChange(undefined)}
            aria-label={`Clear ${config.label} filter`}
            title="Clear filter"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Date Range Filter Component
 */
export function DateRangeFilter({ config, value, onChange, size = 'md', className }: FilterComponentProps) {
  // Initialize with empty range if not set
  const range = value || { start: '', end: '' };
  
  // Handle start date change
  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...range, start: e.target.value });
  };
  
  // Handle end date change
  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...range, end: e.target.value });
  };
  
  return (
    <div className="rpt-filter">
      <div className="rpt-filter-label">{config.label}</div>
      <div className="rpt-filter-date-range">
        <input
          type="date"
          className="rpt-filter-input"
          value={range.start}
          onChange={handleStartChange}
          placeholder="Start date"
        />
        <span className="rpt-filter-range-separator">to</span>
        <input
          type="date"
          className="rpt-filter-input"
          value={range.end}
          onChange={handleEndChange}
          placeholder="End date"
        />
        
        {(range.start || range.end) && (
          <button
            className="rpt-filter-clear"
            onClick={() => onChange(undefined)}
            aria-label={`Clear ${config.label} filter`}
            title="Clear filter"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Number Range Filter Component
 */
export function NumberRangeFilter({ config, value, onChange, size = 'md', className }: FilterComponentProps) {
  // Initialize with empty range if not set
  const range = value || { min: '', max: '' };
  
  // Handle min value change
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...range, min: e.target.value === '' ? '' : Number(e.target.value) });
  };
  
  // Handle max value change
  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...range, max: e.target.value === '' ? '' : Number(e.target.value) });
  };
  
  return (
    <div className="rpt-filter">
      <div className="rpt-filter-label">{config.label}</div>
      <div className="rpt-filter-number-range">
        <input
          type="number"
          className="rpt-filter-input"
          value={range.min}
          onChange={handleMinChange}
          placeholder="Min"
        />
        <span className="rpt-filter-range-separator">to</span>
        <input
          type="number"
          className="rpt-filter-input"
          value={range.max}
          onChange={handleMaxChange}
          placeholder="Max"
        />
        
        {(range.min !== '' || range.max !== '') && (
          <button
            className="rpt-filter-clear"
            onClick={() => onChange(undefined)}
            aria-label={`Clear ${config.label} filter`}
            title="Clear filter"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Multi-select Filter Component
 */
export function MultiSelectFilter({ config, value, onChange, size = 'md', className }: FilterComponentProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Convert value to array if not already
  const selectedValues = Array.isArray(value) ? value : (value ? [value] : []);
  
  // Toggle selection of an option
  const toggleOption = (optionValue: any) => {
    if (selectedValues.includes(optionValue)) {
      onChange(selectedValues.filter(v => v !== optionValue));
    } else {
      onChange([...selectedValues, optionValue]);
    }
  };
  
  return (
    <div className="rpt-filter">
      <div className="rpt-filter-label">{config.label}</div>
      <div className="rpt-filter-control">
        <div 
          className="rpt-filter-input rpt-multiselect-display"
          onClick={() => setIsOpen(!isOpen)}
        >
          {selectedValues.length === 0 ? (
            <span className="rpt-multiselect-placeholder">{config.placeholder || 'Select options'}</span>
          ) : (
            <div className="rpt-multiselect-values">
              {config.options
                ?.filter(opt => selectedValues.includes(opt.value))
                .map(opt => opt.label)
                .join(', ')}
            </div>
          )}
          <div className="rpt-multiselect-indicators">
            {selectedValues.length > 0 && (
              <button
                className="rpt-filter-clear"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent dropdown from toggling
                  onChange([]);
                }}
                aria-label={`Clear ${config.label} filter`}
                title="Clear selections"
              >
                ×
              </button>
            )}
            <div className="rpt-multiselect-arrow">▼</div>
          </div>
        </div>
        
        {isOpen && (
          <div className="rpt-multiselect-dropdown">
            {config.options?.map((option) => (
              <div 
                key={option.value.toString()} 
                className="rpt-multiselect-option"
                onClick={() => toggleOption(option.value)}
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={() => {}} // Handled by parent div click
                  readOnly
                />
                <span>{option.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Factory function to create a filter component based on filter type
 */
export function createFilterComponent(config: FilterConfig, value: any, onChange: (value: any) => void) {
  switch (config.type) {
    case 'select':
      return <SelectFilter config={config} value={value} onChange={onChange} />;
    case 'text':
      return <TextFilter config={config} value={value} onChange={onChange} />;
    case 'number':
      return <NumberFilter config={config} value={value} onChange={onChange} />;
    case 'date':
      return <DateFilter config={config} value={value} onChange={onChange} />;
    case 'boolean':
      return <BooleanFilter config={config} value={value} onChange={onChange} />;
    case 'dateRange':
      return <DateRangeFilter config={config} value={value} onChange={onChange} />;
    case 'multiselect':
      return <MultiSelectFilter config={config} value={value} onChange={onChange} />;
    default:
      return <TextFilter config={config} value={value} onChange={onChange} />;
  }
}
