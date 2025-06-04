import React, { useState } from 'react';
import { FilterConfig } from '../../types';
import { cn } from '../../utils/cn';

interface TableFilterProps {
  /**
   * Filter configuration
   */
  filter: FilterConfig;
  
  /**
   * Current filter value
   */
  value: any;
  
  /**
   * Callback when filter value changes
   */
  onChange: (value: any) => void;
  
  /**
   * Custom CSS class
   */
  className?: string;
}

export const TableFilter: React.FC<TableFilterProps> = ({ 
  filter, 
  value, 
  onChange, 
  className 
}) => {
  // Local state for filter input before committing (for debounced filters)
  const [localValue, setLocalValue] = useState<any>(value !== undefined ? value : '');
  
  // For debounced text filters
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Handle filter change with optional debounce for text inputs
  const handleChange = (newValue: any, debounce = false) => {
    setLocalValue(newValue);
    
    if (debounce) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      const id = setTimeout(() => {
        onChange(newValue);
      }, 300); // 300ms debounce
      
      setTimeoutId(id);
    } else {
      onChange(newValue);
    }
  };

  // Render filter based on type
  const renderFilter = () => {
    switch (filter.type) {
      case 'text':
        return (
          <input
            type="text"
            className="rpt-filter-input rpt-filter-text"
            value={localValue || ''}
            onChange={(e) => handleChange(e.target.value, true)}
            placeholder={filter.placeholder || `Filter by ${filter.label}`}
          />
        );
        
      case 'select':
        return (
          <select
            className="rpt-filter-input rpt-filter-select"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
          >
            <option value="">All</option>
            {filter.options?.map((option) => (
              <option key={option.value.toString()} value={option.value.toString()}>
                {option.label}
              </option>
            ))}
          </select>
        );
        
      case 'boolean':
        return (
          <select
            className="rpt-filter-input rpt-filter-boolean"
            value={value || 'all'}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'all') {
                handleChange(undefined);
              } else if (val === 'true') {
                handleChange(true);
              } else {
                handleChange(false);
              }
            }}
          >
            <option value="all">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );
        
      case 'number':
        return (
          <div className="rpt-filter-number-range">
            <input
              type="number"
              className="rpt-filter-input rpt-filter-number"
              value={Array.isArray(localValue) ? localValue[0] || '' : localValue || ''}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : Number(e.target.value);
                if (Array.isArray(localValue)) {
                  handleChange([val, localValue[1]], true);
                } else {
                  handleChange(val, true);
                }
              }}
              placeholder={`Min`}
            />
            <span className="rpt-filter-range-separator">-</span>
            <input
              type="number"
              className="rpt-filter-input rpt-filter-number"
              value={Array.isArray(localValue) ? localValue[1] || '' : ''}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : Number(e.target.value);
                if (Array.isArray(localValue)) {
                  handleChange([localValue[0], val], true);
                } else {
                  handleChange([localValue || '', val], true);
                }
              }}
              placeholder={`Max`}
            />
          </div>
        );
        
      case 'date':
        return (
          <input
            type="date"
            className="rpt-filter-input rpt-filter-date"
            value={localValue || ''}
            onChange={(e) => handleChange(e.target.value)}
          />
        );
        
      case 'dateRange':
        return (
          <div className="rpt-filter-date-range">
            <input
              type="date"
              className="rpt-filter-input rpt-filter-date"
              value={Array.isArray(localValue) ? localValue[0] || '' : ''}
              onChange={(e) => {
                const newValue = e.target.value || '';
                if (Array.isArray(localValue)) {
                  handleChange([newValue, localValue[1]]);
                } else {
                  handleChange([newValue, '']);
                }
              }}
              placeholder="From"
            />
            <span className="rpt-filter-range-separator">-</span>
            <input
              type="date"
              className="rpt-filter-input rpt-filter-date"
              value={Array.isArray(localValue) ? localValue[1] || '' : ''}
              onChange={(e) => {
                const newValue = e.target.value || '';
                if (Array.isArray(localValue)) {
                  handleChange([localValue[0], newValue]);
                } else {
                  handleChange(['', newValue]);
                }
              }}
              placeholder="To"
            />
          </div>
        );
        
      case 'custom':
        return filter.render ? 
          filter.render({ onChange, filter }) : 
          <div className="rpt-filter-custom-placeholder">Custom filter</div>;
        
      default:
        return <div>Unknown filter type: {filter.type}</div>;
    }
  };

  return (
    <div className={cn('rpt-filter', `rpt-filter-type-${filter.type}`, className)}>
      <div className="rpt-filter-label">{filter.label}</div>
      <div className="rpt-filter-control">
        {renderFilter()}
        {(value !== undefined && value !== '' && value !== null) && (
          <button
            type="button"
            className="rpt-filter-clear"
            onClick={() => onChange(undefined)}
            aria-label="Clear filter"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default TableFilter;