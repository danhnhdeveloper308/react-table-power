import React, { useEffect, useState, useRef } from 'react';
import { cn } from '../utils/cn';
import { TableThemeConfig } from '../types';

export interface ThemeProviderProps {
  /**
   * Theme configuration
   */
  themeConfig?: TableThemeConfig;
  
  /**
   * Children content
   */
  children: React.ReactNode;
}

/**
 * ThemeProvider - Component for applying themes to the table
 * Fixed to avoid hydration errors in SSR environments like Next.js
 */
const ThemeProvider: React.FC<ThemeProviderProps> = ({
  themeConfig,
  children,
}) => {
  // Set default values for theme configuration
  const theme = themeConfig?.theme || 'system';
  const variant = themeConfig?.variant || 'default';
  const colorScheme = themeConfig?.colorScheme || 'default';
  const borderRadius = themeConfig?.borderRadius || 'md';
  
  // Use refs for consistent SSR values
  const initialRender = useRef(true);
  const initialTheme = useRef(theme === 'system' ? 'light' : theme);

  // State to track client-side resolved theme
  const [resolvedTheme, setResolvedTheme] = useState(initialTheme.current);
  
  // Create class names based on theme settings
  const containerClassName = cn(
    'rpt-theme-provider',
    'rpt-theme-container',
    `rpt-theme-${resolvedTheme}`,
    `rpt-variant-${variant}`,
    `rpt-table-variant-${variant}`,
    `rpt-color-${colorScheme}`,
    `rpt-radius-${borderRadius}`,
  );
  
  // Effect to detect system preference after mount (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    initialRender.current = false;
    
    const detectSystemTheme = () => {
      // Skip if not using system theme
      if (theme !== 'system') {
        setResolvedTheme(theme);
        return;
      }
      
      try {
        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setResolvedTheme(isDarkMode ? 'dark' : 'light');
      } catch (e) {
        // Fallback if media query isn't supported
        setResolvedTheme('light');
      }
    };
    
    // Detect theme immediately
    detectSystemTheme();
    
    // Add listener for theme changes if using system theme
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        setResolvedTheme(e.matches ? 'dark' : 'light');
      };
      
      // Use the proper API based on browser support
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Legacy API for older browsers
        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
      }
    }
  }, [theme]);
  
  // Data attributes for CSS selectors
  const dataAttributes = {
    'data-theme': resolvedTheme,
    'data-variant': variant,
    'data-color-scheme': colorScheme,
    'data-border-radius': borderRadius
  };
  
  return (
    <div 
      className={containerClassName}
      {...dataAttributes}
      suppressHydrationWarning
    >
      {children}
    </div>
  );
};

export default ThemeProvider;