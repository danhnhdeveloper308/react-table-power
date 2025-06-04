import React, { useRef, useEffect } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';
import { BaseTableData } from '../../types';

// Define separate types for motion props vs HTML props
type HTMLTableRowProps = Omit<
  React.HTMLAttributes<HTMLTableRowElement>, 
  'onClick' | 'onDoubleClick'
>;

type MotionTableRowProps = Omit<
  HTMLMotionProps<"tr">, 
  'onClick' | 'onDoubleClick'
>;

export interface TableRowProps<T extends BaseTableData = BaseTableData> {
  /**
   * Row data object
   */
  rowData?: T;
  
  /**
   * Whether the row is selected
   * @default false
   */
  isSelected?: boolean;
  
  /**
   * Whether the row is expanded
   * @default false
   */
  isExpanded?: boolean;
  
  /**
   * Whether the row is clickable
   * @default false
   */
  clickable?: boolean;
  
  /**
   * Whether the row should highlight on hover
   * @default true
   */
  highlightOnHover?: boolean;
  
  /**
   * Index of the row in the dataset
   */
  rowIndex?: number;
  
  /**
   * Row click handler
   */
  onClick?: (rowData: T, index: number, event: React.MouseEvent<HTMLTableRowElement>) => void;
  
  /**
   * Double click handler
   */
  onDoubleClick?: (rowData: T, index: number, event: React.MouseEvent<HTMLTableRowElement>) => void;
  
  /**
   * Animation enabled
   * @default true
   */
  animate?: boolean;
  
  /**
   * Animation delay (in milliseconds) for staggered entrance
   * @default 0
   */
  animationDelay?: number;
  
  /**
   * Whether this row was just updated
   * @default false
   */
  isUpdated?: boolean;
  
  /**
   * Children elements
   */
  children?: React.ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * TableRow component - Enhanced table row with animations and selection states
 */
export const TableRow = <T extends BaseTableData = BaseTableData>({
  children,
  rowData,
  isSelected = false,
  isExpanded = false,
  clickable = false,
  highlightOnHover = true,
  rowIndex = -1,
  onClick,
  onDoubleClick,
  animate = true,
  animationDelay = 0,
  isUpdated = false,
  className,
  ...props
}: TableRowProps<T> & (HTMLTableRowProps | MotionTableRowProps)) => {
  const wasSelected = useRef(isSelected);
  const rowRef = useRef<HTMLTableRowElement>(null);
  
  // Track selection changes for highlight effect
  useEffect(() => {
    if (isSelected !== wasSelected.current && isSelected && rowRef.current) {
      wasSelected.current = isSelected;
    }
  }, [isSelected]);
  
  // Animation variants
  const rowVariants = {
    hidden: { 
      opacity: 0, 
      y: -10 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: 'spring',
        stiffness: 500, 
        damping: 30,
        mass: 1,
        delay: animationDelay * 0.05, // Staggered effect
      }
    },
    updated: {
      backgroundColor: ['rgba(59, 130, 246, 0.1)', 'transparent'],
      transition: { duration: 1.5, ease: 'easeOut' }
    }
  };

  // Event handlers
  const handleClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
    if (clickable && rowData && rowIndex >= 0) {
      onClick?.(rowData, rowIndex, e);
    }
  };
  
  const handleDoubleClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
    if (rowData && rowIndex >= 0) {
      onDoubleClick?.(rowData, rowIndex, e);
    }
  };
  
  // Common props for both regular and motion tr elements
  const commonProps = {
    ref: rowRef,
    className: cn(
      'rpt-row',
      highlightOnHover && 'rpt-row-hoverable',
      clickable && 'rpt-row-clickable',
      isSelected && 'rpt-row-selected',
      isExpanded && 'rpt-expand-row',
      isUpdated && 'rpt-row-updated',
      className
    ),
    onClick: onClick ? handleClick : undefined,
    onDoubleClick: onDoubleClick ? handleDoubleClick : undefined,
  };
  
  // For performance reasons, only apply motion component if animations are enabled
  if (!animate) {
    return (
      <tr
        {...commonProps}
        {...(props as HTMLTableRowProps)}
      >
        {children}
      </tr>
    );
  }
  
  return (
    <motion.tr
      {...commonProps}
      initial="hidden"
      animate={isUpdated ? "updated" : "visible"}
      variants={rowVariants}
      layoutId={rowData?.id ? `row-${rowData.id}` : undefined}
      {...(props as MotionTableRowProps)}
    >
      {children}
    </motion.tr>
  );
};

export default TableRow;