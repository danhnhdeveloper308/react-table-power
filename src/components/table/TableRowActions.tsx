import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { ActionConfig, BaseTableData, ButtonVariant } from '../../types';

export interface TableRowActionsProps<T extends BaseTableData = BaseTableData> {
  /**
   * Row data
   */
  rowData: T;
  
  /**
   * Row index
   */
  rowIndex: number;
  
  /**
   * Action configurations
   */
  actions: ActionConfig<T>[];
  
  /**
   * Maximum number of inline actions before using dropdown
   */
  maxInlineActions?: number;
  
  /**
   * Position of the actions
   */
  position?: 'inline' | 'dropdown';
  
  /**
   * Whether to show tooltips
   */
  showTooltips?: boolean;
  
  /**
   * Button variant style
   */
  buttonVariant?: ButtonVariant;
  
  /**
   * Custom CSS class
   */
  className?: string;

  /**
   * Alignment of actions within the cell
   */
  align?: 'left' | 'center' | 'right';
}

export const TableRowActions = <T extends BaseTableData = BaseTableData>({
  rowData,
  rowIndex,
  actions = [],
  maxInlineActions = 3,
  position = 'inline',
  showTooltips = true,
  buttonVariant = 'ghost',
  className,
  align = 'center',
}: TableRowActionsProps<T>) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  // Calculate available width and adjust button display accordingly
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    updateWidth();
    
    // Create ResizeObserver to detect container width changes
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(containerRef.current);
    
    return () => resizeObserver.disconnect();
  }, []);
  
  // Skip if no actions
  if (!actions || actions.length === 0) return null;
  
  // Filter actions based on hidden callback
  const visibleActions = actions.filter(action => 
    !action.hidden || !action.hidden(rowData)
  );
  
  if (visibleActions.length === 0) return null;
  
  // Calculate how many buttons can fit based on container width
  // Each button is approximately 40px wide including gaps
  const buttonWidth = 40;
  const availableButtons = containerWidth > 0 ? 
    Math.floor(containerWidth / buttonWidth) : 
    position === 'dropdown' ? 0 : Math.min(maxInlineActions, visibleActions.length);
  
  // If position is dropdown, show all actions in dropdown
  // Otherwise show inline actions up to available space, then rest in dropdown
  const inlineActions = position === 'dropdown' 
    ? [] 
    : visibleActions.slice(0, Math.min(availableButtons, maxInlineActions));
  
  const dropdownActions = position === 'dropdown'
    ? visibleActions
    : visibleActions.length > inlineActions.length
      ? visibleActions.slice(inlineActions.length)
      : [];
  
  const hasDropdown = dropdownActions.length > 0;
  
  // Handle click on an action button
  const handleActionClick = (action: ActionConfig<T>, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (action.onClick && (!action.disabled || typeof action.disabled === 'function' && !action.disabled(rowData))) {
      action.onClick(rowData, rowIndex);
    }
    
    // Close dropdown after action
    if (dropdownOpen) {
      setDropdownOpen(false);
    }
  };
  
  // Toggle dropdown menu
  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDropdownOpen(!dropdownOpen);
  };
  
  // Close dropdown if clicked outside
  React.useEffect(() => {
    if (!dropdownOpen) return;
    
    const handleClickOutside = () => setDropdownOpen(false);
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [dropdownOpen]);
  
  // Get correct class for button
  const getButtonClass = (action: ActionConfig<T>) => {
    const variant = action.variant || buttonVariant;
    const type = action.type || 'default';
    
    return cn(
      'rpt-action-btn',
      `rpt-action-btn--${type}`,
      variant !== 'default' && `rpt-action-btn--${variant}`
    );
  };
  
  // Check if button is disabled
  const isDisabled = (action: ActionConfig<T>) => {
    if (typeof action.disabled === 'function') {
      return action.disabled(rowData);
    }
    return !!action.disabled;
  };

  // Get icon for action based on type
  const getActionIcon = (type: string) => {
    switch(type) {
      case 'view':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        );
      case 'edit':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
          </svg>
        );
      case 'delete':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        );
    }
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        'rpt-row-actions',
        `rpt-row-actions--${align}`,
        className
      )}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
        maxWidth: '225px',
        width: '100%',
        height: '100%', /* Fill the entire height of the cell */
        minHeight: '36px', /* Minimum height for actions */
        alignItems: 'center', /* Center buttons vertically */
        alignContent: 'center', /* Center wrapped content */
        padding: '4px' /* Maintain some padding */
      }}
    >
      {/* Inline action buttons */}
      {inlineActions.map((action) => (
        <button
          key={action.key}
          type="button"
          className={getButtonClass(action)}
          onClick={(e) => handleActionClick(action, e)}
          disabled={isDisabled(action)}
          title={showTooltips ? action.tooltip || action.label : undefined}
          aria-label={action.label}
          style={{ flexShrink: 0 }} /* Prevent buttons from shrinking */
        >
          {action.icon ? (
            <span className="rpt-action-icon">
              {action.icon}
            </span>
          ) : (
            <span className="rpt-action-icon">
              {getActionIcon(action.type || 'default')}
            </span>
          )}
          {showTooltips && action.tooltip && (
            <span className="rpt-action-tooltip">{action.tooltip}</span>
          )}
        </button>
      ))}
      
      {/* Dropdown menu button */}
      {hasDropdown && (
        <div className="rpt-action-menu" style={{ position: 'relative', flexShrink: 0 }}>
          <button
            type="button"
            className="rpt-action-btn rpt-action-menu-toggle"
            onClick={toggleDropdown}
            aria-label="More actions"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <span className="rpt-action-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
              </svg>
            </span>
          </button>
          
          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="rpt-action-menu-dropdown">
              {dropdownActions.map((action, index) => (
                <React.Fragment key={action.key}>
                  <button
                    className={cn(
                      'rpt-action-menu-item',
                      action.type === 'delete' && 'rpt-action-menu-item--destructive'
                    )}
                    onClick={(e) => handleActionClick(action, e)}
                    disabled={isDisabled(action)}
                    type="button"
                  >
                    {action.icon ? (
                      <span className="rpt-action-icon">{action.icon}</span>
                    ) : (
                      <span className="rpt-action-icon">
                        {getActionIcon(action.type || 'default')}
                      </span>
                    )}
                    {action.label}
                  </button>
                  {index < dropdownActions.length - 1 && (
                    <div className="rpt-action-menu-divider" />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TableRowActions;