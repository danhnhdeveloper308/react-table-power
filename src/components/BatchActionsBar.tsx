import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { BaseTableData } from '../types';

export interface BatchActionsBarProps<T extends BaseTableData = BaseTableData> {
  /**
   * Selected row count
   */
  selectedCount: number;
  
  /**
   * Selected row data
   */
  selectedRows: T[];
  
  /**
   * Handler for deleting selected rows
   */
  onDelete?: (selectedRows: T[]) => Promise<boolean> | boolean;
  
  /**
   * Handler for clearing selection
   */
  onClearSelection?: () => void;
  
  /**
   * Whether to animate the bar
   * @default true
   */
  animate?: boolean;
  
  /**
   * Class name for styling
   */
  className?: string;
  
  /**
   * Position of the bar
   * @default 'bottom'
   */
  position?: 'top' | 'bottom' | 'fixed';
  
  /**
   * CRITICAL FIX: Add loading state props
   * Whether the batch action is in a loading state
   * @default false
   */
  isLoading?: boolean;
  
  /**
   * Custom text for loading state
   * @default 'Đang xử lý...'
   */
  loadingText?: string;

  disabled?: boolean;
  
  /**
   * Additional custom actions
   */
  customActions?: Array<{
    key: string;
    label: string;
    icon?: React.ReactNode;
    onClick: (selectedRows: T[]) => Promise<boolean> | boolean;
    variant?: 'primary' | 'secondary' | 'danger';
    disabled?: boolean;
  }>;
}

/**
 * BatchActionsBar - A floating bar that appears when rows are selected
 */
