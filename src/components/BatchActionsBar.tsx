import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BaseTableData } from '../types';
import { cn } from '../utils/cn';

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
  onClearSelection: () => void;
  
  /**
   * Additional custom actions
   */
  customActions?: React.ReactNode;
  
  /**
   * Class name for styling
   */
  className?: string;
  
  /**
   * Custom text for selection count
   */
  selectionText?: string;
  
  /**
   * Whether to animate the bar
   * @default true
   */
  animate?: boolean;
}

/**
 * BatchActionsBar - A floating bar that appears when rows are selected
 */
export function BatchActionsBar<T extends BaseTableData = BaseTableData>({
  selectedCount,
  selectedRows,
  onDelete,
  onClearSelection,
  customActions,
  className,
  selectionText,
  animate = true,
}: BatchActionsBarProps<T>) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  
  // Handle batch delete action
  const handleDelete = async () => {
    if (!onDelete || isDeleting) return;
    
    try {
      setIsDeleting(true);
      await onDelete(selectedRows);
      onClearSelection();
    } catch (error) {
      console.error('Error deleting selected rows:', error);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // If no rows are selected, don't render anything
  if (selectedCount === 0) {
    return null;
  }
  
  // The batch actions bar
  const content = (
    <div className={cn("rpt-batch-actions-bar", className)}>
      <div className="rpt-batch-actions-text">
        {selectionText || `${selectedCount} hàng đã chọn`}
      </div>
      
      <div className="rpt-batch-actions-buttons">
        {customActions}
        
        {/* Always show delete button when onDelete is provided */}
        {onDelete && (
          <button
            className="rpt-batch-action-btn rpt-batch-action-delete"
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label="Delete selected rows"
          >
            {isDeleting ? (
              <>
                <span className="rpt-spinner rpt-spinner-sm" />
                <span>Đang xóa...</span>
              </>
            ) : (
              <span>Xóa</span>
            )}
          </button>
        )}
        
        {/* Always show cancel button */}
        <button
          className="rpt-batch-action-btn rpt-batch-action-cancel"
          onClick={onClearSelection}
          disabled={isDeleting}
          aria-label="Cancel selection"
        >
          Hủy chọn
        </button>
      </div>
    </div>
  );
  
  // If animation is enabled, wrap in AnimatePresence + motion.div
  return (
    <div className="rpt-batch-actions-container">
      {animate ? (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            {content}
          </motion.div>
        </AnimatePresence>
      ) : (
        content
      )}
    </div>
  );
}

export default BatchActionsBar;
