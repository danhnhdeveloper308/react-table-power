import { useColumnVisibility } from './hooks/useColumnVisibility';
// CSS Auto-injection for React Power Table
let cssInjected = false;

const injectCSS = () => {
  if (typeof document === 'undefined' || cssInjected) return;
  
  // Check if CSS is already injected
  if (document.getElementById('react-power-table-styles')) {
    cssInjected = true;
    return;
  }
  
  try {
    const style = document.createElement('style');
    style.id = 'react-power-table-styles';
    style.setAttribute('data-power-table-version', '1.0.0');
    
    // This content will be replaced by build script during post-build process
    const cssContent = '/* CSS will be injected during build */';
    
    style.textContent = cssContent;
    
    // Insert at the beginning of head for proper CSS precedence
    if (document.head) {
      if (document.head.firstChild) {
        document.head.insertBefore(style, document.head.firstChild);
      } else {
        document.head.appendChild(style);
      }
    }
    
    cssInjected = true;
  } catch (error) {
    console.warn('[react-power-table] Could not auto-inject CSS:', error);
  }
};

// Auto-inject CSS when this module is imported
if (typeof window !== 'undefined') {
  // Immediate injection if DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectCSS);
  } else {
    injectCSS();
  }
}

// CSS imports are now handled by the separate styles.ts entry point
// If you need styles, import from 'react-power-table/styles'

// Export original components
export { DataTable } from './components/DataTable';
export { TableToolbar } from './components/table/TableToolbar';
export { TablePagination } from './components/table/TablePagination';
export { ColumnVisibilityToggle } from './components/table/ColumnVisibilityToggle';
export { TableDialog } from './components/TableDialog';
export { TableRowActions } from './components/table/TableRowActions';
export { EmptyState } from './components/EmptyState';
export { ErrorState } from './components/ErrorState';
export { LoadingSpinner } from './components/LoadingSpinner';

// Export new modular table components
export { 
  Table,
  TableHead,
  TableBody,
  TableFooter,
  TableRow,
  TableCell,
  TablePagination as TablePaginationModern,
  TableRowMemo,
  TableHeaderRow,
  TableHeadCell,
  TableContainer,
  TableEmpty,
  TableFilter
} from './components/table';

export {
  Settings,
  EyeOff,
  SortIcon,
  SortAsc,
  SortDesc,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Refresh,
  Download,
  MoreVertical,
  MoreHorizontal,
  Columns,
  Edit,
  Trash,
  Eye,
  Check,
  Plus
} from './icons';

// Export hooks
export { 
  useDataTable,
  useTableExport,
  useTableFilter,
  useTableSorting,
  useTablePagination,
  useTableGlobalSearch,
  useTableDialog,
  useColumnVisibility,
  useTableRowExpansion,
  useTableSelection,
  useAnimationPreference
} from './hooks';

// Export theme utilities
export {
  setCssVariables,
  applyDarkTheme,
  applyLightTheme,
  createTheme,
  applyCustomTheme,
  isDarkMode,
  applyThemeBasedOnColorScheme
} from './utils/theme';
export type { ThemeVariables } from './utils/theme';

// Export types
export type {
  BaseTableData,
  TableColumn,
  DataTableProps,
  TableProps,
  TableDialogProps,
  UseDataTableOptions,
  UseDataTableReturn,
  SortConfig, 
  SortDirection,
  FilterConfig,
  GlobalSearchConfig,
  PaginationConfig,
  SelectionConfig,
  ActionConfig,
  BuiltInActionsConfig,
  TableSize,
  ExportFormat, 
  ExportConfig,
  ButtonVariant,
  DialogType,
  ServerDataConfig,
  RowExpansionConfig,
  BulkActionConfig,
  DialogConfig,
  TableThemeConfig,
} from './types';

// Export CSS injection function for manual control
export { injectCSS };