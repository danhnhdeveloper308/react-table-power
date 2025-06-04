import React from 'react';
import { cn } from '../../utils/cn';

export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  /**
   * Whether the table is in loading state
   * @default false
   */
  loading?: boolean;
  
  /**
   * Whether to apply zebra striping to rows
   * @default false
   */
  striped?: boolean;
}

/**
 * TableBody component - Container for table rows
 */
export const TableBody: React.FC<TableBodyProps> = ({ 
  children, 
  className,
  loading = false,
  striped = false,
  ...props 
}) => {
  return (
    <tbody 
      className={cn(
        'rpt-table-body',
        loading && 'rpt-table-loading',
        striped && 'rpt-zebra-striping',
        className
      )}
      {...props}
    >
      {children}
    </tbody>
  );
};

export default TableBody;