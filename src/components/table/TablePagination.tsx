import React, { useState, useMemo } from 'react';
import { cn } from '../../utils/cn';
import { motion } from 'framer-motion';
import { paginationControlsVariants } from '../../motions/motion';

export interface TablePaginationProps {
  /**
   * Current page number (1-based)
   */
  currentPage: number;
  
  /**
   * Number of items per page
   */
  pageSize: number;
  
  /**
   * Total number of records
   */
  totalRecords: number;
  
  /**
   * Page size options
   */
  pageSizeOptions?: number[];
  
  /**
   * Whether to show page size dropdown
   */
  showPageSizeOptions?: boolean;
  
  /**
   * Whether to show jump to page input
   */
  showJumpToPage?: boolean;
  
  /**
   * Whether to show total records count
   */
  showTotalRecords?: boolean;
  
  /**
   * Number of pages to show in pagination
   */
  siblingCount?: number;
  
  /**
   * Handle page change
   */
  onPageChange: (page: number) => void;
  
  /**
   * Handle page size change
   */
  onPageSizeChange?: (pageSize: number) => void;
  
  /**
   * Visual variant of the pagination
   * @default 'default'
   */
  variant?: 'default' | 'compact' | 'simple' | 'bordered';
  
  /**
   * Custom className
   */
  className?: string;
}

/**
 * TablePagination component - Provides pagination controls for the table
 */
export const TablePagination = ({
  currentPage,
  pageSize,
  totalRecords,
  pageSizeOptions = [10, 20, 50, 100],
  showPageSizeOptions = true,
  showJumpToPage = false,
  showTotalRecords = true,
  siblingCount = 1,
  onPageChange,
  onPageSizeChange,
  variant = 'default',
  className
}: TablePaginationProps) => {
  // Local state for jump to page input
  const [jumpToPageValue, setJumpToPageValue] = useState<string>('');
  
  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  
  // Generate page numbers to display based on current page and sibling count
  const pageNumbers = useMemo(() => {
    const totalPageNumbers = siblingCount * 2 + 3; // siblings on both sides + first + current + last
    
    if (totalPageNumbers >= totalPages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);
    
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;
    
    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 1 + 2 * siblingCount;
      return [
        ...Array.from({ length: leftItemCount }, (_, i) => i + 1),
        'dots',
        totalPages
      ];
    }
    
    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 1 + 2 * siblingCount;
      return [
        1,
        'dots',
        ...Array.from(
          { length: rightItemCount },
          (_, i) => totalPages - rightItemCount + i + 1
        )
      ];
    }
    
    return [
      1,
      'dots',
      ...Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      ),
      'dots',
      totalPages
    ];
  }, [currentPage, totalPages, siblingCount]);
  
  // Handle page change
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
  };
  
  // Handle page size change
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value, 10);
    if (onPageSizeChange) {
      onPageSizeChange(newSize);
    }
  };
  
  // Handle jump to page
  const handleJumpToPage = () => {
    const page = parseInt(jumpToPageValue, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page);
      setJumpToPageValue('');
    }
  };
  
  // Handle jump to page input change
  const handleJumpToPageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setJumpToPageValue(e.target.value);
  };
  
  // Handle jump to page key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleJumpToPage();
    }
  };
  
  // Calculate the range of records shown
  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);
  
  return (
    <motion.div 
      className={cn(
        'rpt-pagination-container',
        `rpt-pagination-${variant}`,
        className
      )}
      variants={paginationControlsVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Pagination info */}
      {showTotalRecords && (
        <div className="rpt-pagination-info">
          {totalRecords > 0
            ? `${startRecord}-${endRecord} of ${totalRecords} items`
            : 'No items'
          }
        </div>
      )}
      
      {/* Pagination controls */}
      <div className="rpt-pagination-controls">
        {/* Page size selector */}
        {showPageSizeOptions && onPageSizeChange && (
          <div className="rpt-page-size-selector">
            <label className="rpt-page-size-label">Rows per page:</label>
            <select
              className="rpt-page-size-select"
              value={pageSize}
              onChange={handlePageSizeChange}
              aria-label="Rows per page"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Previous button */}
        <button
          className="rpt-prev-button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous page"
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        
        {/* Page numbers */}
        {pageNumbers.map((pageNumber, index) => {
          if (pageNumber === 'dots') {
            return (
              <span key={`dots-${index}`} className="rpt-page-ellipsis">
                &hellip;
              </span>
            );
          }
          
          return (
            <button
              key={pageNumber}
              className={cn(
                'rpt-page-button',
                currentPage === pageNumber && 'rpt-page-active'
              )}
              onClick={() => handlePageChange(pageNumber as number)}
              aria-current={currentPage === pageNumber ? 'page' : undefined}
              aria-label={`Page ${pageNumber}`}
            >
              {pageNumber}
            </button>
          );
        })}
        
        {/* Next button */}
        <button
          className="rpt-next-button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
        
        {/* Jump to page */}
        {showJumpToPage && (
          <div className="rpt-jump-to-page">
            <span className="rpt-jump-label">Go to:</span>
            <input
              className="rpt-jump-input"
              type="text"
              value={jumpToPageValue}
              onChange={handleJumpToPageInput}
              onKeyPress={handleKeyPress}
              aria-label="Jump to page"
            />
            <button
              className="rpt-page-button"
              onClick={handleJumpToPage}
              aria-label="Go to page"
            >
              Go
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TablePagination;