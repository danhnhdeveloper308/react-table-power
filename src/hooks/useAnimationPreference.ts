import { useCallback, useEffect, useMemo, useState } from 'react';

interface UseAnimationPreferenceOptions {
  /**
   * Whether animations are enabled by default
   * @default true
   */
  enabled?: boolean;
  
  /**
   * Duration of animations in milliseconds
   * @default 300
   */
  duration?: number;
  
  /**
   * Whether to respect user's reduced motion preference
   * @default true
   */
  respectReducedMotion?: boolean;
}

export function useAnimationPreference({
  enabled = true,
  duration = 300,
  respectReducedMotion = true,
}: UseAnimationPreferenceOptions = {}) {
  // Whether the user prefers reduced motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  // Update prefersReducedMotion state when the media query changes
  useEffect(() => {
    if (typeof window === 'undefined' || !respectReducedMotion) return;
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    // Add listener to update state when preference changes
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    // Modern API
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Legacy API
    else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [respectReducedMotion]);
  
  // Determine if animations should be enabled
  const isEnabled = useMemo(() => {
    return enabled && (!respectReducedMotion || !prefersReducedMotion);
  }, [enabled, respectReducedMotion, prefersReducedMotion]);
  
  // Get animation properties based on current state
  const getAnimationProps = useCallback(() => {
    if (!isEnabled) {
      return {
        animate: false,
        transition: { duration: 0 },
      };
    }
    
    return {
      animate: true,
      transition: { duration: duration / 1000 }, // Convert to seconds for framer-motion
    };
  }, [isEnabled, duration]);
  
  // Generate staggered animation delay based on index
  const getStaggeredDelay = useCallback((index: number, baseDelay: number = 0.05) => {
    if (!isEnabled) return 0;
    return baseDelay * index;
  }, [isEnabled]);
  
  return {
    enabled: isEnabled,
    prefersReducedMotion,
    duration,
    getAnimationProps,
    getStaggeredDelay,
  };
}

export default useAnimationPreference;