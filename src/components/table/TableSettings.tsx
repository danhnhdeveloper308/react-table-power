import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import { cn } from '../../utils/cn';
import { TableSettings as TableSettingsType } from '../../hooks/useTableSettings';

interface TableSettingsProps {
  settings?: TableSettingsType;
  onUpdateSetting: <K extends keyof TableSettingsType>(key: K, value: TableSettingsType[K]) => void;
  onResetSettings: () => void;
  /**
   * Callback when user saves new tableIdentifier
   */
  onSaveTableIdentifier?: (identifier: string) => void;
  /**
   * Current table identifier
   */
  currentTableIdentifier?: string;
  /**
   * Callback when user saves all settings
   */
  onSaveAllSettings?: (identifier: string) => void;
  /**
   * List of saved configurations for this page
   */
  savedConfigurations?: { id: string; name?: string }[];
}

// Settings icon component with memo to prevent re-renders
const SettingsIcon = memo(({ size = 16 }: { size?: number }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
});
SettingsIcon.displayName = 'SettingsIcon';

// RadioOption component
const RadioOption = memo(({ 
  id, 
  name, 
  label, 
  value, 
  checked, 
  onChange 
}: { 
  id: string;
  name: string;
  label: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
}) => (
  <label htmlFor={id} className="rpt-settings-option">
    <input
      type="radio"
      id={id}
      name={name}
      value={value}
      checked={checked}
      onChange={() => onChange(value)}
      className="rpt-settings-radio"
    />
    <span className="rpt-settings-option-text">{label}</span>
  </label>
));
RadioOption.displayName = 'RadioOption';

