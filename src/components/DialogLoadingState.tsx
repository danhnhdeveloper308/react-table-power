import React from 'react';
import { cn } from '../utils/cn';
import { LoadingType } from '../types';
import { formatError } from '../utils/errorHandling';

export interface DialogLoadingStateProps {
  /**
   * Whether the loading state is active
   */
  loading: boolean;
  
  /**
   * Type of loading indicator to show
   * @default 'spinner'
   */
  type?: LoadingType;
  
  /**
   * Variant of loading display
   * @default 'overlay'
   */
  variant?: 'overlay' | 'blur' | 'skeleton' | 'fade' | 'none';
  
  /**
   * Size of the loading indicator
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /**
   * Text to display during loading
   * @default 'Loading...'
   */
  text?: string;
  
  /**
   * Whether to blur the content behind the loading indicator
   * @default true
   */
  blur?: boolean;
  
  /**
   * Whether to disable pointer events during loading
   * @default true
   */
  disablePointerEvents?: boolean;
  
  /**
   * Children content that will be overlaid with the loading state
   */
  children: React.ReactNode;
  
  /**
   * Error state to display
   */
  error?: React.ReactNode;
}

/**
 * DialogLoadingState - Component to show loading state over dialog content
 */
export const DialogLoadingState: React.FC<DialogLoadingStateProps> = ({
  loading,
  type = 'spinner',
  variant = 'overlay',
  size = 'md',
  text = 'Loading...',
  blur = true,
  disablePointerEvents = true,
  children,
  error
}) => {
  // If not loading or variant is none, just render the children
  if (!loading || variant === 'none') {
    return <>{children}</>;
  }
  
  // Safely format error for rendering
  const formattedError = error ? formatError(error) : null;
  
  // Render error state if present
  if (formattedError) {
    return (
      <div className="rpt-dialog-error-state">
        <div className="rpt-dialog-error-content">
          <div className="rpt-dialog-error-icon">⚠️</div>
          <div className="rpt-dialog-error-message">
            {formattedError}
          </div>
        </div>
        <div className="rpt-dialog-content-dimmed">
          {children}
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={cn(
        'rpt-dialog-loading-wrapper',
        disablePointerEvents && 'rpt-loading-disabled',
      )}
    >
      <div 
        className={cn(
          'rpt-dialog-content-with-loading',
          `rpt-loading-effect-${variant}`,
          blur && 'rpt-loading-blur'
        )}
      >
        {children}
      </div>
      
      <div 
        className="rpt-dialog-loading"
        role="status"
        aria-live="polite"
      >
        <div className={`rpt-loading-${type} rpt-loading-size-${size}`}></div>
        <span>{text}</span>
      </div>
    </div>
  );
};

export default DialogLoadingState;
