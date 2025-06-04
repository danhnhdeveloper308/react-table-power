import React from 'react';
import { cn } from '../../utils/cn';

export interface TableEmptyProps {
  /**
   * Empty state title text
   * @default 'No data'
   */
  title?: string;
  
  /**
   * Empty state message text
   * @default 'No data available'
   */
  message?: string;
  
  /**
   * Custom icon to display
   */
  icon?: React.ReactNode;
  
  /**
   * Number of columns to span
   * @default 1
   */
  colSpan?: number;
  
  /**
   * Whether to display a refresh/reload button
   * @default false
   */
  showRefresh?: boolean;
  
  /**
   * Function to call when refresh button is clicked
   */
  onRefresh?: () => void;
  
  /**
   * Custom refresh button text
   * @default 'Refresh'
   */
  refreshText?: string;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Custom content to render instead of the default empty state
   */
  children?: React.ReactNode;
}

/**
 * TableEmpty component - Shown when table has no data
 */
export const TableEmpty: React.FC<TableEmptyProps> = ({
  title = 'No data',
  message = 'No data available',
  icon,
  colSpan = 1,
  showRefresh = false,
  onRefresh,
  refreshText = 'Refresh',
  className,
  children,
}) => {
  // Default empty state icon
  const defaultIcon = (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  );
  
  return (
    <tr>
      <td colSpan={colSpan} className="rpt-empty-cell">
        {children || (
          <div className={cn('rpt-empty-state', className)}>
            <div className="rpt-empty-icon">
              {icon || defaultIcon}
            </div>
            
            <h4 className="rpt-empty-title">{title}</h4>
            <p className="rpt-empty-message">{message}</p>
            
            {showRefresh && onRefresh && (
              <button 
                className="rpt-btn rpt-btn-primary" 
                onClick={onRefresh}
              >
                {refreshText}
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  );
};

export default TableEmpty;