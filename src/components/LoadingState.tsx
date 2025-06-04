import React from 'react';
import { cn } from '../utils/cn';
import LoadingSpinner, { LoadingType } from './LoadingSpinner';

export type LoadingVariant = 'overlay' | 'inline' | 'contained' | 'full';

export interface LoadingStateProps {
  /**
   * Whether content is currently loading
   */
  loading?: boolean;
  
  /**
   * Content to display when not loading
   */
  children?: React.ReactNode;
  
  /**
   * Type of loading indicator to display
   */
  loadingType?: LoadingType;
  
  /**
   * Size of the loading indicator
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  
  /**
   * Whether to show overlay on top of content
   */
  overlay?: boolean;
  
  /**
   * Custom class for loading container
   */
  className?: string;
  
  /**
   * Custom loading text to display
   */
  loadingText?: string;
  
  /**
   * Whether to center the loading indicator
   */
  center?: boolean;
  
  /**
   * Custom color for the loading indicator
   */
  color?: string;
  
  /**
   * Variant of loading state display
   * @default 'overlay'
   */
  variant?: LoadingVariant;
}

/**
 * LoadingState component - displays a loading indicator when content is loading
 */
const LoadingState: React.FC<LoadingStateProps> = ({
  loading = false,
  children,
  loadingType = 'spinner',
  size = 'md',
  overlay = false,
  className,
  loadingText,
  center = true,
  color,
  variant = 'overlay'
}: LoadingStateProps) => {
  // If not loading, just render children
  if (!loading && children) {
    return <>{children}</>;
  }
  
  // Determine whether to show overlay based on variant or explicit overlay prop
  const shouldShowOverlay = overlay || variant === 'overlay';
  
  // Create variant-specific class names
  const variantClasses = {
    overlay: 'rpt-loading-overlay-variant',
    inline: 'rpt-loading-inline-variant',
    contained: 'rpt-loading-contained-variant',
    full: 'rpt-loading-full-variant'
  };
  
  // With overlay - show loading on top of children
  if (shouldShowOverlay) {
    return (
      <div className={cn('rpt-loading-container', className)}>
        {children}
        <div className={cn('rpt-loading-overlay', variantClasses[variant])}>
          <div className={cn('rpt-loading-indicator', center && 'rpt-loading-centered')}>
            <LoadingSpinner
              type={loadingType}
              size={size}
              color={color}
              ariaLabel={loadingText || 'Loading'}
            />
            {loadingText && <div className="rpt-loading-text">{loadingText}</div>}
          </div>
        </div>
      </div>
    );
  }
  
  // Inline variant - show just the loading indicator
  if (variant === 'inline') {
    return (
      <span className={cn('rpt-loading-inline', className)}>
        <LoadingSpinner
          type={loadingType}
          size={size}
          color={color}
          ariaLabel={loadingText || 'Loading'}
        />
        {loadingText && <span className="rpt-loading-text">{loadingText}</span>}
      </span>
    );
  }
  
  // Full variant - takes up the whole container
  if (variant === 'full') {
    return (
      <div className={cn('rpt-loading-full', center && 'rpt-loading-centered', className)}>
        <LoadingSpinner
          type={loadingType}
          size={size}
          color={color}
          ariaLabel={loadingText || 'Loading'}
        />
        {loadingText && <div className="rpt-loading-text">{loadingText}</div>}
      </div>
    );
  }
  
  // Default/contained variant
  return (
    <div className={cn('rpt-loading-state', center && 'rpt-loading-centered', className)}>
      <LoadingSpinner
        type={loadingType}
        size={size}
        color={color}
        ariaLabel={loadingText || 'Loading'}
      />
      {loadingText && <div className="rpt-loading-text">{loadingText}</div>}
    </div>
  );
};

export default LoadingState;