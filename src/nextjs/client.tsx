/**
 * Next.js Client Components for react-table-power
 * This file provides client-side only components for Next.js App Router
 */

'use client';

// Re-export all components as client components
export { default as DataTable } from '../components/DataTable';
export { default as TableContainer } from '../components/table/TableContainer';
export { default as TableToolbar } from '../components/table/TableToolbar';
export { default as TablePagination } from '../components/table/TablePagination';
export { default as LoadingState } from '../components/LoadingState';
export { default as TableDialog } from '../components/TableDialog';
export { AppendableDialog } from '../components/AppendableDialog';
export { default as ThemeProvider } from '../components/ThemeProvider';
export { default as EmptyState } from '../components/EmptyState';
export { default as ErrorState } from '../components/ErrorState';
export { default as LoadingSpinner } from '../components/LoadingSpinner';
export { default as AutoForm } from '../components/form/AutoForm';

// Re-export form handling utilities
export { 
  FormHandlingProvider, 
  useFormHandling,
  withFormHandling,
} from '../contexts/FormHandlingContext';

// Re-export all hooks
export * from '../hooks';

// Re-export all types
export * from '../types';

// Re-export DataTableProvider and related hooks
export {
  DataTableProvider,
  useDataTableConfig,
  withDataTableConfig,
  type DataTableProviderConfig
} from '../contexts/DataTableConfigContext';

// Re-export theme utilities
export {
  setCssVariables,
  applyDarkTheme,
  applyLightTheme,
  createTheme,
  applyCustomTheme,
  isDarkMode,
  applyThemeBasedOnColorScheme
} from '../utils/theme';

// Re-export form adapters
export { 
  type FormAdapter,
  createFormAdapter, 
  createReactHookFormAdapter, 
  createFormikAdapter, 
  createGenericFormAdapter 
} from '../utils/formAdapters';

// Re-export new dialog components
export { default as OptimizedDialog } from '../components/OptimizedDialog';
export { default as FormDialogManager } from '../components/FormDialogManager';
export { default as DialogLoadingState } from '../components/DialogLoadingState';

// Re-export modular table components
export { 
  Table,
  TableHead,
  TableBody,
  TableFooter,
  TableRow,
  TableCell,
  TableHeaderRow,
  TableHeadCell,
  TableEmpty,
  TableFilter,
  TableRowMemo
} from '../components/table';

// Re-export icons
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
} from '../icons';

// CSS auto-injection for client-side
import '../styles';
