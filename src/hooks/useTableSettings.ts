import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { TableSize, TableThemeConfig } from '../types';
import { useDataTableConfig } from '../contexts/DataTableConfigContext';

// Thống nhất định nghĩa TableSettings ở một nơi duy nhất
export interface TableSettings {
  size?: TableSize;
  theme?: string;
  variant?: 'default' | 'modern' | 'minimal' | 'bordered';
  colorScheme?: 'default' | 'primary' | 'neutral' | 'custom';
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  striped?: boolean;
  bordered?: boolean;
  hover?: boolean;
  sticky?: boolean;
  emptyState?: {
    title?: string;
    message?: string;
    action?: React.ReactNode;
  };
}

export const defaultSettings: TableSettings = {
  size: 'medium',
  theme: 'system',
  variant: 'default',
  colorScheme: 'default',
  borderRadius: 'md',
  striped: false,
  bordered: false,
  hover: true,
  sticky: false
};

export interface UseTableSettingsOptions {
  tableId?: string;
  initialSettings?: Partial<TableSettings>;
  persistKey?: string;
  onChange?: (settings: TableSettings) => void;
  /**
   * When true, uses current URL pathname as part of the storage key
   * @default true
   */
  useUrlAsKey?: boolean;
  /**
   * Custom identifier for this table when multiple tables exist on the same page
   */
  tableIdentifier?: string;
}

/**
 * Hook to manage table settings
 * Avoids direct localStorage access during render to be SSR-compatible
 */
