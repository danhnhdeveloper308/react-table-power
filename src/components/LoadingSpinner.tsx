import React from 'react';
import { cn } from '../utils/cn';

export type LoadingType = 'spinner' | 'dots' | 'progress' | 'slide' | 'circle' | 'pulse' | 'wave';

export interface LoadingSpinnerProps {
  /**
   * Type of loading animation
   * @default 'spinner'
   */
  type?: LoadingType;
  
  /**
   * Size of the loading indicator
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /**
   * Color of the loading indicator
   */
  color?: string;
  
  /**
   * CSS class to apply to the loading container
   */
  className?: string;
  
  /**
   * ARIA label for accessibility
   * @default 'Loading'
   */
  ariaLabel?: string;
}

/**
 * LoadingSpinner component - Displays various loading animations
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  type = 'spinner',
  size = 'md',
  color,
  className,
  ariaLabel = 'Loading',
}) => {
  // Generate size classes
  const sizeClasses = {
    xs: 'rpt-loader--xs',
    sm: 'rpt-loader--sm',
    md: 'rpt-loader--md',
    lg: 'rpt-loader--lg',
    xl: 'rpt-loader--xl',
  };
  
  return (
    <div 
      className={cn(
        'rpt-loader',
        `rpt-loader-${type}`,
        sizeClasses[size],
        className
      )}
      style={{ color }}
      role="status"
      aria-label={ariaLabel}
    >
      {type === 'spinner' && (
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle
            className="rpt-loader-spinner-path"
            cx="12"
            cy="12"
            r="10"
            fill="none"
            strokeWidth="3"
            stroke="currentColor"
          />
        </svg>
      )}
      
      {type === 'dots' && (
        <>
          <span className="rpt-loader-dot" />
          <span className="rpt-loader-dot" />
          <span className="rpt-loader-dot" />
        </>
      )}
      
      {type === 'progress' && (
        <div className="rpt-loader-progress-container">
          <div className="rpt-loader-progress" />
        </div>
      )}
      
      {type === 'slide' && (
        <div className="rpt-loader-slide">
          <div className="rpt-loader-slide-animation" />
        </div>
      )}
      
      {type === 'circle' && (
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle
            className="rpt-loader-circle-path"
            cx="12"
            cy="12"
            r="10"
            fill="none"
            strokeWidth="2.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeDasharray="62.83 62.83" // Circumference of circle with r=10
          />
        </svg>
      )}
      
      {type === 'pulse' && (
        <div className="rpt-loader-pulse" />
      )}
      
      {type === 'wave' && (
        <div className="rpt-loader-wave">
          <span className="rpt-loader-wave-bar" />
          <span className="rpt-loader-wave-bar" />
          <span className="rpt-loader-wave-bar" />
          <span className="rpt-loader-wave-bar" />
          <span className="rpt-loader-wave-bar" />
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;