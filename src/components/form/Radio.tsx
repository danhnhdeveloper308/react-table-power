import React, { forwardRef, useId } from 'react';
import { cn } from '../../utils/cn';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Text label for the radio
   */
  label?: React.ReactNode;
  
  /**
   * Additional description text
   */
  description?: React.ReactNode;
  
  /**
   * Error message or error state
   */
  error?: boolean | string;
  
  /**
   * Size of the radio
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Custom class for the container element
   */
  containerClassName?: string;
  
  /**
   * Custom class for the label
   */
  labelClassName?: string;
  
  /**
   * Help text shown below the radio
   */
  helpText?: React.ReactNode;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      id,
      label,
      description,
      error,
      size = 'md',
      className,
      containerClassName,
      labelClassName,
      disabled,
      helpText,
      ...props
    },
    ref
  ) => {
    // Use React's useId hook for stable ID generation
    const generatedId = useId();
    const radioId = id || `radio-${generatedId}`;
    
    return (
      <div className={cn('rpt-radio-container', containerClassName)}>
        <div className="rpt-radio-wrapper">
          <input
            type="radio"
            id={radioId}
            ref={ref}
            disabled={disabled}
            className={cn(
              'rpt-radio',
              `rpt-radio-${size}`,
              error && 'rpt-radio-error',
              disabled && 'rpt-radio-disabled',
              className
            )}
            {...props}
          />
          
          {label && (
            <label 
              htmlFor={radioId} 
              className={cn(
                'rpt-radio-label',
                disabled && 'rpt-radio-label-disabled',
                labelClassName
              )}
            >
              {label}
              {description && (
                <span className="rpt-radio-description">{description}</span>
              )}
            </label>
          )}
        </div>
        
        {(error || helpText) && (
          <div className={cn('rpt-radio-message', error ? 'rpt-radio-error-message' : 'rpt-radio-help-message')}>
            {typeof error === 'string' ? error : helpText}
          </div>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';

export default Radio;