export function useTableSettings({
  tableId = 'rpt-table',
  initialSettings,
  persistKey,
  onChange,
  useUrlAsKey = true,
  tableIdentifier
}: UseTableSettingsOptions = {}) {
  // Get provider config
  const providerConfig = useDataTableConfig();
  
  // Track if component is mounted (client-side only)
  const isMounted = useRef(false);
  const isClient = typeof window !== 'undefined';
  
  // Track if settings were updated manually
  const manuallyUpdatedRef = useRef(false);
  
  // Merge provider config with default settings and initialSettings
  const mergedDefaults = useMemo(() => {
    const defaults = { ...defaultSettings };
    
    // Apply provider config settings if present
    if (providerConfig) {
      if (providerConfig.size) defaults.size = providerConfig.size;
      if (providerConfig.theme) {
        defaults.theme = providerConfig.theme.theme || defaultSettings.theme;
        defaults.variant = providerConfig.theme.variant || defaultSettings.variant;
        defaults.colorScheme = providerConfig.theme.colorScheme || defaultSettings.colorScheme;
        defaults.borderRadius = providerConfig.theme.borderRadius || defaultSettings.borderRadius;
      }
      if (providerConfig.striped !== undefined) defaults.striped = providerConfig.striped;
      if (providerConfig.bordered !== undefined) defaults.bordered = providerConfig.bordered;
      if (providerConfig.hover !== undefined) defaults.hover = providerConfig.hover;
      if (providerConfig.sticky !== undefined) defaults.sticky = providerConfig.sticky;
      
      // Thêm emptyState từ config nếu có
      if (providerConfig.emptyState) {
        defaults.emptyState = { ...providerConfig.emptyState };
      }
    }
    
    // Then apply initialSettings on top
    return { ...defaults, ...(initialSettings || {}) };
  }, [providerConfig, initialSettings]);
  
  // Reference to initial settings to avoid infinite loops
  const initialSettingsRef = useRef(mergedDefaults);

  // Generate a storage key safely (without accessing window during render)
  const generateStorageKey = useCallback(() => {
    // Start with the base key
    let baseKey = persistKey || `rpt-settings`;
    
    // Add table identifier if provided
    if (tableIdentifier) {
      baseKey += `-${tableIdentifier}`;
    } else if (tableId) {
      baseKey += `-${tableId}`;
    }
    
    // Add URL pathname if requested
    if (useUrlAsKey && typeof window !== 'undefined') {
      baseKey += `-${window.location.pathname}`;
    }
    
    return baseKey;
  }, [persistKey, tableId, tableIdentifier, useUrlAsKey]);

  // Initialize with defaults, will be updated after mount if needed
  const [storageKey] = useState(generateStorageKey);
  const [settings, setSettings] = useState<TableSettings>(mergedDefaults);

  // Extract table identifier from current storage key
  const extractTableIdentifier = useCallback((): string => {
    // If we have a direct tableIdentifier, use that
    if (tableIdentifier) {
      return tableIdentifier;
    }

    try {
      // Extract from the current storage key
      const keyParts = storageKey.split('-');
      // Last part should be the identifier (assuming our keys follow the pattern)
      if (keyParts.length > 2) {
        return keyParts[keyParts.length - 1];
      }
    } catch (error) {
      console.warn('Error extracting table identifier:', error);
    }
    return '';
  }, [storageKey, tableIdentifier]);

  // Function that safely attempts to use localStorage (for client-side only)
  const safelyUseStorage = useCallback(<T>(operation: () => T, fallback: T): T => {
    if (!isClient) return fallback;
    
    try {
      return operation();
    } catch (error) {
      console.warn('LocalStorage operation failed:', error);
      return fallback;
    }
  }, [isClient]);

  // Load settings from storage after mount (client-side only)
  useEffect(() => {
    if (!isClient) return;
    
    isMounted.current = true;
    
    const loadSettings = () => {
      safelyUseStorage(() => {
        const storedSettings = localStorage.getItem(storageKey);
        if (storedSettings) {
          try {
            const parsed = JSON.parse(storedSettings) as TableSettings;
            setSettings(current => ({ ...current, ...parsed }));
          } catch (e) {
            console.warn('Failed to parse stored table settings:', e);
          }
        }
      }, null);
    };
    
    // Load settings after mount
    loadSettings();
    
    // Log storage key for debugging in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Table settings using storage key:', storageKey);
    }
  }, [storageKey, safelyUseStorage, isClient]);

  // Save settings to storage when they change (client-side only)
  useEffect(() => {
    if (!isMounted.current || !isClient) return;
    
    safelyUseStorage(() => {
      localStorage.setItem(storageKey, JSON.stringify(settings));
    }, null);
    
    // Call onChange handler if provided
    if (onChange) {
      onChange(settings);
    }
  }, [settings, storageKey, onChange, safelyUseStorage, isClient]);

  // Detect system color scheme changes
  useEffect(() => {
    if (!isClient) return;
    
    // Only add listener if theme is set to system
    if (settings.theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      // We don't need to update settings here, just trigger a re-render
      // when system preference changes
      if (onChange) {
        onChange(settings);
      }
    };
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } 
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
    }
    
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [settings.theme, onChange, settings, isClient]);

  // Update a specific setting
  const updateSetting = useCallback(<K extends keyof TableSettings>(
    key: K,
    value: TableSettings[K]
  ) => {
    manuallyUpdatedRef.current = true;
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Updating table setting: ${String(key)} =`, value);
    }
    
    setSettings((prev) => {
      // Only update if value is different to prevent unnecessary re-renders
      if (prev[key] === value) return prev;
      
      // Create updated settings
      return { ...prev, [key]: value };
    });
  }, []);
  
  // Update multiple settings at once
  const updateSettings = useCallback((newSettings: Partial<TableSettings>) => {
    manuallyUpdatedRef.current = true;
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);
  
  // Reset settings to defaults
  const resetSettings = useCallback(() => {
    manuallyUpdatedRef.current = true;
    setSettings({ ...defaultSettings, ...initialSettingsRef.current });
  }, []);
  
  // Get theme config for ThemeProvider
  const getThemeConfig = useCallback((): TableThemeConfig => {
    // Default to system preference if we're on client-side and theme is 'system'
    let effectiveTheme = settings.theme || 'system';
    
    if (isClient && effectiveTheme === 'system') {
      // Check system preference
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    return {
      theme: effectiveTheme as 'light' | 'dark' | 'system',
      variant: settings.variant,
      colorScheme: settings.colorScheme,
      borderRadius: settings.borderRadius,
    };
  }, [
    settings.theme,
    settings.variant,
    settings.colorScheme,
    settings.borderRadius,
    isClient
  ]);
  
  // Get current storage key
  const getCurrentStorageKey = useCallback(() => {
    return storageKey;
  }, [storageKey]);
  
  // Save settings with a specific identifier
  const saveSettingsWithIdentifier = useCallback((identifier: string): boolean => {
    if (!identifier.trim() || !isClient) return false;
    
    return safelyUseStorage(() => {
      // Create the new storage key with the new identifier
      let baseKey = persistKey || `rpt-settings`;
      
      // Add table identifier
      baseKey += `-${identifier}`;
      
      // Save current settings to new key
      localStorage.setItem(baseKey, JSON.stringify(settings));
      return true;
    }, false);
  }, [settings, persistKey, safelyUseStorage, isClient]);

  // Get all saved configurations
  const getSavedConfigurations = useCallback(() => {
    if (!isClient) return [];
    
    return safelyUseStorage(() => {
      const configs: { id: string; name?: string }[] = [];
      const baseKeyPrefix = 'rpt-settings';
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith(baseKeyPrefix)) continue;
        
        // Extract the identifier (last part of key)
        const keyParts = key.split('-');
        const identifier = keyParts[keyParts.length - 1];
        
        if (identifier) {
          configs.push({
            id: identifier,
            name: identifier // We could add custom names in the future
          });
        }
      }
      
      return configs;
    }, []);
  }, [safelyUseStorage, isClient]);

  // Get the current system preference (light or dark)
  const getSystemPreference = useCallback((): 'light' | 'dark' => {
    if (!isClient) return 'light';
    
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, [isClient]);

  return {
    settings,
    updateSetting,
    updateSettings,
    resetSettings,
    getThemeConfig,
    getCurrentStorageKey,
    saveSettingsWithIdentifier,
    extractTableIdentifier,
    getSavedConfigurations,
    getSystemPreference,
    isClient // Thêm prop isClient để cải thiện tương thích với SSR
  };
}

export default useTableSettings;