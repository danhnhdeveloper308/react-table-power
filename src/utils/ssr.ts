/**
 * SSR-safe utilities for react-table-power
 * Provides utilities for handling server-side rendering
 */

import { useEffect, useState } from 'react';

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

/**
 * Hook for safely accessing sessionStorage in SSR environment
 */
export function useSessionStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    if (isServer) {
      return defaultValue;
    }
    
    try {
      const item = sessionStorage.getItem(key);
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
        sessionStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting sessionStorage key "${key}":`, error);
    }
  };
  
  return [value, setStoredValue];
}

// ==================== SSR-Safe Media Queries ====================

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

/**
 * Hook for responsive breakpoints
 */
export function useBreakpoint() {
  const isMobile = useMediaQuery('(max-width: 640px)');
  const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
  const isDesktop = useMediaQuery('(min-width: 1025px)');
  const isLargeDesktop = useMediaQuery('(min-width: 1440px)');
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    // Convenience flags
    isMobileOrTablet: isMobile || isTablet,
    isDesktopOrLarger: isDesktop || isLargeDesktop,
  };
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

// ==================== Dynamic Imports ====================

/**
 * Safely import a module only on client-side
 */
export function clientOnlyImport<T>(
  importFn: () => Promise<T>
): Promise<T | null> {
  if (isServer) {
    return Promise.resolve(null);
  }
  
  return importFn().catch(() => null);
}

/**
 * Hook for dynamic imports with loading state
 */
export function useDynamicImport<T>(
  importFn: () => Promise<{ default: T }>,
  deps: React.DependencyList = []
) {
  const [module, setModule] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if (isServer) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    importFn()
      .then((mod) => {
        setModule(mod.default);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, deps);
  
  return { module, loading, error };
}

// ==================== Theme Detection ====================

/**
 * Hook for detecting system theme preference
 */
export function useSystemTheme(): 'light' | 'dark' | null {
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);
  
  useEffect(() => {
    if (isServer) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateTheme = () => {
      setTheme(mediaQuery.matches ? 'dark' : 'light');
    };
    
    updateTheme();
    mediaQuery.addEventListener('change', updateTheme);
    
    return () => {
      mediaQuery.removeEventListener('change', updateTheme);
    };
  }, []);
  
  return theme;
}

// ==================== Performance Helpers ====================

/**
 * SSR-safe requestAnimationFrame
 */
export const ssrSafeRequestAnimationFrame = (callback: () => void): number => {
  if (isServer) {
    return setTimeout(callback, 16) as unknown as number;
  }
  
  return requestAnimationFrame(callback);
};

/**
 * SSR-safe cancelAnimationFrame
 */
export const ssrSafeCancelAnimationFrame = (id: number): void => {
  if (isServer) {
    clearTimeout(id);
    return;
  }
  
  cancelAnimationFrame(id);
};

// ==================== Viewport Detection ====================

/**
 * Hook for viewport dimensions that's SSR-safe
 */
export function useViewportSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    if (isServer) return;
    
    const updateSize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    
    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, []);
  
  return size;
}

// ==================== Scroll Detection ====================

/**
 * Hook for scroll position that's SSR-safe
 */
export function useScrollPosition() {
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    if (isServer) return;
    
    const updatePosition = () => {
      setScrollPosition({
        x: window.pageXOffset,
        y: window.pageYOffset,
      });
    };
    
    updatePosition();
    window.addEventListener('scroll', updatePosition);
    
    return () => {
      window.removeEventListener('scroll', updatePosition);
    };
  }, []);
  
  return scrollPosition;
}

// ==================== Export Utilities ====================

export const SSRUtils = {
  isServer,
  isClient,
  ssrSafe,
  useHydrated,
  useLocalStorage,
  useSessionStorage,
  useMediaQuery,
  useBreakpoint,
  useSystemTheme,
  useViewportSize,
  useScrollPosition,
  ssrSafeRequestAnimationFrame,
  ssrSafeCancelAnimationFrame,
  clientOnlyImport,
  useDynamicImport,
};