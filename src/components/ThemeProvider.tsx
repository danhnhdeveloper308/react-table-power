import React, { createContext, useContext, useState, useEffect } from 'react';
import { TableThemeConfig } from '../types';

interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  colorScheme: 'default' | 'primary' | 'neutral' | 'custom';
  variant: 'default' | 'modern' | 'minimal' | 'bordered';
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setColorScheme: (scheme: 'default' | 'primary' | 'neutral' | 'custom') => void;
  setVariant: (variant: 'default' | 'modern' | 'minimal' | 'bordered') => void;
  setBorderRadius: (radius: 'none' | 'sm' | 'md' | 'lg' | 'full') => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  colorScheme: 'default',
  variant: 'default',
  borderRadius: 'md',
  setTheme: () => {},
  setColorScheme: () => {},
  setVariant: () => {},
  setBorderRadius: () => {},
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: React.ReactNode;
  themeConfig?: TableThemeConfig;
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ 
  children, 
  themeConfig = {
    theme: 'system',
    colorScheme: 'default',
    variant: 'default',
    borderRadius: 'md'
  } 
}: ThemeProviderProps) {
  // Initialize states with theme configuration
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>(
    themeConfig.theme || 'system'
  );
  const [colorScheme, setColorScheme] = useState<'default' | 'primary' | 'neutral' | 'custom'>(
    themeConfig.colorScheme || 'default'
  );
  const [variant, setVariant] = useState<'default' | 'modern' | 'minimal' | 'bordered'>(
    themeConfig.variant || 'default'
  );
  const [borderRadius, setBorderRadius] = useState<'none' | 'sm' | 'md' | 'lg' | 'full'>(
    themeConfig.borderRadius || 'md'
  );

  // Update theme based on system preference if theme is set to 'system'
  useEffect(() => {
    if (theme !== 'system') return;

    const systemTheme = getSystemTheme();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      const newSystemTheme = getSystemTheme();
      document.documentElement.classList.toggle('rpt-theme-dark', newSystemTheme === 'dark');
      document.documentElement.classList.toggle('rpt-theme-light', newSystemTheme === 'light');
    };

    // Set initial value
    handleChange();

    // Listen for changes
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [theme]);

  // Effect to handle theme changes
  useEffect(() => {
    // Only update if in browser environment
    if (typeof document === 'undefined') return;

    // Remove all theme classes first
    document.documentElement.classList.remove('rpt-theme-light', 'rpt-theme-dark');
    
    // Apply the appropriate theme class
    if (theme === 'light') {
      document.documentElement.classList.add('rpt-theme-light');
      document.documentElement.setAttribute('data-theme', 'light');
    } else if (theme === 'dark') {
      document.documentElement.classList.add('rpt-theme-dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      // System theme - set based on user preference
      const systemTheme = getSystemTheme();
      document.documentElement.classList.add(`rpt-theme-${systemTheme}`);
      document.documentElement.setAttribute('data-theme', systemTheme);
    }
  }, [theme]);

  // Function to set theme with side effects
  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setThemeState(newTheme);
  };

  // Update when themeConfig changes
  useEffect(() => {
    if (themeConfig.theme && themeConfig.theme !== theme) {
      setThemeState(themeConfig.theme);
    }
    if (themeConfig.colorScheme && themeConfig.colorScheme !== colorScheme) {
      setColorScheme(themeConfig.colorScheme);
    }
    if (themeConfig.variant && themeConfig.variant !== variant) {
      setVariant(themeConfig.variant);
    }
    if (themeConfig.borderRadius && themeConfig.borderRadius !== borderRadius) {
      setBorderRadius(themeConfig.borderRadius);
    }
  }, [themeConfig]);

  // Generate class name string
  const themeClasses = [
    theme !== 'system' ? `rpt-theme-${theme}` : '',
    colorScheme !== 'default' ? `rpt-variant-${colorScheme}` : '',
    variant !== 'default' ? `rpt-table-variant-${variant}` : '',
    `rpt-radius-${borderRadius}`
  ].filter(Boolean).join(' ');

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        colorScheme, 
        variant, 
        borderRadius, 
        setTheme, 
        setColorScheme, 
        setVariant, 
        setBorderRadius 
      }}
    >
      <div className={`rpt-theme-container ${themeClasses}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;