import React from 'react';
import { cn } from '../../utils/cn';

export interface TableHeadRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /**
   * Additional CSS classes for the header row
   */
  className?: string;
}

/**
 * TableHeadRow component - Row container for header cells
 */
export const TableHeadRow: React.FC<TableHeadRowProps> = ({ 
  children, 
  className,
  ...props 
}) => {
  return (
    <tr 
      className={cn(
        'rpt-head-row',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
};

export default TableHeadRow;