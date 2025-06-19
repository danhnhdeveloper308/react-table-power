// This file serves as a dedicated entry point for importing all styles
// Import all CSS files
import './styles/index.css';
import './styles/actions.css';
import './styles/toolbar.css';
import './styles/pagination.css';
import './styles/button.css';
import './styles/table.css';
import './styles/form-components.css';
import './styles/theme.css';
import './styles/dialog.css'; // Đảm bảo dialog.css được import đúng cách
import './styles/column-visibility.css';
import "./styles/checkbox.css";
import "./styles/loading.css";
import "./styles/settings.css";
import "./styles/features.css";
import "./styles/advanced-filter-panel.css";
import "./styles/scrollbar.css";

// No exports - this file is meant to be used only for importing styles
import { CSSProperties } from 'react';
import { TableSize } from './types';

export interface StyleOptions {
  size?: TableSize;
  variant?: string;
  colorScheme?: string;
  borderRadius?: string;
}

export type StyleGenerator = (options?: StyleOptions) => CSSProperties;

// Helper to generate size-based styles
export const getSizeStyles = (size?: TableSize): CSSProperties => {
  switch (size) {
    case 'small':
      return {
        fontSize: '0.875rem',
        padding: '0.375rem 0.75rem',
        lineHeight: '1.25rem',
      };
    case 'large':
      return {
        fontSize: '1.125rem',
        padding: '0.75rem 1.5rem',
        lineHeight: '1.75rem',
      };
    case 'medium':
    default:
      return {
        fontSize: '1rem',
        padding: '0.5rem 1rem',
        lineHeight: '1.5rem',
      };
  }
};

// Table cell styles based on size
export const getTableCellStyles = (size?: TableSize): CSSProperties => {
  switch (size) {
    case 'small':
      return {
        padding: '0.375rem 0.75rem',
        fontSize: '0.875rem',
      };
    case 'large':
      return {
        padding: '0.75rem 1.5rem',
        fontSize: '1.125rem',
      };
    case 'medium':
    default:
      return {
        padding: '0.5rem 1rem',
        fontSize: '1rem',
      };
  }
};

// Button styles based on variant and size
export const getButtonStyles = (
  variant = 'default',
  size?: TableSize,
  elevated = false
): CSSProperties => {
  const sizeStyles = getSizeStyles(size);
  
  const baseStyles: CSSProperties = {
    ...sizeStyles,
    borderRadius: '0.25rem',
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  };
  
  const elevatedStyles: CSSProperties = elevated ? {
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  } : {};
  
  switch (variant) {
    case 'primary':
      return {
        ...baseStyles,
        ...elevatedStyles,
        backgroundColor: 'var(--rpt-primary-color, #2563eb)',
        color: 'var(--rpt-primary-text, white)',
        border: '1px solid var(--rpt-primary-border, #2563eb)',
      };
    case 'destructive':
      return {
        ...baseStyles,
        ...elevatedStyles,
        backgroundColor: 'var(--rpt-destructive-color, #ef4444)',
        color: 'var(--rpt-destructive-text, white)',
        border: '1px solid var(--rpt-destructive-border, #ef4444)',
      };
    case 'outline':
      return {
        ...baseStyles,
        backgroundColor: 'transparent',
        color: 'var(--rpt-text-color, #374151)',
        border: '1px solid var(--rpt-border-color, #d1d5db)',
      };
    case 'ghost':
      return {
        ...baseStyles,
        backgroundColor: 'transparent',
        color: 'var(--rpt-text-color, #374151)',
        border: 'none',
      };
    case 'link':
      return {
        ...baseStyles,
        backgroundColor: 'transparent',
        color: 'var(--rpt-primary-color, #2563eb)',
        border: 'none',
        padding: '0',
        fontWeight: 'normal',
        textDecoration: 'underline',
      };
    case 'default':
    default:
      return {
        ...baseStyles,
        ...elevatedStyles,
        backgroundColor: 'var(--rpt-background-color, white)',
        color: 'var(--rpt-text-color, #374151)',
        border: '1px solid var(--rpt-border-color, #d1d5db)',
      };
  }
};

// Get form input styles based on size
export const getInputStyles = (size?: TableSize): CSSProperties => {
  const baseStyles: CSSProperties = {
    width: '100%',
    borderRadius: '0.25rem',
    border: '1px solid var(--rpt-border-color, #d1d5db)',
    backgroundColor: 'var(--rpt-input-bg, white)',
    color: 'var(--rpt-text-color, #374151)',
    transition: 'all 0.2s ease',
  };
  
  switch (size) {
    case 'small':
      return {
        ...baseStyles,
        padding: '0.375rem 0.75rem',
        fontSize: '0.875rem',
        lineHeight: '1.25rem',
      };
    case 'large':
      return {
        ...baseStyles,
        padding: '0.75rem 1.5rem',
        fontSize: '1.125rem',
        lineHeight: '1.75rem',
      };
    case 'medium':
    default:
      return {
        ...baseStyles,
        padding: '0.5rem 1rem',
        fontSize: '1rem',
        lineHeight: '1.5rem',
      };
  }
};

// Dialog styles
export const getDialogStyles = (width?: string | number): CSSProperties => {
  return {
    width: width ? `${width}px` : '550px',
    maxWidth: '95vw',
    borderRadius: '0.375rem',
    backgroundColor: 'var(--rpt-background-color, white)',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
  };
};