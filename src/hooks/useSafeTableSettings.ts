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
  
  // Update setting function - memoized để không gây re-renders
  const updateSetting = useCallback((key: keyof TableSettings, value: any) => {
    // Sử dụng functional update để tránh dependency list
    setSettings(prevSettings => {
      // Kiểm tra nếu giá trị thực sự thay đổi
      if (prevSettings[key] === value) {
        return prevSettings; // Không thay đổi state nếu giá trị như cũ
      }
      
      // Tạo settings mới
      const newSettings = { ...prevSettings, [key]: value };
      
      // Cập nhật ref
      settingsRef.current = newSettings;
      
      // Lưu vào localStorage
      if (isClient) {
        try {
          localStorage.setItem(getCurrentStorageKey(), JSON.stringify(newSettings));
        } catch (err) {
          console.error('Error saving table settings:', err);
        }
      }
      
      // Gọi callback onChange nếu có
      if (onChange) {
        onChange(newSettings);
      }
      
      return newSettings;
    });
  }, [getCurrentStorageKey, isClient, onChange]);
  
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
