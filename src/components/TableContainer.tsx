import React from 'react';
import { cn } from '../utils/cn';
import { useTheme } from './ThemeProvider';

interface TableContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function TableContainer({ children, className }: TableContainerProps) {
  const { theme, colorScheme, variant, borderRadius } = useTheme();
  
  // Generate classes based on theme settings
  const themeClasses = [
    `rpt-table-container`,
    variant !== 'default' ? `rpt-table-variant-${variant}` : '',
    colorScheme !== 'default' ? `rpt-variant-${colorScheme}` : '',
    `rpt-radius-${borderRadius || 'md'}`
  ].filter(Boolean);
  
  return (
    <div className={cn(themeClasses, className)}>
      {children}
    </div>
  );
}

export default TableContainer;