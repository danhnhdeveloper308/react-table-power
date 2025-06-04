import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BaseTableData, TableColumn } from '../../types';
import { dropdownVariants, columnItemVariants } from '../../motions/motion';

// Import icons
import { Columns, Check } from '../../icons';
import useOnClickOutside from '../../hooks/useOnClickOutside';

interface ColumnVisibilityToggleProps<T extends BaseTableData = BaseTableData> {
  /**
   * All available columns
   */
  columns: TableColumn<T>[];
  
  /**
   * Currently visible columns
   */
  visibleColumns?: TableColumn<T>[];
  
  /**
   * Callback when toggling a column's visibility
   */
  onToggleColumn: (columnId: string) => void;
  
  /**
   * Callback to show all columns
   */
  onShowAllColumns?: () => void;
  
  /**
   * Callback to hide all columns
   */
  onHideAllColumns?: () => void;
  
  /**
   * Callback to reset columns to default visibility
   */
  onResetColumns?: () => void;
  
  /**
   * Class name for the component
   */
  className?: string;

  /**
   * Alternative method to check if a column is visible using columnVisibility object
   */
  columnVisibility?: Record<string, boolean>;
}

export function ColumnVisibilityToggle<T extends BaseTableData = BaseTableData>({
  columns,
  visibleColumns = [],
  onToggleColumn,
  onShowAllColumns,
  onHideAllColumns,
  onResetColumns,
  className,
  columnVisibility
}: ColumnVisibilityToggleProps<T>) {
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [localVisibility, setLocalVisibility] = useState<Record<string, boolean>>({});
  const [isMounted, setIsMounted] = useState(false);
  
  // Refs
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Initialize local visibility state from props
  useEffect(() => {
    if (columnVisibility) {
      setLocalVisibility({...columnVisibility});
    } else if (visibleColumns.length > 0 && columns.length > 0) {
      const visibilityMap: Record<string, boolean> = {};
      columns.forEach(column => {
        const columnId = column.id || column.accessorKey as string;
        if (columnId) {
          visibilityMap[columnId] = visibleColumns.some(
            (col) => (col.id || col.accessorKey as string) === columnId
          );
        }
      });
      setLocalVisibility(visibilityMap);
    }
  }, [columnVisibility, visibleColumns, columns]);

  // Mark component as mounted (for hydration safety)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useOnClickOutside(dropdownRef, () => setIsOpen(false));
  
  // Close on ESC key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen]);
  
  // Check if a column is visible - supports both methods
  const isColumnVisible = useCallback((column: TableColumn<T>): boolean => {
    const columnId = column.id || column.accessorKey as string;
    
    // If columnVisibility object is provided, use it
    if (columnVisibility) {
      return columnVisibility[columnId] !== false;
    }
    
    // Otherwise check in visibleColumns array
    return visibleColumns.some(
      (col) => (col.id || col.accessorKey as string) === columnId
    );
  }, [columnVisibility, visibleColumns]);

  // Handle toggle column directly for better responsiveness
  const handleToggleColumn = useCallback((columnId: string) => {
    // Update local state immediately for responsive UI
    setLocalVisibility(prev => ({
      ...prev,
      [columnId]: !prev[columnId]
    }));
    
    // Call the parent callback
    onToggleColumn(columnId);
  }, [onToggleColumn]);

  // Handle hide all columns
  const handleHideAll = useCallback(() => {
    // Update local state immediately
    const newVisibility: Record<string, boolean> = {};
    columns.forEach(column => {
      const columnId = column.id || column.accessorKey as string;
      if (columnId) {
        newVisibility[columnId] = false;
      }
    });
    setLocalVisibility(newVisibility);
    
    // Call parent callback
    if (onHideAllColumns) {
      onHideAllColumns();
    }
    
    setIsOpen(false);
  }, [columns, onHideAllColumns]);

  // Handle show all columns
  const handleShowAll = useCallback(() => {
    // Update local state immediately
    const newVisibility: Record<string, boolean> = {};
    columns.forEach(column => {
      const columnId = column.id || column.accessorKey as string;
      if (columnId) {
        newVisibility[columnId] = true;
      }
    });
    setLocalVisibility(newVisibility);
    
    // Call parent callback
    if (onShowAllColumns) {
      onShowAllColumns();
    }
    
    setIsOpen(false);
  }, [columns, onShowAllColumns]);

  // Handle reset columns
  const handleReset = useCallback(() => {
    if (onResetColumns) {
      onResetColumns();
    }
    setIsOpen(false);
  }, [onResetColumns]);

  // Calculate hidden columns count - only client-side to avoid hydration mismatch
  const hiddenColumnsCount = isMounted ? 
    columns.filter(col => !isColumnVisible(col)).length : 0;

  return (
    <div className={`rpt-column-visibility ${className || ''}`} ref={dropdownRef}>
      {/* Toggle button */}
      <button
        type="button"
        className={`rpt-column-visibility-button ${isOpen ? 'rpt-column-visibility-button--active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle column visibility"
        aria-expanded={isOpen}
        aria-controls="column-visibility-dropdown"
      >
        <span className="rpt-column-visibility-icon">
          <Columns size={16} />
        </span>
        <span className="rpt-column-visibility-text">Columns</span>
        
        {/* Only show badge on client-side to prevent hydration mismatch */}
        {isMounted && hiddenColumnsCount > 0 && (
          <span className="rpt-column-count">{hiddenColumnsCount}</span>
        )}
      </button>
      
      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="rpt-column-visibility-dropdown"
            id="column-visibility-dropdown"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={dropdownVariants}
            role="menu"
          >
            {/* Header */}
            <div className="rpt-column-visibility-header">
              <h3 className="rpt-column-visibility-title">Toggle columns</h3>
              
              <div className="rpt-column-visibility-actions">
                <button 
                  type="button" 
                  className="rpt-column-visibility-action-btn"
                  onClick={handleShowAll}
                >
                  Show all
                </button>
                
                <button 
                  type="button" 
                  className="rpt-column-visibility-action-btn"
                  onClick={handleHideAll}
                >
                  Hide all
                </button>
                
                {onResetColumns && (
                  <button 
                    type="button" 
                    className="rpt-column-visibility-action-btn"
                    onClick={handleReset}
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
            
            {/* Column list */}
            <div className="rpt-column-visibility-list">
              {columns.length === 0 ? (
                <p className="rpt-column-visibility-empty">No columns available</p>
              ) : (
                columns.map((column, index) => {
                  const columnId = column.id || column.accessorKey as string;
                  // Use local visibility state for immediate feedback
                  const isVisible = columnId ? 
                    (localVisibility[columnId] !== undefined ? 
                      localVisibility[columnId] : 
                      isColumnVisible(column)
                    ) : true;
                  
                  const label = typeof column.header === 'string' 
                    ? column.header 
                    : columnId;
                  
                  if (!columnId) return null;

                  return (
                    <motion.div 
                      key={columnId} 
                      className="rpt-column-visibility-item"
                      variants={columnItemVariants}
                      custom={index}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <label className="rpt-column-visibility-label">
                        <input
                          type="checkbox"
                          className="rpt-column-visibility-checkbox"
                          checked={isVisible}
                          onChange={() => handleToggleColumn(String(columnId))}
                        />
                        <span className="rpt-column-visibility-label-text">
                          {label}
                        </span>
                      </label>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ColumnVisibilityToggle;