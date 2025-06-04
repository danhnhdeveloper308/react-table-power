/**
 * Theme utility functions for managing CSS variables
 */

/**
 * Updates CSS variables for the table component
 * @param variables - Record of CSS variable names and their values
 * @param selector - CSS selector to apply the variables to (defaults to :root)
 */
export function setCssVariables(
  variables: Record<string, string>,
  selector: string = ':root'
): void {
  const root = document.querySelector(selector);
  if (!root) return;

  Object.entries(variables).forEach(([key, value]) => {
    (root as HTMLElement).style.setProperty(`--rpt-${key}`, value);
  });
}

/**
 * Apply a dark mode theme to the table
 * @param selector - CSS selector for the table container element
 */
export function applyDarkTheme(selector: string = '.rpt-container'): void {
  const darkTheme = {
    'background': '#111827',
    'foreground': '#f9fafb',
    'muted': '#1f2937',
    'muted-foreground': '#9ca3af',
    'card': '#1f2937',
    'card-foreground': '#f9fafb',
    'border': '#374151',
    'input': '#1f2937',
    'input-border': '#4b5563',
    'primary': '#3b82f6',
    'primary-foreground': '#ffffff',
    'secondary': '#2d3748',
    'secondary-foreground': '#f9fafb',
    'accent': '#2d3748',
    'accent-foreground': '#f9fafb',
    'destructive': '#ef4444',
    'destructive-foreground': '#ffffff',
    'success': '#10b981',
    'warning': '#f59e0b',
    'info': '#3b82f6',
    'bg': '#1f2937',
    'bg-hover': '#374151',
    'bg-selected': '#3b82f61a',
    'bg-striped': '#1a1f2b',
    'bg-header': '#111827',
    'text-primary': '#f3f4f6',
    'text-secondary': '#9ca3af',
  };

  setCssVariables(darkTheme, selector);
}

/**
 * Apply a light mode theme to the table
 * @param selector - CSS selector for the table container element
 */
export function applyLightTheme(selector: string = '.rpt-container'): void {
  const lightTheme = {
    'background': '#ffffff',
    'foreground': '#1f2937',
    'muted': '#f9fafb',
    'muted-foreground': '#6b7280',
    'card': '#ffffff',
    'card-foreground': '#1f2937',
    'border': '#e5e7eb',
    'input': '#ffffff',
    'input-border': '#d1d5db',
    'primary': '#3b82f6',
    'primary-foreground': '#ffffff',
    'secondary': '#f3f4f6',
    'secondary-foreground': '#1f2937',
    'accent': '#f3f4f6',
    'accent-foreground': '#1f2937',
    'destructive': '#ef4444',
    'destructive-foreground': '#ffffff',
    'success': '#10b981',
    'warning': '#f59e0b',
    'info': '#3b82f6',
    'bg': '#ffffff',
    'bg-hover': '#f8fafc',
    'bg-selected': '#f0f9ff',
    'bg-striped': '#f8fafc',
    'bg-header': '#f1f5f9',
    'text-primary': '#1e293b',
    'text-secondary': '#64748b',
  };

  setCssVariables(lightTheme, selector);
}

/**
 * Create a theme object with custom colors
 * @param theme - Partial theme configuration
 * @returns Complete theme object with defaults for missing values
 */
export function createTheme(theme: Partial<Record<string, string>>): Record<string, string> {
  const defaultTheme = {
    'primary': '#3b82f6',
    'primary-rgb': '59, 130, 246',
    'border': '#e5e7eb',
    'border-hover': '#d1d5db',
    'bg': '#ffffff',
    'bg-hover': '#f9fafb',
    'bg-selected': '#f0f9ff',
    'bg-striped': '#f8fafc',
    'bg-header': '#f1f5f9',
    'text-primary': '#1e293b',
    'text-secondary': '#64748b',
  };

  return { ...defaultTheme, ...theme };
}

/**
 * Apply a custom theme to the table
 * @param theme - Theme object with CSS variable values
 * @param selector - CSS selector for the component
 */
export function applyCustomTheme(
  theme: Record<string, string>, 
  selector: string = '.rpt-container'
): void {
  setCssVariables(theme, selector);
}

/**
 * Detect if the browser is in dark mode
 * @returns True if the browser is in dark mode
 */
export function isDarkMode(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Apply appropriate theme based on browser color scheme preference
 * @param selector - CSS selector for the table container element
 */
export function applyThemeBasedOnColorScheme(selector: string = '.rpt-container'): void {
  if (isDarkMode()) {
    applyDarkTheme(selector);
  } else {
    applyLightTheme(selector);
  }
}

// Export types
export type ThemeVariables = Partial<Record<string, string>>;