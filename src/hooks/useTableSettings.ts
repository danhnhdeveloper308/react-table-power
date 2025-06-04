import { useCallback, useEffect, useState, useRef } from 'react';
import { TableSize, TableThemeConfig } from '../types';

export interface TableSettings {
  size?: TableSize;
  theme?: 'light' | 'dark' | 'system';
  variant?: 'default' | 'modern' | 'minimal' | 'bordered';
  colorScheme?: 'default' | 'primary' | 'neutral' | 'custom';
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  striped?: boolean;
  bordered?: boolean;
  hover?: boolean;
  sticky?: boolean;
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

interface UseTableSettingsOptions {
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
   * This will be added to the URL-based key if useUrlAsKey is true
   */
  tableIdentifier?: string;
}

interface StoredSettings {
  key: string;
  settings: TableSettings;
}

/**
 * Hook to manage and persist table settings
 * 
 * @example
 * // Basic usage
 * const { settings, updateSetting } = useTableSettings();
 * 
 * @example
 * // With custom identifier for multiple tables on same page
 * const { settings, updateSetting } = useTableSettings({
 *   tableIdentifier: 'userTable',
 *   initialSettings: { size: 'small' }
 * });
 */
export function useTableSettings({
  tableId = 'rpt-table',
  initialSettings,
  persistKey,
  onChange,
  useUrlAsKey = true,
  tableIdentifier
}: UseTableSettingsOptions = {}) {
  // Track if settings were updated manually
  const manuallyUpdatedRef = useRef(false);
  
  // Reference to initial settings to avoid infinite loops
  const initialSettingsRef = useRef(initialSettings);

  // Check if we should use URL param tableId
  const getTableIdFromUrl = useCallback(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('tableId') || tableIdentifier;
    }
    return tableIdentifier;
  }, [tableIdentifier]);

  // Normalizes the pathname to prevent double hyphens when creating storage keys
  // For example: /examples/users-management -> examples-users-management
  const getNormalizedPathname = useCallback(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      // Remove leading slash and convert remaining slashes to hyphens
      // Also clean up any repeated hyphens or trailing hyphens
      return pathname.replace(/^\//, '')
                     .replace(/\//g, '-')
                     .replace(/-+/g, '-')
                     .replace(/-$/g, '');
    }
    return '';
  }, []);

  // Generate a unique and consistent storage key
  const generateStorageKey = useCallback(() => {
    // Start with the base key
    let baseKey = persistKey || `rpt-settings`;
    
    // Add URL pathname if enabled and running in browser
    if (useUrlAsKey && typeof window !== 'undefined') {
      const normalizedPathname = getNormalizedPathname();
      if (normalizedPathname) {
        baseKey += `-${normalizedPathname}`;
      }
    }
    
    // First check URL param, then use provided tableIdentifier
    const effectiveTableId = getTableIdFromUrl();
    
    // Add table identifier if provided
    if (effectiveTableId) {
      // Ensure we have a clean identifier without duplicate elements
      const pathParts = baseKey.split('-');
      // Don't add the identifier if it's already part of the path
      if (!pathParts.includes(effectiveTableId)) {
        baseKey += `-${effectiveTableId}`;
      }
    } 
    // Fall back to tableId if no specific identifiers were provided
    else if (!persistKey && !useUrlAsKey) {
      baseKey += `-${tableId}`;
    }
    
    return baseKey;
  }, [persistKey, useUrlAsKey, tableId, getTableIdFromUrl, getNormalizedPathname]);

  // Initial storage key
  const [storageKey, setStorageKey] = useState(generateStorageKey);
  
  // Update storage key if URL changes
  useEffect(() => {
    const newKey = generateStorageKey();
    if (newKey !== storageKey) {
      setStorageKey(newKey);
      if (process.env.NODE_ENV !== 'production') {
        console.log('Storage key updated:', newKey);
      }
    }
  }, [generateStorageKey, storageKey]);

  // Get all stored keys for this application
  const getAllStoredKeys = useCallback(() => {
    if (typeof window === 'undefined') return [];
    
    const keys = [];
    const prefix = 'rpt-settings';
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key);
      }
    }
    
    return keys;
  }, []);

  // Cleanup duplicate or outdated settings
  const cleanupStoredSettings = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const allKeys = getAllStoredKeys();
      const normalizedPathname = getNormalizedPathname();
      const effectiveTableId = getTableIdFromUrl();
      
      // If we have a valid pathname and tableId, remove any conflicting settings
      if (normalizedPathname && effectiveTableId) {
        const baseWithoutId = `rpt-settings-${normalizedPathname}`;
        const currentKey = `${baseWithoutId}-${effectiveTableId}`;
        
        // Get the current settings if they exist
        const currentSettings = localStorage.getItem(currentKey);
        
        // Check for duplicate keys or outdated keys that should be consolidated
        allKeys.forEach(key => {
          // Skip the current key
          if (key === currentKey) return;
          
          // Look for keys that are for the same page but different identifiers
          // or keys that are duplicates (could happen with URL changes)
          if (key.startsWith(baseWithoutId) && key !== currentKey) {
            console.log(`Found duplicate/outdated key: ${key}, consolidating with: ${currentKey}`);
            
            // If we don't have current settings but have settings under this key, migrate them
            if (!currentSettings && localStorage.getItem(key)) {
              localStorage.setItem(currentKey, localStorage.getItem(key)!);
              localStorage.removeItem(key);
            } 
            // If we already have current settings, remove the duplicate
            else if (key !== storageKey) { // Don't remove the key we're using
              localStorage.removeItem(key);
            }
          }
        });
      }
    } catch (error) {
      console.warn('Error cleaning up stored settings:', error);
    }
  }, [getAllStoredKeys, getNormalizedPathname, getTableIdFromUrl, storageKey]);

  // Run cleanup once when the component mounts
  useEffect(() => {
    cleanupStoredSettings();
  }, [cleanupStoredSettings]);

  // Check for existing settings with similar keys to avoid duplicate keys
  const findExistingSettings = useCallback((): StoredSettings | null => {
    if (typeof window === 'undefined') return null;

    try {
      // First check if an exact key match exists
      const exactMatch = localStorage.getItem(storageKey);
      if (exactMatch) {
        return {
          key: storageKey,
          settings: JSON.parse(exactMatch)
        };
      }
      
      // Get the base parts of our current key (without identifier)
      const baseKeyParts = storageKey.split('-');
      // We expect "rpt-settings-pathname-identifier"
      // So the base path is all elements except the last one
      const basePathParts = baseKeyParts.length > 2 ? 
        baseKeyParts.slice(0, -1).join('-') : storageKey;
      
      // Check for keys with same path but different identifiers
      const allKeys = getAllStoredKeys();
      for (const key of allKeys) {
        if (key === storageKey) continue; // Skip exact match, we already checked it
        
        try {
          const currentKeyParts = key.split('-');
          // Get the base path without the identifier
          const currentPathParts = currentKeyParts.length > 2 ? 
            currentKeyParts.slice(0, -1).join('-') : key;
          
          // If path parts match (same page, different table)
          if (basePathParts === currentPathParts) {
            const savedSettings = localStorage.getItem(key);
            if (savedSettings) {
              return {
                key,
                settings: JSON.parse(savedSettings)
              };
            }
          }
        } catch (error) {
          console.warn(`Failed to parse settings for key ${key}:`, error);
        }
      }
      
      // Handle URL parameters specifically
      const urlTableId = new URLSearchParams(window.location.search).get('tableId');
      if (urlTableId) {
        let urlBasedKey = persistKey || `rpt-settings`;
        if (useUrlAsKey) {
          const normalizedPathname = getNormalizedPathname();
          if (normalizedPathname) {
            urlBasedKey += `-${normalizedPathname}`;
          }
        }
        urlBasedKey += `-${urlTableId}`;
        
        const savedSettings = localStorage.getItem(urlBasedKey);
        if (savedSettings) {
          return {
            key: urlBasedKey,
            settings: JSON.parse(savedSettings)
          };
        }
      }
    } catch (error) {
      console.warn('Error checking localStorage:', error);
    }
    
    return null;
  }, [storageKey, persistKey, useUrlAsKey, getNormalizedPathname, getAllStoredKeys]);
  
  // Function to get settings from localStorage
  const getSavedSettings = useCallback((): TableSettings | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      // First try getting settings from current key
      const currentKey = generateStorageKey();
      let savedSettings = localStorage.getItem(currentKey);
      
      if (savedSettings) {
        return JSON.parse(savedSettings);
      }
      
      // If no settings found with current key, check for similar keys
      const existingSettings = findExistingSettings();
      if (existingSettings) {
        // If we found settings under a different key, migrate them to our current key
        localStorage.setItem(currentKey, JSON.stringify(existingSettings.settings));
        if (existingSettings.key !== currentKey) {
          console.log(`Migrated settings from ${existingSettings.key} to ${currentKey}`);
          // Optionally remove the old settings if different key
          localStorage.removeItem(existingSettings.key);
        }
        return existingSettings.settings;
      }
    } catch (error) {
      console.warn('Failed to parse saved table settings:', error);
    }
    
    return null;
  }, [generateStorageKey, findExistingSettings]);
  
  // Initialize settings from localStorage or defaults
  const [settings, setSettings] = useState<TableSettings>(() => {
    const savedSettings = getSavedSettings();
    
    if (savedSettings) {
      // Merge saved settings with defaults and initialSettings, prioritizing initialSettings
      return { 
        ...defaultSettings, 
        ...savedSettings,
        ...(initialSettingsRef.current || {}) 
      };
    }
    
    // If no saved settings or errors, use defaults + initial settings
    return { ...defaultSettings, ...(initialSettingsRef.current || {}) };
  });

  // Apply settings when storage key changes
  useEffect(() => {
    if (typeof window === 'undefined' || manuallyUpdatedRef.current) return;
    
    const savedSettings = getSavedSettings();
    if (savedSettings) {
      // Apply saved settings while preserving any initialSettings that were provided
      setSettings({
        ...defaultSettings,
        ...savedSettings,
        ...(initialSettingsRef.current || {})
      });
    }
    
    // Reset manual update flag when the storage key changes
    return () => {
      manuallyUpdatedRef.current = false;
    };
  }, [storageKey, getSavedSettings]);
  
  // Save settings to localStorage when they change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(settings));
      if (process.env.NODE_ENV !== 'production') {
        console.log('Saved settings to localStorage', { key: storageKey, settings });
      }
    } catch (error) {
      console.warn('Failed to save table settings:', error);
    }
    
    // Call onChange handler if provided
    if (onChange) {
      onChange(settings);
    }
  }, [settings, storageKey, onChange]);
  
  // Update a specific setting
  const updateSetting = useCallback(<K extends keyof TableSettings>(
    key: K,
    value: TableSettings[K]
  ) => {
    manuallyUpdatedRef.current = true;
    setSettings((prev) => ({
      ...prev,
      [key]: value
    }));
  }, []);
  
  // Update multiple settings at once
  const updateSettings = useCallback((newSettings: Partial<TableSettings>) => {
    manuallyUpdatedRef.current = true;
    setSettings((prev) => ({
      ...prev,
      ...newSettings
    }));
  }, []);
  
  // Reset settings to defaults
  const resetSettings = useCallback(() => {
    manuallyUpdatedRef.current = true;
    setSettings({ ...defaultSettings, ...initialSettingsRef.current });
  }, []);
  
  // Get theme config for ThemeProvider
  const getThemeConfig = useCallback((): TableThemeConfig => {
    return {
      theme: settings.theme,
      variant: settings.variant,
      colorScheme: settings.colorScheme,
      borderRadius: settings.borderRadius,
    };
  }, [
    settings.theme,
    settings.variant,
    settings.colorScheme,
    settings.borderRadius
  ]);
  
  // Update URL with table identifier without page reload
  const updateUrlWithTableId = useCallback((identifier: string) => {
    if (typeof window === 'undefined') return false;
    
    try {
      const url = new URL(window.location.href);
      const currentTableId = url.searchParams.get('tableId');
      
      if (currentTableId !== identifier) {
        url.searchParams.set('tableId', identifier);
        window.history.replaceState({}, '', url);
        return true;
      }
    } catch (error) {
      console.warn('Failed to update URL with tableId:', error);
    }
    return false;
  }, []);
  
  // Save settings with a new table identifier
  const saveSettingsWithIdentifier = useCallback((identifier: string): boolean => {
    if (typeof window === 'undefined' || !identifier.trim()) return false;
    
    try {
      // Create the new storage key with the new identifier
      let baseKey = persistKey || `rpt-settings`;
      if (useUrlAsKey) {
        const normalizedPathname = getNormalizedPathname();
        if (normalizedPathname) {
          baseKey += `-${normalizedPathname}`;
        }
      }
      
      // Ensure the identifier doesn't duplicate parts of the path
      const pathParts = baseKey.split('-');
      if (!pathParts.includes(identifier)) {
        baseKey += `-${identifier}`;
      } else {
        // If the identifier is already in the path, reconstruct without duplication
        const parts = [];
        for (const part of pathParts) {
          if (part !== identifier) {
            parts.push(part);
          }
        }
        baseKey = [...parts, identifier].join('-');
      }
      
      // Save current settings to new key
      localStorage.setItem(baseKey, JSON.stringify(settings));
      
      // Update URL with new identifier
      updateUrlWithTableId(identifier);
      
      // Update our current storage key
      setStorageKey(baseKey);

      // Clean up old settings with conflicting identifiers
      cleanupStoredSettings();
      
      return true;
    } catch (error) {
      console.error('Failed to save settings with new identifier:', error);
      return false;
    }
  }, [settings, persistKey, useUrlAsKey, getNormalizedPathname, updateUrlWithTableId, cleanupStoredSettings]);
  
  // Get the current storage key being used
  const getCurrentStorageKey = useCallback(() => {
    return storageKey;
  }, [storageKey]);

  // Extract table identifier from key
  const extractTableIdentifier = useCallback((): string => {
    const keyParts = storageKey.split('-');
    return keyParts.length > 0 ? keyParts[keyParts.length - 1] : '';
  }, [storageKey]);

  // Delete all table settings for this page/application
  const deleteAllSettings = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const allKeys = getAllStoredKeys();
      const normalizedPathname = getNormalizedPathname();
      
      allKeys.forEach(key => {
        // If no pathname filter or key includes the pathname, delete it
        if (!normalizedPathname || key.includes(normalizedPathname)) {
          localStorage.removeItem(key);
        }
      });
      
      // Reset to defaults
      setSettings({ ...defaultSettings, ...initialSettingsRef.current });
    } catch (error) {
      console.warn('Error deleting all settings:', error);
    }
  }, [getAllStoredKeys, getNormalizedPathname]);

  // Get all saved configurations for the current page
  const getSavedConfigurations = useCallback(() => {
    if (typeof window === 'undefined') return [];
    
    try {
      const allKeys = getAllStoredKeys();
      const normalizedPathname = getNormalizedPathname();
      const configs = [];
      
      // Pattern to match: rpt-settings-pathname-identifier
      const basePattern = normalizedPathname ? 
        `rpt-settings-${normalizedPathname}-` : 
        'rpt-settings-';
      
      for (const key of allKeys) {
        if (key.startsWith(basePattern)) {
          // Extract the identifier (last part)
          const parts = key.split('-');
          const identifier = parts[parts.length - 1];
          
          configs.push({
            id: identifier,
            key: key
          });
        }
      }
      
      return configs;
    } catch (error) {
      console.warn('Error getting saved configurations:', error);
      return [];
    }
  }, [getAllStoredKeys, getNormalizedPathname]);
  
  return {
    settings,
    updateSetting,
    updateSettings,
    resetSettings,
    getThemeConfig,
    getCurrentStorageKey,
    saveSettingsWithIdentifier,
    extractTableIdentifier,
    updateUrlWithTableId,
    deleteAllSettings,
    getSavedConfigurations
  };
}

export default useTableSettings;