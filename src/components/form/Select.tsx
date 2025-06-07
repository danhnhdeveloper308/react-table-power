import React, { forwardRef, useId } from 'react';
import { cn } from '../../utils/cn';

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /**
   * Label text for the select
   */
  label?: React.ReactNode;
  
  /**
   * Array of select options
   */
  options?: SelectOption[];
  
  /**
   * Error message or error state
   */
  error?: boolean | string;
  
  /**
   * Help text displayed below the select
   */
  helpText?: React.ReactNode;
  
  /**
   * Size variant
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Visual style variant
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'filled' | 'unstyled';
  
  /**
   * Make the select take the full width of its container
   * @default false
   */
  fullWidth?: boolean;
  
  /**
   * Custom class for the container
   */
  containerClassName?: string;
  
  /**
   * Custom class for the label
   */
  labelClassName?: string;
  
  /**
   * Placeholder text (shown as first disabled option)
   */
  placeholder?: string;
  
  /**
   * Icon to display at the end of the select
   */
  icon?: React.ReactNode;
  
  /**
   * Whether the select is in a loading state
   * @default false
   */
  isLoading?: boolean;
  
  /**
   * Groups options by key
   */
  groups?: { [key: string]: SelectOption[] };
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      id,
      label,
      options = [],
      error,
      helpText,
      size = 'md',
      variant = 'default',
      className,
      containerClassName,
      labelClassName,
      fullWidth = false,
      disabled,
      placeholder,
      icon,
      isLoading = false,
      groups,
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || `select-${generatedId}`;
    
    // Default chevron icon
    const defaultIcon = (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="rpt-select-icon-svg"
      >
        <path
          d="M4 6L8 10L12 6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
    
    return (
      <div
        className={cn(
          'rpt-select-container',
          fullWidth && 'rpt-select-full-width',
          containerClassName
        )}
      >
        {label && (
          <label
            htmlFor={selectId}
            className={cn(
              'rpt-select-label',
              required && 'rpt-select-required',
              disabled && 'rpt-select-label-disabled',
              labelClassName
            )}
          >
            {label}
          </label>
        )}
        
        <div className={cn(
          'rpt-select-wrapper',
          `rpt-select-${variant}`,
          `rpt-select-size-${size}`,
          error && 'rpt-select-error',
          disabled && 'rpt-select-disabled',
          isLoading && 'rpt-select-loading'
        )}>
          <select
            id={selectId}
            ref={ref}
            disabled={disabled || isLoading}
            className={cn(
              'rpt-select',
              'rpt-scrollable', // Add scrollable class for custom scrollbar
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error
                ? `${selectId}-error`
                : helpText
                ? `${selectId}-description`
                : undefined
            }
            required={required}
            {...props}
          >
            {placeholder && (
              <option value="" disabled={required}>
                {placeholder}
              </option>
            )}
            
            {groups ? (
              // Render grouped options
              Object.entries(groups).map(([groupName, groupOptions]) => (
                <optgroup key={groupName} label={groupName}>
                  {groupOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                    >
                      {option.label}
                    </option>
                  ))}
                </optgroup>
              ))
            ) : (
              // Render flat options list
              options.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))
            )}
          </select>
          
          {/* Select icon or loading indicator */}
          <div className="rpt-select-icon">
            {isLoading ? (
              <svg
                className="rpt-select-spinner"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  className="rpt-select-spinner-track"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeOpacity="0.25"
                  strokeWidth="4"
                />
                <path
                  className="rpt-select-spinner-path"
                  d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22"
                  stroke="currentColor"
                  strokeWidth="4"
                />
              </svg>
            ) : (
              icon || defaultIcon
            )}
          </div>
        </div>
        
        {error && typeof error === 'string' && (
          <div id={`${selectId}-error`} className="rpt-select-error-message">
            {error}
          </div>
        )}
        
        {helpText && !error && (
          <div id={`${selectId}-description`} className="rpt-select-help-text">
            {helpText}
          </div>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;