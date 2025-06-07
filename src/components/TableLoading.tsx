import React from 'react';
import { cn } from '../utils/cn';
import { LoadingType, LoadingVariant, SpinnerType } from '../types';

export interface TableLoadingProps {
  /**
   * Whether to show loading state
   * @default false
   */
  loading?: boolean;

  /**
   * Type of loading indicator to show
   * @default 'spinner'
   */
  type?: SpinnerType;

  /**
   * Size of the loading indicator
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Variant of the loading state
   * @default 'overlay'
   */
  variant?: LoadingVariant;

  /**
   * Text to display during loading
   * @default 'Loading...'
   */
  text?: string;

  /**
   * Number of skeleton rows to show when using the skeleton variant
   * @default 5
   */
  skeletonRows?: number;

  /**
   * Number of skeleton columns to show when using the skeleton variant
   * @default 4
   */
  skeletonColumns?: number;

  /**
   * Additional CSS class name
   */
  className?: string;
  
  /**
   * Whether to blur the content behind the loading indicator
   * @default true
   */
  blur?: boolean;
  
  /**
   * Whether to disable pointer events during loading
   * @default true
   */
  disablePointerEvents?: boolean;
  
  /**
   * Whether to use reduced motion for accessibility
   * @default false
   */
  reducedMotion?: boolean;
}

export function TableLoading({
  loading = false,
  type = 'spinner',
  size = 'md',
  variant = 'overlay',
  text = 'Loading...',
  skeletonRows = 5,
  skeletonColumns = 4,
  className,
  blur = true,
  disablePointerEvents = true,
  reducedMotion = false,
}: TableLoadingProps): React.ReactElement | null {
  if (!loading) {
    return null;
  }

  // Convert size string to CSS class name
  const sizeClasses = {
    xs: 'rpt-loading--xs',
    sm: 'rpt-loading--sm',
    md: 'rpt-loading--md',
    lg: 'rpt-loading--lg',
    xl: 'rpt-loading--xl',
  }[size] || 'rpt-loading--md';

  // Render skeleton loading
  const renderSkeleton = () => (
    <div className="rpt-table-skeleton">
      <div className="rpt-table-skeleton-header">
        {Array.from({ length: skeletonColumns }).map((_, index) => (
          <div 
            key={`header-cell-${index}`} 
            className="rpt-table-skeleton-cell rpt-skeleton-header-cell"
            style={{ width: `${100 / skeletonColumns}%` }}
          />
        ))}
      </div>
      <div className="rpt-table-skeleton-body">
        {Array.from({ length: skeletonRows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="rpt-table-skeleton-row">
            {Array.from({ length: skeletonColumns }).map((_, colIndex) => (
              <div 
                key={`cell-${rowIndex}-${colIndex}`}
                className="rpt-table-skeleton-cell"
                style={{ width: `${100 / skeletonColumns}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  // Render standard spinner with text
  const renderSpinner = () => (
    <div className="rpt-table-loading-indicator">
      <div className={`rpt-spinner ${sizeClasses}`} />
      {text && <div className="rpt-table-loading-text">{text}</div>}
    </div>
  );

  // If we should show skeleton loading
  if (variant === 'skeleton' || type === 'skeleton') {
    return (
      <div 
        className={cn(
          'rpt-table-loading-skeleton',
          disablePointerEvents && 'rpt-loading-disabled',
          reducedMotion && 'rpt-reduced-motion',
          className
        )}
      >
        {renderSkeleton()}
      </div>
    );
  }

  // Render overlay with spinner
  return (
    <div 
      className={cn(
        'rpt-table-loading',
        `rpt-loading-${variant}`,
        blur && 'rpt-table-loading-blur',
        disablePointerEvents && 'rpt-loading-disabled',
        reducedMotion && 'rpt-reduced-motion',
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy={loading}
    >
      <div className="rpt-loading-overlay-background" />
      <div className="rpt-table-loading-overlay">
        {renderSpinner()}
      </div>
    </div>
  );
}

export default TableLoading;