export function BatchActionsBar<T extends BaseTableData = BaseTableData>({
  selectedCount,
  selectedRows,
  onDelete,
  onClearSelection,
  animate = true,
  className,
  position = 'bottom',
  isLoading = false,
  loadingText = 'Đang xử lý...',
  customActions = [],
  disabled = false
}: BatchActionsBarProps<T>) {
  // Local loading state for individual actions
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [lastActionResult, setLastActionResult] = useState<{ success: boolean; timestamp: number } | null>(null);

  // CRITICAL FIX: Enhanced delete action with guaranteed cleanup
  const handleDelete = useCallback(async () => {
    if (!onDelete || selectedRows.length === 0 || isLoading || actionLoading) return;
    
    setActionLoading('delete');
    setLastActionResult(null);
    
    try {
      console.log('[BatchActionsBar] Starting delete operation for', selectedRows.length, 'items');
      const result = await onDelete(selectedRows);
      console.log('[BatchActionsBar] Delete operation result:', result);
      
      // CRITICAL FIX: Track action result for UI feedback
      setLastActionResult({ success: result, timestamp: Date.now() });
      
      // CRITICAL FIX: Auto-clear result after delay
      setTimeout(() => {
        setLastActionResult(null);
      }, 3000);
      
    } catch (error) {
      console.error('[BatchActionsBar] Error in delete operation:', error);
      
      setLastActionResult({ success: false, timestamp: Date.now() });
      
      // Auto-clear error result after delay
      setTimeout(() => {
        setLastActionResult(null);
      }, 5000);
    } finally {
      setActionLoading(null);
    }
  }, [onDelete, selectedRows, isLoading, actionLoading]);

  // CRITICAL FIX: Enhanced custom action with error recovery
  const handleCustomAction = useCallback(async (actionKey: string, actionHandler: (rows: T[]) => Promise<boolean> | boolean) => {
    if (selectedRows.length === 0 || isLoading || actionLoading) return;
    
    setActionLoading(actionKey);
    setLastActionResult(null);
    
    try {
      console.log(`[BatchActionsBar] Starting ${actionKey} operation for`, selectedRows.length, 'items');
      const result = await actionHandler(selectedRows);
      console.log(`[BatchActionsBar] ${actionKey} operation result:`, result);
      
      setLastActionResult({ success: result, timestamp: Date.now() });
      
      setTimeout(() => {
        setLastActionResult(null);
      }, 3000);
    } catch (error) {
      console.error(`[BatchActionsBar] Error in ${actionKey} operation:`, error);
      
      setLastActionResult({ success: false, timestamp: Date.now() });
      
      setTimeout(() => {
        setLastActionResult(null);
      }, 5000);
    } finally {
      setActionLoading(null);
    }
  }, [selectedRows, isLoading, actionLoading]);

  // CRITICAL FIX: Enhanced clear selection with loading check
  const handleClearSelection = useCallback(() => {
    if (isLoading || actionLoading) {
      console.log('[BatchActionsBar] Cannot clear selection while operation in progress');
      return;
    }
    
    console.log('[BatchActionsBar] Clearing selection');
    setLastActionResult(null);
    onClearSelection?.();
  }, [onClearSelection, isLoading, actionLoading]);

  // Don't render if no items are selected
  if (selectedCount === 0) {
    return null;
  }

  const isAnyActionLoading = isLoading || actionLoading !== null;
  const currentLoadingText = actionLoading === 'delete' ? 'Đang xóa...' : 
                           actionLoading ? `Đang xử lý ${actionLoading}...` :
                           loadingText;

  return (
    <AnimatePresence>
      <motion.div
        className={cn(
          'rpt-batch-actions-bar',
          `rpt-batch-actions-${position}`,
          isAnyActionLoading && 'rpt-batch-actions-loading',
          className
        )}
        initial={animate ? { y: 50, opacity: 0 } : {}}
        animate={animate ? { y: 0, opacity: 1 } : {}}
        exit={animate ? { y: 50, opacity: 0 } : {}}
        transition={{ duration: 0.2 }}
      >
        <div className="rpt-batch-actions-content">
          {/* Selection info */}
          <div className="rpt-batch-actions-info">
            <span className="rpt-batch-actions-count">
              {selectedCount} mục đã được chọn
            </span>
            
            {/* CRITICAL FIX: Enhanced status display */}
            {isAnyActionLoading && (
              <span className="rpt-batch-actions-status">
                <div className="rpt-batch-actions-spinner" />
                {currentLoadingText}
              </span>
            )}
            
            {/* CRITICAL FIX: Show action result feedback */}
            {lastActionResult && !isAnyActionLoading && (
              <span className={cn(
                "rpt-batch-actions-result",
                lastActionResult.success ? "rpt-batch-actions-success" : "rpt-batch-actions-error"
              )}>
                {lastActionResult.success ? "✓ Thành công" : "✗ Thất bại"}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="rpt-batch-actions-buttons">
            {/* Custom actions */}
            {customActions.map((action) => (
              <button
                key={action.key}
                className={cn(
                  'rpt-batch-action-btn',
                  `rpt-batch-action-${action.variant || 'secondary'}`,
                  (isAnyActionLoading || action.disabled) && 'rpt-batch-action-disabled'
                )}
                onClick={() => handleCustomAction(action.key, action.onClick)}
                disabled={isAnyActionLoading || action.disabled}
              >
                {actionLoading === action.key ? (
                  <>
                    <div className="rpt-batch-action-spinner" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    {action.icon}
                    {action.label}
                  </>
                )}
              </button>
            ))}

            {/* Delete action */}
            {onDelete && (
              <button
                className={cn(
                  'rpt-batch-action-btn',
                  'rpt-batch-action-delete',
                  isAnyActionLoading && 'rpt-batch-action-disabled'
                )}
                onClick={handleDelete}
                disabled={isAnyActionLoading}
              >
                {actionLoading === 'delete' ? (
                  <>
                    <div className="rpt-batch-action-spinner" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <svg
                      className="rpt-batch-action-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                    Xóa ({selectedCount})
                  </>
                )}
              </button>
            )}

            {/* CRITICAL FIX: Enhanced clear selection button */}
            <button
              className={cn(
                'rpt-batch-action-btn',
                'rpt-batch-action-secondary',
                isAnyActionLoading && 'rpt-batch-action-disabled'
              )}
              onClick={handleClearSelection}
              disabled={isAnyActionLoading || disabled}
              title={isAnyActionLoading ? "Không thể hủy chọn khi đang xử lý" : "Hủy chọn tất cả"}
            >
              <svg
                className="rpt-batch-action-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              {isAnyActionLoading ? 'Đang xử lý...' : 'Hủy chọn'}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default BatchActionsBar;
