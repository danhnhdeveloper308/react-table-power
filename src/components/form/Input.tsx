import React, { forwardRef, useId } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Input label
   */
  label?: React.ReactNode;
  
  /**
   * Error message or error state
   */
  error?: string | boolean;
  
  /**
   * Help text shown below the input
   */
  helpText?: React.ReactNode;
  
  /**
   * Left icon or element
   */
  leftIcon?: React.ReactNode;
  
  /**
   * Right icon or element
   */
  rightIcon?: React.ReactNode;
  
  /**
   * Input size
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Visual variant of the input
   * @default 'default'
   */
  variant?: 'default' | 'filled' | 'outline' | 'unstyled';
  
  /**
   * Container className
   */
  containerClassName?: string;
  
  /**
   * Label className
   */
  labelClassName?: string;
  
  /**
   * Make the input fill the width of its container
   * @default false
   */
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id,
      label,
      error,
      helpText,
      leftIcon,
      rightIcon,
      size = 'md',
      variant = 'default',
      className,
      containerClassName,
      labelClassName,
      fullWidth = false,
      disabled,
      type = 'text',
      required,
      ...props
    },
    ref
  ) => {
    // Use React's useId hook for stable ID generation
    const generatedId = useId();
    const inputId = id || `input-${generatedId}`;
    
    return (
      <div 
        className={cn(
          'rpt-input-container',
          fullWidth && 'rpt-input-full-width',
          containerClassName
        )}
      >
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'rpt-input-label',
              required && 'rpt-input-required',
              disabled && 'rpt-input-label-disabled',
              labelClassName
            )}
          >
            {label}
          </label>
        )}
        
        <div className={cn(
          'rpt-input-wrapper',
          leftIcon && 'rpt-input-with-left-icon',
          rightIcon && 'rpt-input-with-right-icon',
          error && 'rpt-input-error',
          disabled && 'rpt-input-disabled',
          `rpt-input-${variant}`,
          `rpt-input-size-${size}`
        )}>
          {leftIcon && (
            <span className="rpt-input-left-icon">
              {leftIcon}
            </span>
          )}
          
          <input
            id={inputId}
            ref={ref}
            type={type}
            disabled={disabled}
            required={required}
            className={cn(
              'rpt-input',
              'rpt-scrollable', // Add scrollable class for custom scrollbar
              error && 'rpt-input-error',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helpText
                ? `${inputId}-description`
                : undefined
            }
            {...props}
          />
          
          {rightIcon && (
            <span className="rpt-input-right-icon">
              {rightIcon}
            </span>
          )}
        </div>
        
        {error && typeof error === 'string' && (
          <div id={`${inputId}-error`} className="rpt-input-error-message">
            {error}
          </div>
        )}
        
        {helpText && !error && (
          <div id={`${inputId}-description`} className="rpt-input-help-text">
            {helpText}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;