import React from 'react';
import { cn } from '../utils/cn';

export interface ErrorStateProps {
  /**
   * Error object or message
   */
  error?: Error | string | null;

  /**
   * Additional CSS class
   */
  className?: string;

  /**
   * Whether to show a retry button
   * @default false
   */
  showRetry?: boolean;

  /**
   * Handler for retry button click
   */
  onRetry?: () => void;

  /**
   * Custom renderer for error message
   */
  renderMessage?: (error: Error | string) => React.ReactNode;

  /**
   * Default error message if no error is provided
   */
  defaultMessage?: string;
}

/**
 * ErrorState component - Display error message with optional retry button
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  className,
  showRetry = false,
  onRetry,
  renderMessage,
  defaultMessage = 'Đã xảy ra lỗi',
}) => {
  // If no error, use default message
  const errorMessage = error 
    ? (typeof error === 'string' ? error : error.message || defaultMessage)
    : defaultMessage;

  return (
    <div className={cn('rpt-error-state', className)}>
      <div className="rpt-error-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <div className="rpt-error-content">
        {renderMessage ? (
          renderMessage(error || defaultMessage)
        ) : (
          <p className="rpt-error-message">{errorMessage}</p>
        )}
        
        {showRetry && onRetry && (
          <button 
            className="rpt-button rpt-button-secondary rpt-error-retry" 
            onClick={onRetry}
            type="button"
          >
            Thử lại
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorState;