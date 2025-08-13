/**
 * SSR-safe utilities for react-table-power
 * Provides utilities for handling server-side rendering
 */

import React, { useEffect, useState } from 'react';

// ==================== SSR Detection ====================

/**
 * Check if code is running on the server
 */
export const isServer = typeof window === 'undefined';

/**
 * Check if code is running on the client
 */
export const isClient = typeof window !== 'undefined';

/**
 * Get a value that's safe for SSR
 * Returns fallback on server, actual value on client
 */
export function ssrSafe<T>(getValue: () => T, fallback: T): T {
  if (isServer) {
    return fallback;
  }
  return getValue();
}

// ==================== Hydration-Safe Hook ====================

/**
 * Hook that only runs after hydration is complete
 * Prevents hydration mismatches for client-only features
 */
export function useIsomorphicLayoutEffect(
  effect: React.EffectCallback,
  deps?: React.DependencyList
) {
  if (isServer) {
    // On server, do nothing
    return;
  }
  
  // On client, use regular useEffect
  useEffect(effect, deps);
}

/**
 * Hook that returns true only after client-side hydration
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  
  useEffect(() => {
    setHydrated(true);
  }, []);
  
  return hydrated;
}

/**
 * Hook for safely accessing localStorage in SSR environment
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    if (isServer) {
      return defaultValue;
    }
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  });
  
  const setStoredValue = (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(value) : value;
      setValue(valueToStore);
      
      if (isClient) {
        localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };
  
  return [value, setStoredValue];
}

// ==================== SSR-Safe Component Wrapper ====================

interface SSRSafeProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  defer?: boolean;
}

/**
 * Component that safely renders children only on client-side
 * Prevents hydration mismatches for client-only features
 */
export function SSRSafe({ children, fallback = null, defer = false }: SSRSafeProps) {
  const hydrated = useHydrated();
  
  if (isServer || (!hydrated && defer)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

// ==================== Media Queries ====================

/**
 * Hook for safely using media queries in SSR environment
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    if (isServer) return;
    
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);
    
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    mediaQuery.addEventListener('change', listener);
    
    return () => {
      mediaQuery.removeEventListener('change', listener);
    };
  }, [query]);
  
  return matches;
}

// ==================== Export Utilities ====================

export const SSRUtils = {
  isServer,
  isClient,
  ssrSafe,
  useHydrated,
  useLocalStorage,
  useMediaQuery,
};
