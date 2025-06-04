import React from 'react';
import { cn } from '../../utils/cn';
import { HeaderGroup, Header } from '@tanstack/react-table';
import { BaseTableData } from '../../types';

export interface TableHeaderRowProps<T extends BaseTableData = BaseTableData> extends React.HTMLAttributes<HTMLTableRowElement> {
  /**
   * Header group data from TanStack Table
   */
  headerGroup?: HeaderGroup<T>;
  
  /**
   * Function to render header cells
   */
  renderHeaderCell?: (header: Header<T, unknown>, index: number) => React.ReactNode;
}

/**
 * TableHeaderRow component - Used for complex header structures, especially with column groups
 */
export const TableHeaderRow = <T extends BaseTableData = BaseTableData>({ 
  headerGroup,
  renderHeaderCell,
  children,
  className,
  ...props 
}: TableHeaderRowProps<T>) => {
  return (
    <tr 
      className={cn(
        'rpt-header-row',
        className
      )}
      {...props}
    >
      {headerGroup ? (
        headerGroup.headers.map((header, index) => 
          renderHeaderCell ? renderHeaderCell(header, index) : (
            <th key={header.id} colSpan={header.colSpan} className="rpt-header-cell">
              {header.isPlaceholder ? null : (
                typeof header.column.columnDef.header === 'function' 
                  ? header.column.columnDef.header(header.getContext()) 
                  : header.column.columnDef.header
              )}
            </th>
          )
        )
      ) : (
        children
      )}
    </tr>
  );
};

export default TableHeaderRow;