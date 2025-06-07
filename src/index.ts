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

// Export components
export { default as DataTable } from './components/DataTable';
export { default as TableContainer } from './components/table/TableContainer';
export { default as TableToolbar } from './components/table/TableToolbar';
export { default as TablePagination } from './components/table/TablePagination';
export { default as LoadingState } from './components/LoadingState';
export { default as TableDialog } from './components/TableDialog';
export { AppendableDialog } from './components/AppendableDialog';
export { default as ThemeProvider } from './components/ThemeProvider';
export { default as EmptyState } from './components/EmptyState';
export { default as ErrorState } from './components/ErrorState';
export { default as LoadingSpinner } from './components/LoadingSpinner';

// Export new modular table components
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
} from './components/table';

// Export icons
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
export { useTableDialog } from './hooks/useTableDialog';
export { useTableExport } from './hooks/useTableExport';
export { useTableSettings, type TableSettings } from './hooks/useTableSettings';
export { useSafeTableSettings } from './hooks/useSafeTableSettings';
export { useColumnVisibility } from './hooks/useColumnVisibility';
export { useTableFilter } from './hooks/useTableFilter';
export { useDataTable } from './hooks/useDataTable';
export { useAnimationPreference } from './hooks/useAnimationPreference';

// Export form handling context
export {
  FormHandlingProvider,
  useFormHandling,
  withFormHandling,
  useReactHookFormAdapter,
  useFormikAdapter,
  useFinalFormAdapter
} from './contexts/FormHandlingContext';

// Export DataTableProvider and related hooks
export {
  DataTableProvider,
  useDataTableConfig,
  withDataTableConfig,
  type DataTableProviderConfig
} from './contexts/DataTableConfigContext';

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
export * from './types';

// Export CSS injection function for manual control
export { injectCSS };