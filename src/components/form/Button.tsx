import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'primary';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ButtonLoadingType = 'spinner' | 'dots' | 'progress' | 'slide' | 'circle' | 'pulse' | 'wave';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * The visual style of the button
   * @default 'default'
   */
  variant?: ButtonVariant;
  
  /**
   * The size of the button
   * @default 'md'
   */
  size?: ButtonSize;
  
  /**
   * Whether the button is in a loading state
   * @default false
   */
  isLoading?: boolean;
  
  /**
   * The type of loading animation to display
   * @default 'spinner'
   */
  loadingType?: ButtonLoadingType;
  
  /**
   * Text to display when loading
   */
  loadingText?: string;
  
  /**
   * Icon to display at the start of the button
   */
  startIcon?: React.ReactNode;
  
  /**
   * Icon to display at the end of the button
   */
  endIcon?: React.ReactNode;
  
  /**
   * Make the button take the full width of its container
   * @default false
   */
  fullWidth?: boolean;
  
  /**
   * Add elevation effect to the button
   * @default false
   */
  elevated?: boolean;
  
  /**
   * Custom CSS class name
   */
  className?: string;
  
  /**
   * Content of the button
   */
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'default',
      size = 'md',
      isLoading = false,
      loadingType = 'spinner',
      loadingText,
      startIcon,
      endIcon,
      fullWidth = false,
      elevated = false,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    // Render the correct loading indicator based on loadingType
    const renderLoadingIndicator = () => {
      switch (loadingType) {
        case 'dots':
          return (
            <span className="rpt-btn-loader" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </span>
          );
        case 'wave':
          return (
            <span className="rpt-btn-loader" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </span>
          );
        case 'pulse':
          return <span className="rpt-btn-loader" aria-hidden="true"></span>;
        case 'circle':
          return <span className="rpt-btn-loader" aria-hidden="true"></span>;
        case 'progress':
        case 'slide':
        case 'spinner':
        default:
          return <span className="rpt-btn-loader" aria-hidden="true"></span>;
      }
    };
    
    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn(
          'rpt-btn',
          `rpt-btn--${variant}`,
          `rpt-btn--${size}`,
          isLoading && 'rpt-btn--loading',
          isLoading && `rpt-btn--loading-${loadingType}`,
          fullWidth && 'rpt-btn--block',
          elevated && 'rpt-btn--elevated',
          className
        )}
        {...props}
      >
        {isLoading && renderLoadingIndicator()}
        
        {startIcon && !isLoading && (
          <span className="rpt-btn-start-icon">{startIcon}</span>
        )}
        
        <span className="rpt-btn-text">
          {isLoading && loadingText ? loadingText : children}
        </span>
        
        {endIcon && !isLoading && (
          <span className="rpt-btn-end-icon">{endIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;