import React from 'react';
import { cn } from '../../utils/cn';
import { ColumnAlignment, SortDirection } from '../../types';

export interface TableHeadCellProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  /**
   * Is this header cell sortable
   */
  sortable?: boolean;
  
  /**
   * Current sort direction
   */
  sortDirection?: SortDirection;
  
  /**
   * Whether this cell contains actions
   */
  isAction?: boolean;
  
  /**
   * Whether this cell contains selection controls
   */
  isSelect?: boolean;

  /**
   * Width of the column (CSS width value)
   */
  width?: string | number;
  
  /**
   * Text alignment
   */
  align?: ColumnAlignment;
  
  /**
   * Custom class name
   */
  className?: string;
}

export const TableHeadCell = React.forwardRef<
  HTMLTableCellElement,
  TableHeadCellProps
>(({ 
  children, 
  sortable, 
  sortDirection, 
  isAction,
  isSelect,
  width,
  align = 'left', 
  className,
  ...props 
}, ref) => {
  return (
    <th
      ref={ref}
      className={cn(
        'rpt-head-cell',
        sortable && 'rpt-sortable',
        align !== 'left' && `rpt-align-${align}`,
        isAction && 'rpt-action-header-cell',
        isSelect && 'rpt-select-cell',
        className
      )}
      style={{
        width: width ? width : 'auto',
        minWidth: isAction ? 'auto' : undefined
      }}
      {...props}
    >
      <div className={cn('rpt-cell-content', isAction && 'rpt-action-header-content')}>
        {children}
        {sortable && (
          <span className="rpt-sort-indicator">
            {sortDirection === 'asc' && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 4L14 10H2L8 4Z" fill="currentColor" />
              </svg>
            )}
            {sortDirection === 'desc' && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 12L2 6H14L8 12Z" fill="currentColor" />
              </svg>
            )}
            {!sortDirection && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 4L14 10H2L8 4Z" fill="currentColor" opacity="0.2" />
                <path d="M8 12L2 6H14L8 12Z" fill="currentColor" opacity="0.2" />
              </svg>
            )}
          </span>
        )}
      </div>
    </th>
  );
});

TableHeadCell.displayName = 'TableHeadCell';

export default TableHeadCell;