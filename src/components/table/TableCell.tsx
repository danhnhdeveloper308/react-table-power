import React from 'react';
import { cn } from '../../utils/cn';
import { BaseTableData, ColumnAlignment, TableColumn } from '../../types';

export interface TableCellProps<T extends BaseTableData = BaseTableData> extends React.TdHTMLAttributes<HTMLTableCellElement> {
  /**
   * Whether this cell is an action cell
   */
  isAction?: boolean;
  
  /**
   * Whether to truncate text in this cell
   */
  truncate?: boolean;
  
  /**
   * Maximum width for truncated text
   */
  maxWidth?: number | string;
  
  /**
   * Text alignment
   */
  align?: ColumnAlignment;
  
  /**
   * Custom class name
   */
  className?: string;
  
  /**
   * Cell value (from row data)
   */
  value?: any;

  /**
   * Column definition associated with this cell
   */
  column?: TableColumn<T>;
  
  /**
   * Row data associated with this cell
   */
  rowData?: T;
  
  /**
   * Row index
   */
  rowIndex?: number;
}

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  TableCellProps<any>
>(({ 
  children, 
  isAction,
  truncate, 
  maxWidth, 
  align = 'left',
  className,
  value: _value, // Add but don't use directly (available for consumers)
  column: _column, // Add but don't use directly (available for consumers)
  rowData: _rowData, // Add but don't use directly (available for consumers)
  rowIndex: _rowIndex, // Add but don't use directly (available for consumers)
  ...props 
}, ref) => {
  return (
    <td
      ref={ref}
      className={cn(
        'rpt-cell',
        isAction && 'rpt-action-cell',
        align !== 'left' && `rpt-align-${align}`,
        truncate && 'rpt-cell-truncate',
        className
      )}
      style={{
        ...(truncate && maxWidth ? { maxWidth } : {}),
      }}
      {...props}
    >
      {children}
    </td>
  );
});

TableCell.displayName = 'TableCell';

export default TableCell;