/**
 * Hook for virtualizing large datasets in tables
 * Uses react-virtual for efficient rendering of large lists
 */

import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { BaseTableData } from '../types';

export interface VirtualizationConfig {
  enabled?: boolean;
  itemHeight?: number | ((index: number) => number);
  overscan?: number;
  threshold?: number; // Minimum number of rows to enable virtualization
  estimatedItemSize?: number;
  getScrollElement?: () => Element | null;
}

export interface UseVirtualizationOptions<T extends BaseTableData> {
  data: T[];
  config?: VirtualizationConfig;
  containerRef: React.RefObject<HTMLElement>;
}

export interface UseVirtualizationReturn<T extends BaseTableData> {
  virtualizer: ReturnType<typeof useVirtualizer> | null;
  virtualData: T[];
  isVirtualized: boolean;
  totalSize: number;
  scrollToIndex: (index: number) => void;
  scrollToTop: () => void;
  measureElement: (element: Element | null) => void;
}

const DEFAULT_CONFIG: Required<VirtualizationConfig> = {
  enabled: true,
  itemHeight: 50,
  overscan: 5,
  threshold: 100,
  estimatedItemSize: 50,
  getScrollElement: () => null,
};

export function useVirtualization<T extends BaseTableData>({
  data,
  config = {},
  containerRef,
}: UseVirtualizationOptions<T>): UseVirtualizationReturn<T> {
  const mergedConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);
  const [measureCache] = useState(() => new Map<number, number>());
  
  // Determine if virtualization should be enabled
  const shouldVirtualize = useMemo(() => {
    return (
      mergedConfig.enabled &&
      data.length >= mergedConfig.threshold &&
      containerRef.current
    );
  }, [mergedConfig.enabled, mergedConfig.threshold, data.length, containerRef.current]);

  // Get scroll element
  const getScrollElement = useCallback(() => {
    if (mergedConfig.getScrollElement) {
      return mergedConfig.getScrollElement();
    }
    return containerRef.current;
  }, [mergedConfig.getScrollElement, containerRef]);

  // Create virtualizer instance
  const virtualizer = useMemo(() => {
    if (!shouldVirtualize || !containerRef.current) {
      return null;
    }

    return useVirtualizer({
      count: data.length,
      getScrollElement,
      estimateSize: (index: number) => {
        // Check cache first
        if (measureCache.has(index)) {
          return measureCache.get(index)!;
        }
        
        // Use dynamic sizing if provided
        if (typeof mergedConfig.itemHeight === 'function') {
          return mergedConfig.itemHeight(index);
        }
        
        // Use static size or estimated size
        return mergedConfig.itemHeight || mergedConfig.estimatedItemSize;
      },
      overscan: mergedConfig.overscan,
      // Enable dynamic sizing
      measureElement: (element) => {
        if (!element) return undefined;
        
        const index = parseInt(element.getAttribute('data-index') || '0', 10);
        const size = element.getBoundingClientRect().height;
        
        measureCache.set(index, size);
        return size;
      },
    });
  }, [
    shouldVirtualize,
    data.length,
    getScrollElement,
    mergedConfig.itemHeight,
    mergedConfig.estimatedItemSize,
    mergedConfig.overscan,
    measureCache,
    containerRef,
  ]);

  // Get virtual data (visible items)
  const virtualData = useMemo(() => {
    if (!virtualizer || !shouldVirtualize) {
      return data;
    }

    const virtualItems = virtualizer.getVirtualItems();
    return virtualItems.map(item => data[item.index]);
  }, [virtualizer, shouldVirtualize, data]);

  // Scroll functions
  const scrollToIndex = useCallback((index: number) => {
    if (virtualizer) {
      virtualizer.scrollToIndex(index, { align: 'start' });
    }
  }, [virtualizer]);

  const scrollToTop = useCallback(() => {
    if (virtualizer) {
      virtualizer.scrollToOffset(0);
    }
  }, [virtualizer]);

  // Measure element function
  const measureElement = useCallback((element: Element | null) => {
    if (virtualizer && element) {
      virtualizer.measureElement(element);
    }
  }, [virtualizer]);

  // Get total size
  const totalSize = useMemo(() => {
    return virtualizer?.getTotalSize() || 0;
  }, [virtualizer]);

  return {
    virtualizer,
    virtualData,
    isVirtualized: shouldVirtualize,
    totalSize,
    scrollToIndex,
    scrollToTop,
    measureElement,
  };
}

// Hook for auto-sizing row heights
export function useAutoSizeRows<T extends BaseTableData>(
  data: T[],
  containerRef: React.RefObject<HTMLElement>
) {
  const [rowHeights, setRowHeights] = useState<Map<number, number>>(new Map());
  const observerRef = useRef<ResizeObserver | null>(null);

  const measureRow = useCallback((index: number, element: HTMLElement) => {
    const height = element.getBoundingClientRect().height;
    setRowHeights(prev => new Map(prev).set(index, height));
  }, []);

  const getRowHeight = useCallback((index: number) => {
    return rowHeights.get(index) || 50; // Default height
  }, [rowHeights]);

  // Set up ResizeObserver for dynamic height measurement
  useEffect(() => {
    if (!containerRef.current) return;

    observerRef.current = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const element = entry.target as HTMLElement;
        const index = parseInt(element.getAttribute('data-index') || '0', 10);
        if (!isNaN(index)) {
          measureRow(index, element);
        }
      });
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [measureRow, containerRef]);

  const observeElement = useCallback((element: HTMLElement | null, index: number) => {
    if (!element || !observerRef.current) return;
    
    element.setAttribute('data-index', index.toString());
    observerRef.current.observe(element);
    
    // Initial measurement
    measureRow(index, element);
  }, [measureRow]);

  return {
    getRowHeight,
    observeElement,
    rowHeights,
  };
}

// Utility for creating virtualized table components
export function createVirtualizedTable<T extends BaseTableData>() {
  return {
    useVirtualization: (options: UseVirtualizationOptions<T>) => 
      useVirtualization(options),
    useAutoSizeRows: (data: T[], containerRef: React.RefObject<HTMLElement>) =>
      useAutoSizeRows(data, containerRef),
  };
}

// Performance monitoring hook for virtualization
export function useVirtualizationPerformance() {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    visibleItems: 0,
    totalItems: 0,
    scrollPosition: 0,
  });

  const startMeasure = useCallback(() => {
    return performance.now();
  }, []);

  const endMeasure = useCallback((startTime: number) => {
    const renderTime = performance.now() - startTime;
    setMetrics(prev => ({ ...prev, renderTime }));
    return renderTime;
  }, []);

  const updateMetrics = useCallback((update: Partial<typeof metrics>) => {
    setMetrics(prev => ({ ...prev, ...update }));
  }, []);

  return {
    metrics,
    startMeasure,
    endMeasure,
    updateMetrics,
  };
}
