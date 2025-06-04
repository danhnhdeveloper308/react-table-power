import React, { useEffect, useState } from 'react';
import { GlobalSearchConfig } from '../../types';
import { cn } from '../../utils/cn';

interface TableSearchProps {
  /**
   * Value of the search input
   */
  value: string;
  
  /**
   * Callback when search input changes
   */
  onChange: (value: string) => void;
  
  /**
   * Global search configuration
   */
  config?: GlobalSearchConfig;
  
  /**
   * Custom CSS class
   */
  className?: string;
  
  /**
   * Whether search is enabled
   */
  enabled?: boolean;
}

const TableSearch: React.FC<TableSearchProps> = ({
  value,
  onChange,
  config,
  className,
  enabled = true,
}) => {
  // Local state for debounced input
  const [inputValue, setInputValue] = useState(value);
  
  // For debounced search
  const debounceMs = config?.debounceMs || 300;
  
  // Update local state when external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);
  
  // Debounce input changes
  useEffect(() => {
    if (!enabled) return;
    
    const timeoutId = setTimeout(() => {
      if (inputValue !== value) {
        onChange(inputValue);
      }
    }, debounceMs);
    
    return () => clearTimeout(timeoutId);
  }, [inputValue, value, onChange, debounceMs, enabled]);
  
  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  
  // Handle clear search
  const handleClear = () => {
    setInputValue('');
    onChange('');
  };
  
  // If search is disabled, return null
  if (!enabled) {
    return null;
  }
  
  return (
    <div className={cn('rpt-search', className)}>
      <div className="rpt-search-input-wrapper">
        {/* Search icon */}
        <span className="rpt-search-icon">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11.5 11.5L14 14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M7 13C10.3137 13 13 10.3137 13 7C13 3.68629 10.3137 1 7 1C3.68629 1 1 3.68629 1 7C1 10.3137 3.68629 13 7 13Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </span>
        
        {/* Search input */}
        <input
          type="text"
          className="rpt-search-input"
          value={inputValue}
          onChange={handleChange}
          placeholder={config?.placeholder || 'Search...'}
          autoFocus={config?.autoFocus}
          aria-label="Search"
        />
        
        {/* Clear button (only shown when there's a value) */}
        {inputValue && (
          <button
            type="button"
            className="rpt-search-clear"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 4L12 12M4 12L12 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default TableSearch;