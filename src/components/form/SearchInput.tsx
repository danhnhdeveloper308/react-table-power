import React, { forwardRef, useState, useEffect, useId } from 'react';
import { cn } from '../../utils/cn';

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'| 'size'> {
  /**
   * Current search value
   */
  value?: string;
  
  /**
   * Callback when value changes
   */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  
  /**
   * Callback when clear button is clicked
   */
  onClear?: () => void;
  
  /**
   * Debounce time in milliseconds
   * @default 300
   */
  debounceMs?: number;
  
  /**
   * Search icon placement
   * @default 'left'
   */
  iconPosition?: 'left' | 'right' | 'none';
  
  /**
   * Size of the input
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Visual variant
   * @default 'default'
   */
  variant?: 'default' | 'filled' | 'outline' | 'minimal';
  
  /**
   * Will the input fill its container
   * @default false
   */
  fullWidth?: boolean;
  
  /**
   * Custom class for the container
   */
  containerClassName?: string;
  
  /**
   * Placeholder when empty
   * @default 'Search...'
   */
  placeholder?: string;
  
  /**
   * Custom search icon
   */
  searchIcon?: React.ReactNode;
  
  /**
   * Custom clear icon
   */
  clearIcon?: React.ReactNode;
  
  /**
   * Auto focus the input on mount
   * @default false
   */
  autoFocus?: boolean;
  
  /**
   * Whether to show the clear button
   * @default true
   */
  showClearButton?: boolean;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value: propValue = '',
      onChange,
      onClear,
      debounceMs = 300,
      iconPosition = 'left',
      size = 'md',
      variant = 'default',
      fullWidth = false,
      className,
      containerClassName,
      placeholder = 'Search...',
      searchIcon,
      clearIcon,
      autoFocus = false,
      showClearButton = true,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    // Local state for debounced input
    const [localValue, setLocalValue] = useState(propValue);
    
    // Use React's useId hook for stable ID generation
    const generatedId = useId();
    const searchId = id || `search-${generatedId}`;
    
    // Update local state when prop value changes
    useEffect(() => {
      setLocalValue(propValue);
    }, [propValue]);
    
    // Handle debounced input changes
    useEffect(() => {
      if (localValue === propValue) return;
      
      const timeoutId = setTimeout(() => {
        const event = {
          target: { value: localValue },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange?.(event);
      }, debounceMs);
      
      return () => clearTimeout(timeoutId);
    }, [localValue, onChange, debounceMs, propValue]);
    
    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalValue(e.target.value);
    };
    
    // Handle clearing the input
    const handleClear = () => {
      setLocalValue('');
      onClear?.();
    };
    
    // Default search icon
    const defaultSearchIcon = (
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
        className="rpt-search-icon-svg"
      >
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.3-4.3"></path>
      </svg>
    );
    
    // Default clear icon
    const defaultClearIcon = (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="rpt-search-clear-icon-svg"
      >
        <path d="M18 6 6 18"></path>
        <path d="m6 6 12 12"></path>
      </svg>
    );
    
    return (
      <div
        className={cn(
          'rpt-search-container',
          fullWidth && 'rpt-search-full-width',
          containerClassName
        )}
      >
        {/* Search input */}
        <div className="rpt-search-wrapper">
          <input
            ref={ref}
            id={searchId}
            type="text"
            value={localValue}
            onChange={handleChange}
            disabled={disabled}
            placeholder={placeholder}
            className={cn(
              'rpt-search-input',
              'rpt-scrollable', // Add scrollable class for custom scrollbar
              `rpt-search-size-${size}`,
              `rpt-search-${variant}`,
              iconPosition === 'left' && 'rpt-search-input-with-left-icon',
              iconPosition === 'right' && 'rpt-search-input-with-right-icon',
              (showClearButton && localValue) && 'rpt-search-input-with-clear',
              disabled && 'rpt-search-disabled',
              className
            )}
            autoFocus={autoFocus}
            {...props}
          />
          
          {/* Search icon (left position) */}
          {iconPosition === 'left' && (
            <div className="rpt-search-icon rpt-search-icon-left">
              {searchIcon || defaultSearchIcon}
            </div>
          )}
          
          {/* Search icon (right position) */}
          {iconPosition === 'right' && (
            <div className="rpt-search-icon rpt-search-icon-right">
              {searchIcon || defaultSearchIcon}
            </div>
          )}
          
          {/* Clear button */}
          {showClearButton && localValue && (
            <button
              type="button"
              className="rpt-search-clear-button"
              onClick={handleClear}
              disabled={disabled}
              aria-label="Clear search"
            >
              {clearIcon || defaultClearIcon}
            </button>
          )}
        </div>
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

export default SearchInput;