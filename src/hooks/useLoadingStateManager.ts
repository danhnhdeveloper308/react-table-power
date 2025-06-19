import { useCallback, useRef, useState, useEffect, useMemo } from 'react';

// CRITICAL FIX: Safe requestAnimationFrame for SSR environments
const safeRequestAnimationFrame = (callback: () => void) => {
  if (typeof window !== 'undefined' && window.requestAnimationFrame) {
    return window.requestAnimationFrame(callback);
  } else {
    // Fallback for SSR environments
    return setTimeout(callback, 16); // ~60fps
  }
};

interface LoadingOperation {
  id: string;
  type: 'query' | 'mutation' | 'batch' | 'dialog';
  priority: number;
  startTime: number;
}

interface LoadingState {
  isLoading: boolean;
  operations: Map<string, LoadingOperation>;
  highestPriority: number;
  currentType: string | null;
}

export function useLoadingStateManager() {
  // CRITICAL FIX: Make loading manager stable across re-renders
  const loadingManagerRef = useRef<{
    isLoading: boolean;
    operations: Map<string, LoadingOperation>;
    highestPriority: number;
    currentType: string | null;
  }>();

  // Initialize only once
  if (!loadingManagerRef.current) {
    loadingManagerRef.current = {
      isLoading: false,
      operations: new Map(),
      highestPriority: 0,
      currentType: null
    };
  }

  const [state, setState] = useState<{
    isLoading: boolean;
    operations: Map<string, LoadingOperation>;
    highestPriority: number;
    currentType: string | null;
  }>(() => ({
    isLoading: false,
    operations: new Map(),
    highestPriority: 0,
    currentType: null
  }));

  const operationsRef = useRef<Map<string, LoadingOperation>>(new Map());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const emergencyTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // CRITICAL FIX: Memoize update function to prevent re-creation
  const updateLoadingState = useCallback(() => {
    const operations = operationsRef.current;
    const hasOperations = operations.size > 0;
    
    let highestPriority = 0;
    let currentType: string | null = null;

    if (hasOperations) {
      for (const operation of operations.values()) {
        if (operation.priority > highestPriority) {
          highestPriority = operation.priority;
          currentType = operation.type;
        }
      }
    }

    const newState = {
      isLoading: hasOperations,
      operations: new Map(operations),
      highestPriority,
      currentType
    };

    // Update ref for stable access
    if (loadingManagerRef.current) {
      loadingManagerRef.current.isLoading = hasOperations;
      loadingManagerRef.current.operations = new Map(operations);
      loadingManagerRef.current.highestPriority = highestPriority;
      loadingManagerRef.current.currentType = currentType;
    }

    setState(newState);
  }, []);

  // CRITICAL FIX: Stable start loading function
  const startLoading = useCallback((
    id: string, 
    type: 'query' | 'mutation' | 'batch' | 'dialog',
    priority: number = 1
  ) => {
    const operation: LoadingOperation = {
      id,
      type,
      priority,
      startTime: Date.now()
    };

    operationsRef.current.set(id, operation);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const emergencyTimeout = setTimeout(() => {
      if (operationsRef.current.has(id)) {
        console.warn(`[LoadingStateManager] Emergency clearing stuck operation: ${id}`);
        operationsRef.current.delete(id);
        emergencyTimeoutRef.current.delete(id);
        updateLoadingState();
      }
    }, 30000);

    emergencyTimeoutRef.current.set(id, emergencyTimeout);

    if (priority >= 3) {
      updateLoadingState();
    } else {
      debounceTimerRef.current = setTimeout(updateLoadingState, 100);
    }
  }, [updateLoadingState]);

  // CRITICAL FIX: Stable stop loading function
  const stopLoading = useCallback((id: string) => {
    operationsRef.current.delete(id);
    
    const emergencyTimeout = emergencyTimeoutRef.current.get(id);
    if (emergencyTimeout) {
      clearTimeout(emergencyTimeout);
      emergencyTimeoutRef.current.delete(id);
    }
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    updateLoadingState();
  }, [updateLoadingState]);

  // CRITICAL FIX: Stable clear all function
  const clearAllLoading = useCallback(() => {
    operationsRef.current.clear();
    
    for (const timeout of emergencyTimeoutRef.current.values()) {
      clearTimeout(timeout);
    }
    emergencyTimeoutRef.current.clear();
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const clearedState = {
      isLoading: false,
      operations: new Map(),
      highestPriority: 0,
      currentType: null
    };

    if (loadingManagerRef.current) {
      Object.assign(loadingManagerRef.current, clearedState);
    }

    setState(clearedState);
  }, []);

  // CRITICAL FIX: Stable isOperationRunning function
  const isOperationRunning = useCallback((id: string) => {
    return operationsRef.current.has(id);
  }, []);

  // CRITICAL FIX: Stable getOperationsByType function
  const getOperationsByType = useCallback((type: string) => {
    return Array.from(operationsRef.current.values()).filter(op => op.type === type);
  }, []);

  // CRITICAL FIX: Stable isLoading function that doesn't cause re-renders
  const stableIsLoading = useCallback(() => {
    return loadingManagerRef.current?.isLoading || false;
  }, []);

  // CRITICAL FIX: Enhanced cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      for (const timeout of emergencyTimeoutRef.current.values()) {
        clearTimeout(timeout);
      }
      emergencyTimeoutRef.current.clear();
      operationsRef.current.clear();
    };
  }, []);

  // CRITICAL FIX: Return stable references
  return useMemo(() => ({
    // State
    isLoading: state.isLoading,
    loadingType: state.currentType,
    operationCount: state.operations.size,
    
    // Actions - all stable functions
    startLoading,
    stopLoading,
    clearAllLoading,
    isOperationRunning,
    getOperationsByType,
    
    // Stable isLoading accessor
    get isLoadingStable() {
      return stableIsLoading();
    },
    
    // Computed values
    shouldShowOverlay: false,
    shouldShowSkeleton: state.isLoading && state.currentType === 'query',
    shouldDisableActions: false
  }), [
    state.isLoading,
    state.currentType,
    state.operations.size,
    startLoading,
    stopLoading,
    clearAllLoading,
    isOperationRunning,
    getOperationsByType,
    stableIsLoading
  ]);
}