// CheckboxOption component
const CheckboxOption = memo(({ 
  id, 
  label, 
  checked, 
  onChange 
}: { 
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <label htmlFor={id} className="rpt-settings-option-checkbox">
    <input
      type="checkbox"
      id={id}
      checked={checked || false}
      onChange={e => onChange(e.target.checked)}
      className="rpt-settings-checkbox"
    />
    <span className="rpt-settings-option-text">{label}</span>
  </label>
));
CheckboxOption.displayName = 'CheckboxOption';

// Configurations Panel component
const ConfigurationsPanel = memo(({ 
  configurations, 
  currentIdentifier, 
  onLoadConfig, 
  onClose 
}: { 
  configurations: { id: string; name?: string }[];
  currentIdentifier: string;
  onLoadConfig: (id: string) => void;
  onClose: () => void;
}) => (
  <div 
    className="rpt-column-dropdown rpt-settings-configurations-panel"
    style={{ 
      position: 'absolute', 
      top: '100%', 
      right: '100%',
      marginRight: '8px',
      zIndex: 70,
      width: '250px'
    }}
  >
    <div className="rpt-column-header">
      <h4 className="rpt-column-title">Saved Configurations</h4>
      <div className="rpt-column-actions">
        <button 
          className="rpt-column-action-btn"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
    <div className="rpt-column-list">
      {configurations.length === 0 ? (
        <div className="rpt-empty-configurations">
          <p>No saved configurations found</p>
        </div>
      ) : (
        configurations.map(config => (
          <button
            key={config.id}
            className={cn(
              "rpt-configuration-item",
              config.id === currentIdentifier && "rpt-configuration-item-active"
            )}
            onClick={() => onLoadConfig(config.id)}
          >
            {config.name || config.id}
            {config.id === currentIdentifier && (
              <span className="rpt-configuration-active-indicator">Current</span>
            )}
          </button>
        ))
      )}
    </div>
  </div>
));
ConfigurationsPanel.displayName = 'ConfigurationsPanel';

/**
 * TableSettings component - UI for customizing table appearance and settings
 */
export function TableSettings({
  settings = {},
  onUpdateSetting,
  onResetSettings,
  onSaveTableIdentifier,
  currentTableIdentifier = '',
  onSaveAllSettings,
  savedConfigurations = []
}: TableSettingsProps) {
  // Component state
  const [isOpen, setIsOpen] = useState(false);
  const [tableIdentifier, setTableIdentifier] = useState(currentTableIdentifier);
  const [showConfigurations, setShowConfigurations] = useState(false);
  const [identifierError, setIdentifierError] = useState('');
  const [isClient, setIsClient] = useState(false);
  
  // Refs for DOM elements
  const dropdownRef = useRef<HTMLDivElement>(null);
  const configurationsPanelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Mark when we're on client side
  useEffect(() => {
    setIsClient(true);
    setTableIdentifier(currentTableIdentifier);
  }, [currentTableIdentifier]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    if (typeof window === 'undefined' || !isOpen) return;
    
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowConfigurations(false);
      }
      
      if (
        showConfigurations &&
        configurationsPanelRef.current &&
        !configurationsPanelRef.current.contains(event.target as Node) &&
        !dropdownRef.current?.contains(event.target as Node)
      ) {
        setShowConfigurations(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, showConfigurations]);
  
  // Close on ESC key
  useEffect(() => {
    if (typeof window === 'undefined' || !isOpen) return;
    
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setShowConfigurations(false);
      }
    };
    
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);
  
  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(prev => {
      if (!prev) {
        setTableIdentifier(currentTableIdentifier);
        setIdentifierError('');
      }
      return !prev;
    });
  };
  
  // Validate table identifier
  const validateIdentifier = (identifier: string): boolean => {
    if (!identifier.trim()) {
      setIdentifierError('Identifier cannot be empty');
      return false;
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(identifier)) {
      setIdentifierError('Identifier can only contain letters, numbers, hyphens and underscores');
      return false;
    }
    
    setIdentifierError('');
    return true;
  };
  
  // Save table settings
  const handleSaveSettings = () => {
    if (validateIdentifier(tableIdentifier) && onSaveAllSettings) {
      onSaveAllSettings(tableIdentifier);
      setIsOpen(false);
    }
  };
  
  // Load a saved configuration
  const handleLoadConfiguration = (configId: string) => {
    if (onSaveTableIdentifier) {
      onSaveTableIdentifier(configId);
      setIsOpen(false);
      setTableIdentifier(configId);
    }
  };
  
  // Don't render anything if not on client side
  if (!isClient) {
    return (
      <div className="rpt-settings-dropdown">
        <button
          ref={buttonRef}
          className="rpt-toolbar-btn rpt-settings-btn"
          title="Table settings"
          aria-label="Table settings"
        >
          <SettingsIcon size={16} />
        </button>
      </div>
    );
  }
  
  return (
    <div className="rpt-settings-dropdown" ref={dropdownRef}>
      <button
        ref={buttonRef}
        className={cn(
          'rpt-toolbar-btn rpt-settings-btn',
          isOpen && 'rpt-settings-btn--active'
        )}
        onClick={toggleDropdown}
        title="Table settings"
        aria-label="Table settings"
      >
        <SettingsIcon size={16} />
      </button>
      
      {isOpen && (
        <div className="rpt-column-dropdown rpt-settings-panel">
          <div className="rpt-column-header">
            <h4 className="rpt-column-title">Table Settings</h4>
            <div className="rpt-column-actions">
              <button 
                className="rpt-column-action-btn"
                onClick={onResetSettings}
              >
                Reset
              </button>
            </div>
          </div>
          
          <div className="rpt-settings-content rpt-scrollable">
            {/* Table Identifier Section */}
            <div className="rpt-settings-section">
              <h5 className="rpt-settings-section-title">Table Identifier</h5>
              <div className="rpt-settings-identifier-container">
                <input 
                  type="text" 
                  className={cn(
                    "rpt-settings-identifier-input",
                    identifierError && "rpt-settings-input-error"
                  )}
                  value={tableIdentifier}
                  onChange={(e) => {
                    setTableIdentifier(e.target.value);
                    if (identifierError) validateIdentifier(e.target.value);
                  }}
                  placeholder="Enter table identifier"
                />
              </div>
              {identifierError ? (
                <p className="rpt-settings-identifier-error">
                  {identifierError}
                </p>
              ) : (
                <p className="rpt-settings-identifier-help">
                  Enter a unique identifier for this table to save its settings.
                </p>
              )}
              
              {/* Load Saved Configurations */}
              <div className="rpt-saved-configurations">
                <button
                  className="rpt-load-config-btn"
                  onClick={() => setShowConfigurations(!showConfigurations)}
                  type="button"
                >
                  Load Configuration
                </button>
                
                {showConfigurations && (
                  <ConfigurationsPanel
                    configurations={savedConfigurations}
                    currentIdentifier={currentTableIdentifier}
                    onLoadConfig={handleLoadConfiguration}
                    onClose={() => setShowConfigurations(false)}
                  />
                )}
              </div>
            </div>
            
            {/* Table Size Section */}
            <div className="rpt-settings-section">
              <h5 className="rpt-settings-section-title">Size</h5>
              <div className="rpt-settings-options-group">
                <RadioOption
                  id="size-small"
                  name="table-size"
                  label="Small"
                  value="small"
                  checked={settings.size === 'small'}
                  onChange={(val) => onUpdateSetting('size', val as any)}
                />
                <RadioOption
                  id="size-medium"
                  name="table-size"
                  label="Medium"
                  value="medium"
                  checked={!settings.size || settings.size === 'medium'}
                  onChange={(val) => onUpdateSetting('size', val as any)}
                />
                <RadioOption
                  id="size-large"
                  name="table-size"
                  label="Large"
                  value="large"
                  checked={settings.size === 'large'}
                  onChange={(val) => onUpdateSetting('size', val as any)}
                />
              </div>
            </div>
            
            {/* Theme Section */}
            <div className="rpt-settings-section">
              <h5 className="rpt-settings-section-title">Theme</h5>
              <div className="rpt-settings-options-group">
                <RadioOption
                  id="theme-light"
                  name="table-theme"
                  label="Light"
                  value="light"
                  checked={settings.theme === 'light'}
                  onChange={(val) => onUpdateSetting('theme', val as any)}
                />
                <RadioOption
                  id="theme-dark"
                  name="table-theme"
                  label="Dark"
                  value="dark"
                  checked={settings.theme === 'dark'}
                  onChange={(val) => onUpdateSetting('theme', val as any)}
                />
                <RadioOption
                  id="theme-system"
                  name="table-theme"
                  label="System"
                  value="system"
                  checked={!settings.theme || settings.theme === 'system'}
                  onChange={(val) => onUpdateSetting('theme', val as any)}
                />
              </div>
            </div>
            
            {/* Table Style Section */}
            <div className="rpt-settings-section">
              <h5 className="rpt-settings-section-title">Table Style</h5>
              <div className="rpt-settings-options-group">
                <RadioOption
                  id="variant-default"
                  name="table-variant"
                  label="Default"
                  value="default"
                  checked={!settings.variant || settings.variant === 'default'}
                  onChange={(val) => onUpdateSetting('variant', val as any)}
                />
                <RadioOption
                  id="variant-modern"
                  name="table-variant"
                  label="Modern"
                  value="modern"
                  checked={settings.variant === 'modern'}
                  onChange={(val) => onUpdateSetting('variant', val as any)}
                />
                <RadioOption
                  id="variant-minimal"
                  name="table-variant"
                  label="Minimal"
                  value="minimal"
                  checked={settings.variant === 'minimal'}
                  onChange={(val) => onUpdateSetting('variant', val as any)}
                />
                <RadioOption
                  id="variant-bordered"
                  name="table-variant"
                  label="Bordered"
                  value="bordered"
                  checked={settings.variant === 'bordered'}
                  onChange={(val) => onUpdateSetting('variant', val as any)}
                />
              </div>
            </div>
            
            {/* Color Scheme Section */}
            <div className="rpt-settings-section">
              <h5 className="rpt-settings-section-title">Color Scheme</h5>
              <div className="rpt-settings-options-group">
                <RadioOption
                  id="color-default"
                  name="color-scheme"
                  label="Default"
                  value="default"
                  checked={!settings.colorScheme || settings.colorScheme === 'default'}
                  onChange={(val) => onUpdateSetting('colorScheme', val as any)}
                />
                <RadioOption
                  id="color-primary"
                  name="color-scheme"
                  label="Primary"
                  value="primary"
                  checked={settings.colorScheme === 'primary'}
                  onChange={(val) => onUpdateSetting('colorScheme', val as any)}
                />
                <RadioOption
                  id="color-neutral"
                  name="color-scheme"
                  label="Neutral"
                  value="neutral"
                  checked={settings.colorScheme === 'neutral'}
                  onChange={(val) => onUpdateSetting('colorScheme', val as any)}
                />
              </div>
            </div>
            
            {/* Border Radius Section */}
            <div className="rpt-settings-section">
              <h5 className="rpt-settings-section-title">Border Radius</h5>
              <div className="rpt-settings-options-group">
                <RadioOption
                  id="radius-none"
                  name="border-radius"
                  label="None"
                  value="none"
                  checked={settings.borderRadius === 'none'}
                  onChange={(val) => onUpdateSetting('borderRadius', val as any)}
                />
                <RadioOption
                  id="radius-sm"
                  name="border-radius"
                  label="Small"
                  value="sm"
                  checked={settings.borderRadius === 'sm'}
                  onChange={(val) => onUpdateSetting('borderRadius', val as any)}
                />
                <RadioOption
                  id="radius-md"
                  name="border-radius"
                  label="Medium"
                  value="md"
                  checked={!settings.borderRadius || settings.borderRadius === 'md'}
                  onChange={(val) => onUpdateSetting('borderRadius', val as any)}
                />
                <RadioOption
                  id="radius-lg"
                  name="border-radius"
                  label="Large"
                  value="lg"
                  checked={settings.borderRadius === 'lg'}
                  onChange={(val) => onUpdateSetting('borderRadius', val as any)}
                />
                <RadioOption
                  id="radius-full"
                  name="border-radius"
                  label="Full"
                  value="full"
                  checked={settings.borderRadius === 'full'}
                  onChange={(val) => onUpdateSetting('borderRadius', val as any)}
                />
              </div>
            </div>
            
            {/* Table Features Section */}
            <div className="rpt-settings-section">
              <h5 className="rpt-settings-section-title">Table Features</h5>
              <div className="rpt-settings-options-group rpt-settings-checkbox-group">
                <CheckboxOption
                  id="feature-striped"
                  label="Zebra Striping"
                  checked={!!settings.striped}
                  onChange={(val) => onUpdateSetting('striped', val)}
                />
                <CheckboxOption
                  id="feature-hover"
                  label="Highlight On Hover"
                  checked={settings.hover !== false} // true by default
                  onChange={(val) => onUpdateSetting('hover', val)}
                />
                <CheckboxOption
                  id="feature-bordered"
                  label="Bordered"
                  checked={!!settings.bordered}
                  onChange={(val) => onUpdateSetting('bordered', val)}
                />
                <CheckboxOption
                  id="feature-sticky"
                  label="Sticky Header"
                  checked={!!settings.sticky}
                  onChange={(val) => onUpdateSetting('sticky', val)}
                />
              </div>
            </div>

            {/* Save Settings Section */}
            <div className="rpt-settings-section rpt-settings-actions">
              <div className="rpt-settings-save-buttons">
                <button 
                  className="rpt-settings-save-btn"
                  onClick={handleSaveSettings}
                  disabled={!tableIdentifier.trim() || !!identifierError}
                  type="button"
                >
                  Save Settings
                </button>
              </div>
              <p className="rpt-settings-save-help">
                Save settings with the current identifier
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TableSettings;