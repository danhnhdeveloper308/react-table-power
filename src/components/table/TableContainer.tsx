import React, { useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';
import { enableScrollbarHoverDetection } from '../../utils/scrollbarHover';

export interface TableContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Enable responsive behavior with horizontal scrolling
   * @default true
   */
  responsive?: boolean;
  
  /**
   * Maximum height of the table container
   */
  maxHeight?: number | string;
  
  /**
   * Border radius applied to container
   * @default true
   */
  rounded?: boolean;
  
  /**
   * Add box shadow to the container
   * @default true
   */
  shadow?: boolean;
  
  /**
   * Add border to the container
   * @default true
   */
  bordered?: boolean;
  
  /**
   * Whether the container is in loading state
   * @default false
   */
  loading?: boolean;
  
  /**
   * Loading state overlay content
   */
  loadingContent?: React.ReactNode;
  
  /**
   * Loading state variant
   */
  loadingVariant?: 'spinner' | 'skeleton' | 'pulse';

  /**
   * Sticky header for the table
   */
  stickyHeader?: boolean;

  /**
   * Zebra striping for the table rows
   */
  zebra?: boolean;

  /**
   * Striped rows for the table
   */
  striped?: boolean;

  /**
   * Hover effect for the table rows
   */
  hover?: boolean;
}

/**
 * TableContainer - Wraps the table component with proper styling and responsive behavior
 */
export const TableContainer: React.FC<TableContainerProps> = ({
  children,
  responsive = true,
  maxHeight,
  rounded = true,
  shadow = true,
  bordered = true,
  className,
  loading = false,
  loadingContent,
  loadingVariant = 'spinner',
  stickyHeader,
  zebra,
  striped,
  hover,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate specific height style if provided or use default in CSS
  const heightStyle = maxHeight ? { maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight } : {};
  
  // Combine class names with any provided by parent
  const containerClasses = cn(
    'rpt-table-container',
    // Apply special classes at the container level
    stickyHeader && 'rpt-fixed-header',
    className
  );

  // Classes for the scroll container
  const scrollContainerClasses = cn(
    'rpt-scroll-container',
    'rpt-scrollable', // Add the scrollable class for custom scrollbar styling
    (zebra || striped) && 'rpt-zebra-striping',
    hover && 'rpt-table-hover',
    bordered && 'rpt-table-bordered'
  );

  useEffect(() => {
    // Enable scrollbar hover detection
    if (containerRef.current) {
      enableScrollbarHoverDetection(containerRef.current);
    }
  }, []);

  return (
    <div
      className={containerClasses}
      {...props}
    >
      <div 
        className={scrollContainerClasses}
        style={heightStyle}
        ref={containerRef}
      >
        {children}
      </div>
      
      {loading && (
        <div className="rpt-table-loading-overlay">
          {loadingContent || (
            <div className="rpt-loading-container">
              {loadingVariant === 'spinner' && (
                <>
                  <div className="rpt-loading-spinner" />
                  <p className="rpt-loading-text">Loading...</p>
                </>
              )}
              {loadingVariant === 'pulse' && (
                <div className="rpt-loading-container">
                  <div className="rpt-loading-spinner rpt-pulse" />
                  <p className="rpt-loading-text">Loading...</p>
                </div>
              )}
              {loadingVariant === 'skeleton' && (
                <div className="rpt-loading-container">
                  <div className="rpt-loading-skeleton">
                    <div className="rpt-skeleton-line"></div>
                    <div className="rpt-skeleton-line"></div>
                    <div className="rpt-skeleton-line"></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TableContainer;