import { useState, useEffect, useCallback, useRef } from 'react';
import { TableThemeConfig } from '../types';
import { TableSettings } from './useTableSettings';


interface UseSafeTableSettingsProps {
  initialSettings: TableSettings;
  tableId?: string;
  useUrlAsKey?: boolean;
  tableIdentifier?: string;
  persistKey?: string;
  onChange?: (settings: TableSettings) => void;
}

export function useSafeTableSettings({
  initialSettings,
  tableId = 'rpt-table',
  useUrlAsKey = true,
  tableIdentifier,
  persistKey,
  onChange
}: UseSafeTableSettingsProps) {
  // Ref để lưu giữ settings và tránh re-renders không cần thiết
  const settingsRef = useRef<TableSettings>(initialSettings);
  
  // State thực tế để kích hoạt render khi cần
  const [settings, setSettings] = useState<TableSettings>(initialSettings);
  
  // Ref để theo dõi nếu chúng ta đã thực hiện hydration từ local storage
  const hydrated = useRef(false);
  
  // State để theo dõi xem chúng ta đang ở client hay server
  const [isClient, setIsClient] = useState(false);
  
  // Tạo storage key memoized để tránh tính toán lại
  const getCurrentStorageKey = useCallback(() => {
    let key = persistKey || tableId || 'rpt-table';
    
    if (useUrlAsKey && typeof window !== 'undefined') {
      key = `${key}-${window.location.pathname}`;
    }
    
    if (tableIdentifier) {
      key = `${key}-${tableIdentifier}`;
    }
    
    return key;
  }, [persistKey, tableId, useUrlAsKey, tableIdentifier]);
  
  // Chỉ load settings từ localStorage khi ở client và chỉ một lần
  useEffect(() => {
    setIsClient(true);
    
    if (typeof window !== 'undefined' && !hydrated.current) {
      try {
        const key = getCurrentStorageKey();
        const storedSettings = localStorage.getItem(key);
        
        if (storedSettings) {
          const parsedSettings = JSON.parse(storedSettings);
          settingsRef.current = { ...initialSettings, ...parsedSettings };
          setSettings(settingsRef.current);
        }
        
        hydrated.current = true;
      } catch (err) {
        console.error('Error loading table settings:', err);
      }
    }
  }, []); // Chỉ chạy một lần khi component mount
  
  // CRITICAL FIX: Force component re-render when size changes
  const updateSetting = useCallback(<K extends keyof TableSettings>(
    key: K,
    value: TableSettings[K]
  ) => {
    if (!isClient) {
      console.warn('[useSafeTableSettings] Cannot update settings on server side');
      return;
    }

    console.log(`[useSafeTableSettings] Updating ${key} from ${settings?.[key]} to:`, value);
    
    setSettings(prevSettings => {
      const currentValue = prevSettings?.[key];
      
      // CRITICAL FIX: Always update if value is different
      if (currentValue !== value) {
        const newSettings = {
          ...prevSettings,
          [key]: value,
        };
        
        console.log(`[useSafeTableSettings] Settings updated:`, newSettings);
        
        // Save to localStorage immediately
        try {
          const storageKey = getCurrentStorageKey();
          localStorage.setItem(storageKey, JSON.stringify(newSettings));
          console.log(`[useSafeTableSettings] Saved to localStorage with key: ${storageKey}`);
        } catch (error) {
          console.error('[useSafeTableSettings] Failed to save to localStorage:', error);
        }

        // CRITICAL FIX: Force re-render by using functional update
        setTimeout(() => {
          console.log('[useSafeTableSettings] Triggering additional re-render for:', key, value);
          setSettings(current => ({ ...current })); // Force re-render
        }, 0);

        // Call onChange callback
        if (onChange) {
          try {
            onChange(newSettings);
          } catch (error) {
            console.error('[useSafeTableSettings] Error in onChange callback:', error);
          }
        }
        
        return newSettings;
      }
      
      console.log(`[useSafeTableSettings] No change needed for ${key}, keeping current value:`, currentValue);
      return prevSettings;
    });
  }, [isClient, getCurrentStorageKey, onChange, settings]);

  // Reset settings về ban đầu
  const resetSettings = useCallback(() => {
    settingsRef.current = initialSettings;
    setSettings(initialSettings);
    
    if (isClient) {
      try {
        localStorage.setItem(getCurrentStorageKey(), JSON.stringify(initialSettings));
      } catch (err) {
        console.error('Error resetting table settings:', err);
      }
    }
    
    if (onChange) {
      onChange(initialSettings);
    }
  }, [initialSettings, getCurrentStorageKey, isClient, onChange]);
  
  // Lưu settings với identifier mới
  const saveSettingsWithIdentifier = useCallback((identifier: string) => {
    if (!identifier || !isClient) return false;
    
    try {
      const newKey = `${tableId}-${identifier}`;
      localStorage.setItem(newKey, JSON.stringify(settingsRef.current));
      return true;
    } catch (err) {
      console.error('Error saving settings with identifier:', err);
      return false;
    }
  }, [tableId, isClient]);
  
  // Lấy theme config từ settings
  const getThemeConfig = useCallback(() => {
    return {
      theme: settings.theme || 'system',
      variant: settings.variant || 'default',
      colorScheme: settings.colorScheme || 'default',
      borderRadius: settings.borderRadius || 'md'
    };
  }, [settings.theme, settings.variant, settings.colorScheme, settings.borderRadius]);
  
  return {
    settings,
    updateSetting,
    resetSettings,
    getThemeConfig,
    getCurrentStorageKey,
    saveSettingsWithIdentifier,
    isClient
  };
}

export default useSafeTableSettings;
