import { useState, useCallback, useMemo, useEffect } from 'react';
import { PaginationState } from '@tanstack/react-table';

interface UseTablePaginationOptions {
  /**
   * Initial page index (0-based)
   */
  initialPageIndex?: number;
  
  /**
   * Initial page size
   */
  initialPageSize?: number;
  
  /**
   * Available page size options
   */
  pageSizeOptions?: number[];
  
  /**
   * Total number of records
   */
  total?: number;
  
  /**
   * Whether pagination is server-side
   */
  serverSide?: boolean;
  
  /**
   * Callback when pagination changes
   */
  onPaginationChange?: (pageIndex: number, pageSize: number) => void;
  
  /**
   * Enable persistence of pagination state
   */
  persist?: boolean;
  
  /**
   * Key for persisting pagination state
   */
  persistKey?: string;
}

interface UseTablePaginationReturn {
  /**
   * Current pagination state
   */
  pagination: PaginationState;
  
  /**
   * Current page (1-based)
   */
  currentPage: number;
  
  /**
   * Current page size
   */
  pageSize: number;
  
  /**
   * Total number of pages
   */
  pageCount: number;
  
  /**
   * Page size options
   */
  pageSizeOptions: number[];
  
  /**
   * Set current page (1-based)
   */
  setPage: (page: number) => void;
  
  /**
   * Set page size
   */
  setPageSize: (pageSize: number) => void;
  
  /**
   * Go to next page
   */
  nextPage: () => void;
  
  /**
   * Go to previous page
   */
  previousPage: () => void;
  
  /**
   * Go to first page
   */
  firstPage: () => void;
  
  /**
   * Go to last page
   */
  lastPage: () => void;
  
  /**
   * Calculate rows range for current page
   */
  getRowRangeLabel: () => { start: number; end: number };
  
  /**
   * Check if can go to previous page
   */
  canPreviousPage: boolean;
  
  /**
   * Check if can go to next page
   */
  canNextPage: boolean;
  
  /**
   * Calculate page numbers to show in pagination
   */
  getVisiblePageNumbers: (maxPages?: number) => number[];
}

/**
 * Hook for managing table pagination
 */
