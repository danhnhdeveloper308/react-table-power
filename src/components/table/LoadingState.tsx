import React from 'react';
import { cn } from '../../utils/cn';

export interface LoadingStateProps {
  /**
   * Text to display while loading
   * @default "Loading data..."
   */
  text?: string;
  
  /**
   * Whether to show the spinner
   * @default true
   */
  showSpinner?: boolean;
  
  /**
   * Custom loading indicator
   */
  customIndicator?: React.ReactNode;
  
  /**
   * Additional CSS class
   */
  className?: string;
}

/**
 * LoadingState component - Displays a loading indicator
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  text = 'Loading data...',
  showSpinner = true,
  customIndicator,
  className,
}) => {
  return (
    <div className={cn('rpt-loading-container', className)}>
      {customIndicator || (showSpinner && <div className="rpt-loading-spinner" />)}
      {text && <p className="rpt-loading-text">{text}</p>}
    </div>
  );
};

export default LoadingState;