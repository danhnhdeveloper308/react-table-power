import React from 'react';
import { cn } from '../../utils/cn';

export interface TableHeadProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  /**
   * Enables sticky positioning of the header
   */
  sticky?: boolean;
  
  /**
   * Additional class names
   */
  className?: string;
}

export const TableHead = React.forwardRef<
  HTMLTableSectionElement,
  TableHeadProps
>(({ children, sticky, className, ...props }, ref) => {
  return (
    <thead 
      ref={ref}
      className={cn(
        'rpt-table-head',
        className
      )}
      {...props}
    >
      {children}
    </thead>
  );
});

TableHead.displayName = 'TableHead';

export default TableHead;