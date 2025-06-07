import React, { createContext, useContext, useMemo } from 'react';
import { 
  TableThemeConfig,
  TableSize,
  LoadingVariant,
  BaseTableData,
  DialogConfig,
  SpinnerType,
  SpinnerSize
} from '../types';

/**
 * Configuration options for DataTable that can be set at the provider level
 */
export interface DataTableProviderConfig {
  /**
   * Default table size
   */
  size?: TableSize;

  /**
   * Default theme configuration
   */
  theme?: TableThemeConfig;

  /**
   * Default pagination configuration
   */
  pagination?: {
    showSizeChanger?: boolean;
    showQuickJumper?: boolean;
    showTotal?: boolean;
    pageSizeOptions?: number[];
  } | boolean;

  /**
   * Whether striped rows are enabled by default
   */
  striped?: boolean;

  /**
   * Whether bordered cells are enabled by default
   */
  bordered?: boolean;

  /**
   * Whether hover highlight is enabled by default
   */
  hover?: boolean;

  /**
   * Whether sticky headers are enabled by default
   */
  sticky?: boolean;

  /**
   * Whether to enable row animations by default
   */
  animate?: boolean;

  /**
   * Default dialog configuration
   */
  dialog?: DialogConfig;

  /**
   * Default loading configuration
   */
  loading?: {
    variant?: LoadingVariant;
    spinnerType?: SpinnerType;
    spinnerSize?: SpinnerSize;

    text?: string;
    skeletonRows?: number;
    skeletonColumns?: number;
  };

  /**
   * Default labels and translations
   */
  labels?: {
    search?: string;
    filter?: string;
    noResults?: string;
    loading?: string;
    error?: string;
    rowsPerPage?: string;
    create?: string;
    edit?: string;
    delete?: string;
    view?: string;
    actions?: string;
    save?: string;
    cancel?: string;
    confirm?: string;
    selectAll?: string;
    deselectAll?: string;
    export?: string;
  };

  /**
   * Default date format for date columns
   */
  dateFormat?: string;

  /**
   * Default number format for numeric columns
   */
  numberFormat?: string;

  /**
   * Whether to persist table settings by default
   */
  persistSettings?: boolean | {
    persistKey?: string;
    useUrlAsKey?: boolean;
    tableIdentifier?: string;
  };

  /**
   * Default animation settings
   */
  animations?: {
    enabled?: boolean;
    rowEnter?: Record<string, any>;
    rowExit?: Record<string, any>;
    duration?: number;
  };

  /**
   * Default filter configurations
   */
  filterDefaults?: {
    debounceMs?: number;
    advancedFiltering?: boolean;
    allowPresets?: boolean;
    allowComplexFilters?: boolean;
    persistFilters?: boolean;
  };

  emptyState?: {
    title?: string;
    message?: string;
    action?: React.ReactNode;
  };
}

// Create context with undefined default value
const DataTableConfigContext = createContext<DataTableProviderConfig | undefined>(undefined);

/**
 * Provider component for setting default DataTable configurations
 */
export const DataTableProvider: React.FC<{
  config: DataTableProviderConfig;
  children: React.ReactNode;
}> = ({ config, children }) => {
  // Memoize the config to prevent unnecessary re-renders
  const memoizedConfig = useMemo(() => config, [config]);

  return (
    <DataTableConfigContext.Provider value={memoizedConfig}>
      {children}
    </DataTableConfigContext.Provider>
  );
};

/**
 * Hook to access DataTable configuration from context
 * Safe to use in both client and server components
 */
export const useDataTableConfig = (): DataTableProviderConfig => {
  // Use optional chaining to safely access context
  // This will return an empty object if used outside provider
  // which is safe for both server and client components
  const context = useContext(DataTableConfigContext);
  return context || {};
};

/**
 * Higher-order component that merges provider config with component props
 * Works with both client and server components
 */
export function withDataTableConfig<T extends BaseTableData, P extends Record<string, any>>(
  Component: React.ComponentType<P>
): React.FC<P> {
  const WithConfig: React.FC<P> = (props) => {
    return <Component {...props} />;
  };

  WithConfig.displayName = `WithDataTableConfig(${
    Component.displayName || Component.name || 'Component'
  })`;

  return WithConfig;
}

interface DataTableConfigProps {
  size?: TableSize;
  striped?: boolean;
  bordered?: boolean;
  hover?: boolean;
  sticky?: boolean;
  animations?: {
    enabled?: boolean;
    level?: 'small' | 'medium' | 'large';
  };
  pagination?: {
    showSizeChanger?: boolean;
    showQuickJumper?: boolean;
    showTotal?: boolean;
    pageSizeOptions?: number[];
  } | boolean;
  theme?: {
    theme?: string;
    variant?: string;
    colorScheme?: string;
    borderRadius?: string;
  };
  
  /**
   * Empty state configuration
   */
  emptyState?: {
    title?: string;
    message?: string;
    action?: React.ReactNode;
  };
  
  /**
   * Loading configuration
   */
  loading?: {
    variant?: LoadingVariant;
    spinnerType?: SpinnerType;
    spinnerSize?: SpinnerSize;
    text?: string;
    skeletonRows?: number;
    skeletonColumns?: number;
  };
  filterDefaults?: {
    advancedFiltering?: boolean;
    allowPresets?: boolean;
    allowComplexFilters?: boolean;
    persistFilters?: boolean;
  };
  dateFormat?: string;
  numberFormat?: string;
  persistSettings?: boolean | {
    persistKey?: string;
    useUrlAsKey?: boolean;
    tableIdentifier?: string;
  };
}

const DefaultConfig: DataTableConfigProps = {
  size: 'medium',
  striped: false,
  bordered: false,
  hover: true,
  sticky: false,
  animations: {
    enabled: true,
    level: 'medium'
  },
  pagination: true,
  theme: {
    theme: 'system',
    variant: 'default',
    colorScheme: 'default',
    borderRadius: 'md'
  },
  emptyState: {
    title: 'No data found',
    message: 'No data matches your search criteria.'
  },
  loading: {
    variant: 'overlay',
    spinnerType: 'spinner',
    spinnerSize: 'md',
    text: 'Loading...',
    skeletonRows: 5,
    skeletonColumns: 5
  },
  filterDefaults: {
    advancedFiltering: false,
    allowPresets: false,
    allowComplexFilters: false,
    persistFilters: false
  }
};
