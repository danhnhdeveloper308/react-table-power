import React from 'react';
import { TableRow, TableRowProps } from './TableRow';
import { BaseTableData } from '../../types';

/**
 * TableRowMemo component - Memoized version of TableRow to prevent unnecessary re-renders
 * 
 * This component should be used when dealing with large datasets to optimize rendering performance
 */
export const TableRowMemo = React.memo(
  // Component with proper generic typing
  <T extends BaseTableData = BaseTableData>(props: TableRowProps<T>) => {
    return <TableRow<T> {...props} />;
  },
  // Comparison function with proper typing
  (prevProps: TableRowProps<any>, nextProps: TableRowProps<any>): boolean => {
    // Custom comparison function for memoization
    // Only re-render if these props change
    return (
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isExpanded === nextProps.isExpanded &&
      prevProps.rowIndex === nextProps.rowIndex &&
      // Only compare rowData if it's an object and has changed
      (prevProps.rowData === nextProps.rowData ||
        (prevProps.rowData &&
          nextProps.rowData &&
          JSON.stringify(prevProps.rowData) === JSON.stringify(nextProps.rowData)))
    );
  }
);

TableRowMemo.displayName = 'TableRowMemo';

export default TableRowMemo;