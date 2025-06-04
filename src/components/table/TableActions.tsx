import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import { BaseTableData } from '../../types';

export interface TableAction {
  /**
   * Unique identifier for the action
   */
  id: string;
  
  /**
   * Label text for the action
   */
  label: string;
  
  /**
   * Icon for the action button
   */
  icon?: React.ReactNode;
  
  /**
   * Action handler function
   */
  onClick?: (data: any, event: React.MouseEvent) => void;
  
  /**
   * Visual variant of the action button
   */
  variant?: 'default' | 'primary' | 'destructive' | 'outline' | 'ghost' | 'link';
  
  /**
   * Whether the action button is disabled
   */
  disabled?: boolean;
  
  /**
   * Tooltip text to show on hover
   */
  tooltip?: string;
  
  /**
   * Whether to show this action in the dropdown menu
   */
  inDropdown?: boolean;
}

export interface TableActionsProps<T extends BaseTableData = BaseTableData> {
  /**
   * Row data object
   */
  rowData?: T;
  
  /**
   * Actions to show in the row
   */
  actions: TableAction[];
  
  /**
   * Maximum number of actions to show before using dropdown
   */
  maxVisibleActions?: number;
  
  /**
   * Alignment of actions
   */
  align?: 'left' | 'center' | 'right';
  
  /**
   * Whether the action buttons are fixed to the right side
   */
  fixed?: boolean;
  
  /**
   * Size of action buttons
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Custom class name
   */
  className?: string;
  
  /**
   * Use modern style for action buttons
   */
  modern?: boolean;
  
  /**
   * Display mode: icon only, text only, or both
   */
  displayMode?: 'icon' | 'text' | 'both';
}

/**
 * TableActions component - Displays action buttons for table rows
 * with dynamic sizing based on the number of buttons
 */
export const TableActions = <T extends BaseTableData = BaseTableData>({
  rowData,
  actions = [],
  maxVisibleActions = 3,
  align = 'center',
  fixed = false,
  size = 'md',
  className,
  modern = true,
  displayMode = 'icon',
}: TableActionsProps<T>) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  // Calculate available width and adjust button display accordingly
  React.useEffect(() => {
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
  
  // Filter out actions that might be null or undefined
  const validActions = actions.filter(Boolean);
  
  // Calculate how many buttons can fit based on container width
  // Each button is approximately 36px wide including gaps
  const buttonWidth = 36;
  const availableButtons = containerWidth > 0 ? 
    Math.floor(containerWidth / buttonWidth) : 
    maxVisibleActions;
  
  // Determine which actions to display inline vs. in dropdown
  const visibleActions = validActions.filter(action => !action.inDropdown).slice(0, availableButtons);
  const dropdownActions = [
    ...validActions.filter(action => action.inDropdown),
    ...validActions.filter(action => !action.inDropdown).slice(availableButtons)
  ];
  
  const hasDropdownActions = dropdownActions.length > 0;
  
  // Toggle dropdown menu
  const toggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropdownOpen(!dropdownOpen);
  };
  
  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      if (dropdownOpen) {
        setDropdownOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [dropdownOpen]);
  
  // Handle action click
  const handleActionClick = (action: TableAction, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (action.onClick && !action.disabled) {
      action.onClick(rowData, e);
    }
    if (dropdownOpen) {
      setDropdownOpen(false);
    }
  };
  
  // Size modifier for CSS class
  const sizeClass = size === 'sm' ? `${modern ? 'rpt-modern-action-btn' : 'rpt-action-btn'}--sm` : 
                   size === 'lg' ? `${modern ? 'rpt-modern-action-btn' : 'rpt-action-btn'}--lg` : '';
  
  // Get action button classes based on modern flag
  const getActionBtnClasses = (action: TableAction) => {
    if (modern) {
      return cn(
        'rpt-modern-action-btn',
        `rpt-modern-action-btn--${action.variant || getDefaultVariant(action)}`,
        sizeClass,
        displayMode === 'text' && 'rpt-modern-action-btn--text',
        displayMode === 'both' && 'rpt-modern-action-btn--both'
      );
    }
    
    return cn(
      'rpt-action-btn',
      `rpt-action-btn--${action.variant || getDefaultVariant(action)}`,
      sizeClass,
      displayMode === 'text' && 'rpt-action-btn--text',
      displayMode === 'both' && 'rpt-action-btn--both'
    );
  };
  
  // Get default variant based on action ID
  const getDefaultVariant = (action: TableAction): string => {
    if (action.id.includes('view') || action.id.includes('detail')) return 'view';
    if (action.id.includes('edit') || action.id.includes('update')) return 'edit';
    if (action.id.includes('delete') || action.id.includes('remove')) return 'delete';
    return 'default';
  };
  
  // Get icon wrapper class based on modern flag
  const getIconClass = () => {
    return modern ? 'rpt-modern-action-icon' : 'rpt-action-icon';
  };

  // Get icon based on action type
  const getActionIcon = (action: TableAction) => {
    if (action.icon) {
      return action.icon;
    }
    
    const iconType = action.id.includes('view') ? 'view' :
                    action.id.includes('edit') ? 'edit' :
                    action.id.includes('delete') ? 'delete' :
                    'default';
    
    switch(iconType) {
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
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
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
        fixed && 'rpt-row-actions--fixed',
        className
      )}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
        maxWidth: '225px',
        width: '100%',
        height: '100%',
        minHeight: '36px',
        alignItems: 'center',
        alignContent: 'center',
        padding: '4px'
      }}
    >
      {/* Visible action buttons */}
      {visibleActions.map(action => (
        <button
          key={action.id}
          type="button"
          disabled={action.disabled}
          className={getActionBtnClasses(action)}
          onClick={(e) => handleActionClick(action, e)}
          title={action.tooltip}
          style={{ flexShrink: 0 }}
        >
          {(displayMode === 'icon' || displayMode === 'both') && (
            <span className={getIconClass()}>
              {getActionIcon(action)}
            </span>
          )}
          {(displayMode === 'text' || displayMode === 'both') && (
            <span className="rpt-action-label">{action.label}</span>
          )}
          {action.tooltip && <span className="rpt-action-tooltip">{action.tooltip}</span>}
        </button>
      ))}
      
      {/* Dropdown menu for additional actions */}
      {hasDropdownActions && (
        <div className="rpt-action-menu" style={{ position: 'relative', flexShrink: 0 }}>
          <button
            type="button"
            className={cn(
              modern ? 'rpt-modern-action-btn' : 'rpt-action-btn',
              'rpt-action-menu-toggle',
              sizeClass
            )}
            onClick={toggleDropdown}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            title="More actions"
          >
            <span className={getIconClass()}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
              </svg>
            </span>
          </button>
          
          {dropdownOpen && (
            <div className="rpt-action-menu-dropdown">
              {dropdownActions.map((action, index) => (
                <React.Fragment key={action.id}>
                  <button
                    className={cn(
                      'rpt-action-menu-item',
                      action.variant === 'destructive' && 'rpt-action-menu-item--destructive',
                      getDefaultVariant(action) === 'delete' && 'rpt-action-menu-item--destructive',
                      action.disabled && 'rpt-action-menu-item--disabled'
                    )}
                    disabled={action.disabled}
                    onClick={(e) => handleActionClick(action, e)}
                  >
                    <span className={getIconClass()}>
                      {getActionIcon(action)}
                    </span>
                    <span>{action.label}</span>
                  </button>
                  {index < dropdownActions.length - 1 && <div className="rpt-action-menu-divider" />}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TableActions;