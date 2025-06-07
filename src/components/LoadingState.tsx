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

  // Create loading indicator element
  const loadingIndicator = (
    <>
      <LoadingSpinner
        type={loadingType}
        size={size}
        color={color}
        ariaLabel={loadingText || 'Loading'}
      />
      {loadingText && <div className="rpt-loading-text">{loadingText}</div>}
    </>
  );

  // With overlay - show loading on top of children while preserving context
  if (shouldShowOverlay) {
    return (
      <div className={cn('rpt-loading-container', className)}>
        <div className={cn('rpt-loading-content', { 
          'rpt-loading-blur': true,
          'rpt-loading-disabled': true
        })}>
          {children}
        </div>
        <div className="rpt-loading-overlay-background"></div>
        <div className={cn('rpt-loading-indicator', center && 'rpt-loading-centered')}>
          {loadingIndicator}
        </div>
      </div>
    );
  }
  
  // Inline variant - show just the loading indicator
  if (variant === 'inline') {
    return (
      <span className={cn('rpt-loading-inline', className)}>
        {loadingIndicator}
        {loadingText && <span className="rpt-loading-text">{loadingText}</span>}
      </span>
    );
  }
  
  // Full variant - takes up the whole container
  if (variant === 'full') {
    return (
      <div className={cn('rpt-loading-full', center && 'rpt-loading-centered', className)}>
        {loadingIndicator}
      </div>
    );
  }
  
  // Default/contained variant
  return (
    <div className={cn('rpt-loading-state', center && 'rpt-loading-centered', className)}>
      {loadingIndicator}
    </div>
  );
};

export default LoadingState;