import React, { useContext, useRef, useEffect } from 'react';
import { TableProps, BaseTableData, TableSize } from '../../types';
import { cn } from '../../utils/cn';

export function Table<T extends BaseTableData = BaseTableData>({
  data,
  columns,
  children,
  size = 'medium',
  striped = false,
  bordered = false,
  highlightOnHover = true,
  stickyHeader = false,
  dense = false,
  fullWidth = true,
  zebra,
  rounded = true,
  className,
  variant,
  ...props
}: TableProps<T>) {
  // Get theme context
  const tableRef = useRef<HTMLTableElement>(null);
  
  // Map size to the appropriate CSS class
  const sizeMap: Record<TableSize, string> = {
    small: 'rpt-table-small',
    medium: 'rpt-table-medium', // No specific class for medium as it's the default
    large: 'rpt-table-large'
  };
  
  const sizeClass = sizeMap[size];
  
  // Use zebra as alternative name for striped if provided
  const isZebraStriped = striped || zebra;
  
  // Combine all class names with classes that actually exist in CSS
  const tableClasses = cn(
    'rpt-table',
    sizeClass,
    {
      'rpt-table-bordered': bordered,
      'rpt-zebra-striping': isZebraStriped,
      'rpt-table-hover': highlightOnHover,
      'rpt-sticky-header': stickyHeader,
      'rpt-table-full-width': fullWidth,
    },
    className
  );

  // Calculate estimated min-width based on columns
  const estimatedWidth = useRef<number | null>(null);

  useEffect(() => {
    // Calculate estimated width only once
    if (estimatedWidth.current === null && columns && columns.length) {
      // Base width for minimum columns
      let baseWidth = 0;
      
      // Add width for each column based on configuration or default values
      columns.forEach(col => {
        // Use provided width or default minimum width (180px)
        const colWidth = col.width ? 
          (typeof col.width === 'number' ? col.width : parseInt(col.width as string, 10)) : 
          180;
        
        baseWidth += colWidth || 180; // Fallback to 180px if parsing fails
      });
      
      // Add some padding for action columns, selection, etc.
      const actionPadding = 220; // Space for actions
      const estimatedTotalWidth = baseWidth + actionPadding;
      
      estimatedWidth.current = estimatedTotalWidth;
      
      // Apply estimated width to table
      if (tableRef.current) {
        tableRef.current.style.minWidth = `${estimatedTotalWidth}px`;
      }
    }
  }, [columns]);
  
  // NOTE: The parent wrapper element handled separately
  const containerClass = stickyHeader ? 'rpt-fixed-header' : '';
  
  useEffect(() => {
    // Debug log for diagnostics
    if (process.env.NODE_ENV !== 'production') {
      // Check for parent container to apply sticky header class
      if (stickyHeader && tableRef.current) {
        // Find closest rpt-table-container
        const container = tableRef.current.closest('.rpt-table-container');
        if (container) {
          container.classList.add('rpt-fixed-header');
          console.log('Applied rpt-fixed-header to parent container');
        } else {
          console.warn('Could not find parent .rpt-table-container to apply rpt-fixed-header class');
        }
      }
    }
  }, [tableClasses, containerClass, size, striped, zebra, bordered, highlightOnHover, stickyHeader]);
  
  return (
    <table ref={tableRef} className={tableClasses} {...props}>
      {children}
    </table>
  );
}

export default Table;