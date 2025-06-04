import React from 'react';
import { cn } from '../../utils/cn';

export interface EmptyStateProps {
  /**
   * Title text for the empty state
   */
  title?: string;
  
  /**
   * Description text for the empty state
   */
  description?: string;
  
  /**
   * Custom icon to display
   */
  icon?: React.ReactNode;
  
  /**
   * Custom action component (button, link, etc.)
   */
  action?: React.ReactNode;
  
  /**
   * Additional CSS class
   */
  className?: string;
}

/**
 * EmptyState component - Displays a message when no data is available
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data available',
  description = 'There are no items to display at the moment.',
  icon,
  action,
  className,
}) => {
  // Default empty state icon
  const defaultIcon = (
    <svg
      className="rpt-empty-icon"
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <path d="M13 2v7h7" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </svg>
  );

  return (
    <div className={cn('rpt-empty-container', className)}>
      {icon || defaultIcon}
      <h4 className="rpt-empty-title">{title}</h4>
      <p className="rpt-empty-description">{description}</p>
      {action && <div className="rpt-empty-action">{action}</div>}
    </div>
  );
};

export default EmptyState;