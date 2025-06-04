import React, { forwardRef, useId } from 'react';
import { cn } from '../../utils/cn';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * The label for the checkbox
   */
  label?: React.ReactNode;
  
  /**
   * Description text shown below the checkbox
   */
  description?: React.ReactNode;
  
  /**
   * Whether the checkbox is in an error state
   */
  error?: boolean | string;
  
  /**
   * Size of the checkbox
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Whether the checkbox is indeterminate
   * @default false
   */
  indeterminate?: boolean;
  
  /**
   * Help text shown below the checkbox
   */
  helpText?: React.ReactNode;
  
  /**
   * Custom class for the container
   */
  containerClassName?: string;
  
  /**
   * Custom class for the label
   */
  labelClassName?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
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
      indeterminate = false,
      disabled,
      helpText,
      checked,
      ...props
    },
    ref
  ) => {
    // Use React's useId hook for stable ID generation
    const generatedId = useId();
    const checkboxId = id || `checkbox-${generatedId}`;

    // Set indeterminate property using a callback ref
    const checkboxRef = React.useCallback(
      (checkbox: HTMLInputElement | null) => {
        if (checkbox) {
          checkbox.indeterminate = indeterminate;
          // Forward the ref if provided
          if (typeof ref === 'function') {
            ref(checkbox);
          } else if (ref) {
            ref.current = checkbox;
          }
        }
      },
      [indeterminate, ref]
    );

    const isChecked = checked || props.defaultChecked || false;

    return (
      <div className={cn('rpt-checkbox-container', containerClassName)}>
        <div className="rpt-checkbox-wrapper">
          <div 
            className={cn(
              'rpt-checkbox-control',
              isChecked && 'rpt-checkbox-control-checked',
              indeterminate && 'rpt-checkbox-control-indeterminate',
              disabled && 'rpt-checkbox-control-disabled'
            )} 
            style={{ position: 'relative' }}
          >
            <input
              type="checkbox"
              id={checkboxId}
              ref={checkboxRef}
              disabled={disabled}
              checked={checked}
              className={cn(
                'rpt-checkbox',
                `rpt-checkbox-${size}`,
                error && 'rpt-checkbox-error',
                disabled && 'rpt-checkbox-disabled',
                indeterminate && 'rpt-checkbox-indeterminate',
                className
              )}
              style={{
                position: 'absolute',
                opacity: 0,
                width: '100%',
                height: '100%',
                top: 0,
                left: 0,
                margin: 0,
                padding: 0,
                cursor: disabled ? 'not-allowed' : 'pointer',
                zIndex: 2
              }}
              {...props}
            />

            {/* Visible indicator - shown when checked or indeterminate */}
            {(isChecked || indeterminate) && (
              <div 
                className={cn(
                  'rpt-checkbox-indicator',
                  `rpt-checkbox-indicator-${size}`
                )}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none'
                }}
              >
                {isChecked && !indeterminate && (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="3"
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="rpt-checkbox-check"
                    style={{ 
                      width: '80%', 
                      height: '80%', 
                      color: 'white',
                      display: 'block'
                    }}
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
                {indeterminate && (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="3"
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="rpt-checkbox-dash"
                    style={{ 
                      width: '80%', 
                      height: '80%', 
                      color: 'white',
                      display: 'block'
                    }}
                  >
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                )}
              </div>
            )}
          </div>
          {label && (
            <label 
              htmlFor={checkboxId} 
              className={cn(
                'rpt-checkbox-label', 
                disabled && 'rpt-checkbox-label-disabled',
                labelClassName
              )}
            >
              {label}
              {description && (
                <span className="rpt-checkbox-description">{description}</span>
              )}
            </label>
          )}
        </div>
        
        {(error || helpText) && (
          <div className={cn('rpt-checkbox-message', error ? 'rpt-checkbox-error-message' : 'rpt-checkbox-help-message')}>
            {typeof error === 'string' ? error : helpText}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;