export function useTablePagination({
  initialPageIndex = 0,
  initialPageSize = 10,
  pageSizeOptions = [10, 20, 30, 50, 100],
  total = 0,
  serverSide = false,
  onPaginationChange,
  persist = false,
  persistKey = 'table-pagination',
}: UseTablePaginationOptions): UseTablePaginationReturn {
  // Load persisted pagination if available
  const loadPersistedPagination = useCallback(() => {
    if (!persist || typeof window === 'undefined') {
      return { pageIndex: initialPageIndex, pageSize: initialPageSize };
    }
    
    try {
      const saved = localStorage.getItem(`pagination-${persistKey}`);
      if (saved) {
        const { pageIndex, pageSize } = JSON.parse(saved);
        return { 
          pageIndex: typeof pageIndex === 'number' ? pageIndex : initialPageIndex,
          pageSize: typeof pageSize === 'number' && pageSizeOptions.includes(pageSize) 
            ? pageSize 
            : initialPageSize
        };
      }
    } catch (error) {
      console.warn('Failed to load persisted pagination:', error);
    }
    
    return { pageIndex: initialPageIndex, pageSize: initialPageSize };
  }, [initialPageIndex, initialPageSize, persist, persistKey, pageSizeOptions]);
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>(loadPersistedPagination);
  
  // Persist pagination when it changes
  useEffect(() => {
    if (persist && typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          `pagination-${persistKey}`, 
          JSON.stringify(pagination)
        );
      } catch (error) {
        console.warn('Failed to persist pagination:', error);
      }
    }
    
    // Call onPaginationChange callback if provided
    if (onPaginationChange) {
      onPaginationChange(pagination.pageIndex, pagination.pageSize);
    }
  }, [pagination, persist, persistKey, onPaginationChange]);
  
  // Calculate page count
  const pageCount = useMemo(() => {
    return Math.max(1, Math.ceil(total / pagination.pageSize));
  }, [total, pagination.pageSize]);
  
  // Set current page (1-based)
  const setPage = useCallback((page: number) => {
    const pageIndex = Math.max(0, page - 1); // Convert 1-based to 0-based
    const maxPageIndex = Math.max(0, pageCount - 1);
    
    setPagination(prev => ({
      ...prev,
      pageIndex: Math.min(pageIndex, maxPageIndex)
    }));
  }, [pageCount]);
  
  // Set page size
  const setPageSize = useCallback((size: number) => {
    // Calculate new pageIndex to maintain the top row position
    const currentTopRow = pagination.pageIndex * pagination.pageSize;
    const newPageIndex = Math.floor(currentTopRow / size);
    
    setPagination({
      pageSize: size,
      pageIndex: newPageIndex,
    });
  }, [pagination]);
  
  // Navigation methods
  const nextPage = useCallback(() => {
    setPagination(prev => ({
      ...prev,
      pageIndex: Math.min(prev.pageIndex + 1, pageCount - 1)
    }));
  }, [pageCount]);
  
  const previousPage = useCallback(() => {
    setPagination(prev => ({
      ...prev,
      pageIndex: Math.max(0, prev.pageIndex - 1)
    }));
  }, []);
  
  const firstPage = useCallback(() => {
    setPagination(prev => ({
      ...prev,
      pageIndex: 0
    }));
  }, []);
  
  const lastPage = useCallback(() => {
    setPagination(prev => ({
      ...prev,
      pageIndex: Math.max(0, pageCount - 1)
    }));
  }, [pageCount]);
  
  // Calculate if can navigate to previous/next page
  const canPreviousPage = pagination.pageIndex > 0;
  const canNextPage = pagination.pageIndex < pageCount - 1;
  
  // Calculate row range for current page
  const getRowRangeLabel = useCallback(() => {
    const start = pagination.pageIndex * pagination.pageSize + 1;
    const end = Math.min(
      (pagination.pageIndex + 1) * pagination.pageSize,
      total
    );
    
    return { start, end };
  }, [pagination, total]);
  
  // Calculate page numbers to show in pagination UI
  const getVisiblePageNumbers = useCallback((maxPages: number = 5) => {
    const currentPage = pagination.pageIndex + 1; // 1-based
    const result: number[] = [];
    
    if (pageCount <= maxPages) {
      // Show all pages if total pages is less than or equal to maxPages
      for (let i = 1; i <= pageCount; i++) {
        result.push(i);
      }
    } else {
      // Always include first page
      result.push(1);
      
      let startPage = Math.max(2, currentPage - Math.floor((maxPages - 3) / 2));
      let endPage = Math.min(pageCount - 1, startPage + maxPages - 4);
      
      // Adjust start if end is too close to last page
      if (endPage === pageCount - 1) {
        startPage = Math.max(2, endPage - (maxPages - 4));
      }
      
      // Add ellipsis if start page is not 2
      if (startPage > 2) {
        result.push(-1); // use -1 to indicate ellipsis
      }
      
      // Add visible page numbers
      for (let i = startPage; i <= endPage; i++) {
        result.push(i);
      }
      
      // Add ellipsis if end page is not second to last
      if (endPage < pageCount - 1) {
        result.push(-2); // use -2 to indicate ellipsis
      }
      
      // Always include last page
      result.push(pageCount);
    }
    
    return result;
  }, [pagination.pageIndex, pageCount]);
  
  return {
    pagination,
    currentPage: pagination.pageIndex + 1, // 1-based page for UI
    pageSize: pagination.pageSize,
    pageCount,
    pageSizeOptions,
    setPage,
    setPageSize,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    getRowRangeLabel,
    canPreviousPage,
    canNextPage,
    getVisiblePageNumbers
  };
}