import React from 'react';
import { cn } from '../../utils/cn';

export interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  /**
   * Whether the footer should stick to the bottom
   * @default false
   */
  sticky?: boolean;
  
  /**
   * Whether to render a summary row
   * @default false
   */
  showSummary?: boolean;
  
  /**
   * Background color class for the footer
   */
  bgColor?: string;
}

/**
 * TableFooter component - Container for table footer content
 */
export const TableFooter: React.FC<TableFooterProps> = ({
  children,
  sticky = false,
  showSummary = false,
  bgColor,
  className,
  ...props
}) => {
  return (
    <tfoot 
      className={cn(
        'rpt-table-footer',
        sticky && 'rpt-sticky-footer',
        showSummary && 'rpt-table-summary',
        bgColor,
        className
      )}
      {...props}
    >
      {children}
    </tfoot>
  );
};

export default TableFooter;