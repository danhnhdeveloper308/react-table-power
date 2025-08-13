# React Table Power

A powerful, modern, and highly customizable DataTable component library for React with TypeScript support. Built on top of [TanStack Table v8](https://tanstack.com/table/v8), designed for maximum flexibility, performance, and developer experience.

[![npm version](https://img.shields.io/npm/v/react-table-power.svg?style=flat-square)](https://www.npmjs.com/package/react-table-power)
[![npm downloads](https://img.shields.io/npm/dm/react-table-power.svg?style=flat-square)](https://www.npmjs.com/package/react-table-power)
[![license](https://img.shields.io/npm/l/react-table-power.svg?style=flat-square)](https://github.com/your-username/react-table-power/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

## ✨ Features

- 🚀 **High Performance**: Built with TanStack Table v8, React 18+, and modern optimization techniques
- ⚡️ **Virtualization**: Handle millions of rows with smooth scrolling using @tanstack/react-virtual
- 🎭 **Framework Agnostic**: Works with Next.js (App Router & Pages Router), Vite, CRA, Remix
- 🌐 **SSR Compatible**: Full server-side rendering support with hydration-safe components
- 💅 **Modern UI**: Beautiful, responsive design with Tailwind CSS and shadcn/ui components
- 🔍 **Advanced Filtering**: Complex filters, filter presets, and real-time search
- 📊 **Rich Export**: Export to CSV, Excel, PDF with full customization
- 📱 **Mobile First**: Fully responsive with touch-friendly interactions
- ♿ **Accessible**: WCAG 2.1 compliant with keyboard navigation and screen reader support
- 🌙 **Dark Mode**: Built-in theme system with light/dark mode support
- ⚙️ **TypeScript**: Full type safety with advanced TypeScript patterns
- 🔧 **Extensible**: Modular architecture with composable hooks and components
- 🎨 **Customizable**: Theme system, custom renderers, and flexible styling
- 📈 **Analytics Ready**: Built-in performance monitoring and metrics

## 📦 Installation

```bash
# With npm
npm install react-table-power @tanstack/react-table

# With yarn
yarn add react-table-power @tanstack/react-table

# With pnpm
pnpm add react-table-power @tanstack/react-table
```

### Optional Dependencies

Install based on the features you need:

```bash
# For form handling and validation
npm install react-hook-form zod

# For animations (already included but can be optimized)
npm install framer-motion

# For advanced data export (lazy-loaded by default)
npm install papaparse xlsx jspdf jspdf-autotable

# For virtualization with large datasets
npm install @tanstack/react-virtual
```

## 🚀 Quick Start

```tsx
import React from 'react';
import { DataTable } from 'react-table-power';
import 'react-table-power/css'; // Import the styles

// Sample data
const data = [
  { id: 1, name: 'John Doe', age: 28, city: 'New York', status: 'active' },
  { id: 2, name: 'Jane Smith', age: 34, city: 'Los Angeles', status: 'inactive' },
  { id: 3, name: 'Bob Johnson', age: 42, city: 'Chicago', status: 'pending' },
];

// Column definitions
const columns = [
  { accessorKey: 'id', header: 'ID', sortable: true },
  { accessorKey: 'name', header: 'Name', sortable: true },
  { accessorKey: 'age', header: 'Age', sortable: true },
  { 
    accessorKey: 'status', 
    header: 'Status',
    cell: ({ row }) => (
      <span className={`status-badge status-${row.status}`}>
        {row.status}
      </span>
    )
  },
];

function App() {
  return (
    <div className="container">
      <h1>Users Table</h1>
      <DataTable
        data={data}
        columns={columns}
        pagination={true}
        globalSearch={true}
        selection={{ enabled: true }}
        export={{ enabled: true }}
        striped
        hover
      />
    </div>
  );
}
```

## 🎯 Advanced Usage

### Virtualized Table for Large Datasets

```tsx
import { DataTable } from 'react-table-power';

function LargeDataTable() {
  const largeData = Array.from({ length: 100000 }, (_, i) => ({
    id: i,
    name: `User ${i}`,
    email: `user${i}@example.com`,
    createdAt: new Date(Date.now() - Math.random() * 10000000000),
  }));

  return (
    <DataTable
      data={largeData}
      columns={columns}
      virtualization={{
        enabled: true,
        itemHeight: 50,
        overscan: 10,
      }}
      pagination={false} // Disable pagination when using virtualization
      title="100k Users"
    />
  );
}
```

### Server-Side Operations

```tsx
import { DataTable } from 'react-table-power';

function ServerSideTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchData = async (params) => {
    setLoading(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const result = await response.json();
      setData(result.data);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DataTable
      data={data}
      columns={columns}
      loading={loading}
      total={total}
      serverPagination={true}
      serverSorting={true}
      serverFiltering={true}
      serverData={{
        onDataFetch: fetchData,
      }}
      pagination={{
        pageSize: 20,
        pageSizeOptions: [10, 20, 50, 100],
      }}
    />
  );
}
```

### Advanced Filtering with Presets

```tsx
import { DataTable } from 'react-table-power';

const filterConfig = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
      { label: 'Pending', value: 'pending' },
    ],
  },
  {
    key: 'dateRange',
    label: 'Created Date',
    type: 'dateRange',
  },
  {
    key: 'age',
    label: 'Age Range',
    type: 'range',
    min: 0,
    max: 100,
  },
];

function AdvancedFilterTable() {
  return (
    <DataTable
      data={data}
      columns={columns}
      filters={filterConfig}
      filteringOptions={{
        advancedFiltering: true,
        allowFilterPresets: true,
        allowComplexFilters: true,
        persistFilters: true,
      }}
      globalSearch={{
        enabled: true,
        placeholder: 'Search across all fields...',
        debounceMs: 300,
      }}
    />
  );
}
```

### CRUD Operations with Forms

```tsx
import { DataTable } from 'react-table-power';
import { UserForm } from './UserForm'; // Your custom form component

function CrudTable() {
  const [tableData, setTableData] = useState(data);

  const handleCreate = async (formData) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      const newUser = await response.json();
      setTableData(prev => [...prev, newUser]);
      return true;
    } catch (error) {
      console.error('Create failed:', error);
      return false;
    }
  };

  const handleUpdate = async (id, formData) => {
    try {
      await fetch(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      setTableData(prev => 
        prev.map(item => item.id === id ? { ...item, ...formData } : item)
      );
      return true;
    } catch (error) {
      console.error('Update failed:', error);
      return false;
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/users/${id}`, { method: 'DELETE' });
      setTableData(prev => prev.filter(item => item.id !== id));
      return true;
    } catch (error) {
      console.error('Delete failed:', error);
      return false;
    }
  };

  return (
    <DataTable
      data={tableData}
      columns={columns}
      builtInActions={{
        create: { formComponent: UserForm },
        edit: { formComponent: UserForm },
        delete: true,
        view: { formComponent: UserForm },
      }}
      eventHandlers={{
        onCreate: handleCreate,
        onUpdate: handleUpdate,
        onDelete: handleDelete,
      }}
      selection={{
        enabled: true,
        type: 'checkbox',
      }}
      bulkActions={[
        {
          key: 'bulk-delete',
          label: 'Delete Selected',
          variant: 'destructive',
          onClick: async (selectedRows) => {
            // Handle bulk delete
            console.log('Deleting:', selectedRows);
          },
        },
      ]}
    />
  );
}
```

### Custom Export Configuration

```tsx
import { DataTable, useAdvancedExport } from 'react-table-power';

function ExportableTable() {
  const { exportData } = useAdvancedExport();

  const customExport = async (format, selectedRows) => {
    await exportData(format, selectedRows, columns, {
      filename: `users-export-${new Date().toISOString().split('T')[0]}`,
      includeHeaders: true,
      dateFormat: 'yyyy-MM-dd',
      numberFormat: { minimumFractionDigits: 2 },
      booleanFormat: { true: 'Yes', false: 'No' },
      headerStyle: {
        backgroundColor: '#f3f4f6',
        fontWeight: 'bold',
        textAlign: 'center',
      },
      customHeaders: {
        id: 'User ID',
        name: 'Full Name',
        email: 'Email Address',
      },
    });
  };

  return (
    <DataTable
      data={data}
      columns={columns}
      export={{
        enabled: true,
        formats: ['csv', 'excel', 'pdf'],
        customExporter: customExport,
      }}
    />
  );
}
```

## 🎨 Theming and Customization

### Using the Theme Provider

```tsx
import { DataTableProvider } from 'react-table-power';

function App() {
  return (
    <DataTableProvider
      config={{
        theme: {
          theme: 'dark', // 'light' | 'dark' | 'system'
          variant: 'modern', // 'default' | 'modern' | 'minimal'
          colorScheme: 'primary', // 'default' | 'primary' | 'neutral'
        },
        size: 'medium',
        striped: true,
        hover: true,
        animations: { enabled: true },
        persistSettings: true,
      }}
    >
      <MyTableComponents />
    </DataTableProvider>
  );
}
```

### Custom CSS Variables

```css
:root {
  --rpt-primary: #2563eb;
  --rpt-primary-50: #eff6ff;
  --rpt-primary-100: #dbeafe;
  --rpt-success: #16a34a;
  --rpt-warning: #ca8a04;
  --rpt-danger: #dc2626;
  
  --rpt-border-radius: 0.5rem;
  --rpt-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  --rpt-transition-duration: 200ms;
}

/* Dark theme overrides */
[data-theme="dark"] {
  --rpt-bg-color: #1f2937;
  --rpt-text-color: #f9fafb;
  --rpt-border-color: #374151;
}
```

## 🔧 Framework Integration

### Next.js App Router

```tsx
// app/components/UserTable.tsx
'use client';

import { DataTable } from 'react-table-power/nextjs';
import 'react-table-power/css';

export default function UserTable({ users }) {
  return (
    <DataTable
      data={users}
      columns={columns}
      // ... other props
    />
  );
}
```

```tsx
// app/page.tsx
import { Suspense } from 'react';
import UserTable from './components/UserTable';
import { getUsersData } from './lib/data';

export default async function Page() {
  const users = await getUsersData();

  return (
    <div>
      <h1>Users Dashboard</h1>
      <Suspense fallback={<div>Loading table...</div>}>
        <UserTable users={users} />
      </Suspense>
    </div>
  );
}
```

### Vite Configuration

```js
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { withTablePowerOptimizations } from 'react-table-power/configs/vite';

export default withTablePowerOptimizations(
  defineConfig({
    plugins: [react()],
    // your existing config
  }),
  {
    optimizeCSS: true,
    treeshaking: true,
    hmr: true,
  }
);
```

### Next.js Configuration

```js
// next.config.js
const { withTablePowerOptimizations } = require('react-table-power/configs/nextjs');

module.exports = withTablePowerOptimizations(
  {
    // your existing Next.js config
  },
  {
    ssr: true,
    optimization: {
      splitChunks: true,
      treeshaking: true,
    },
  }
);
```

## 🔌 Using Hooks Directly

For maximum flexibility, use the composable hooks:

```tsx
import { 
  useDataTable, 
  useColumnVisibility, 
  useTableExport,
  useVirtualization 
} from 'react-table-power';

function CustomTable() {
  const {
    data: tableData,
    table,
    pagination,
    sorting,
    filters,
    selectedRows,
  } = useDataTable({
    data,
    columns,
    pagination: { pageSize: 10 },
  });

  const {
    columnVisibility,
    toggleColumnVisibility,
    visibleColumns,
  } = useColumnVisibility({ columns });

  const { exportData } = useTableExport({
    data: tableData,
    columns: visibleColumns,
  });

  const {
    virtualizer,
    isVirtualized,
    scrollToIndex,
  } = useVirtualization({
    data: tableData,
    containerRef,
    config: { enabled: data.length > 1000 },
  });

  // Build your custom UI using these hooks
  return (
    <div>
      {/* Your custom table implementation */}
    </div>
  );
}
```

## 📊 Performance Optimization

### Large Datasets

- **Virtualization**: Automatically enabled for datasets > 100 rows
- **Lazy Loading**: Heavy dependencies loaded on-demand
- **Memoization**: Smart re-rendering with React.memo and useMemo
- **Debounced Search**: Configurable debounce for real-time filtering

### Bundle Size Optimization

- **Tree Shaking**: Import only what you need
- **Code Splitting**: Separate chunks for heavy features
- **CSS Purging**: Unused styles automatically removed
- **Dynamic Imports**: Export libraries loaded asynchronously

```tsx
// Import only specific components
import { DataTable } from 'react-table-power';
import { useDataTable } from 'react-table-power/hooks';
import { CSVExporter } from 'react-table-power/exporters';
```

## 🧪 TypeScript Support

Full TypeScript support with advanced type patterns:

```tsx
import { DataTable, StrictTableData, TypedTableHook } from 'react-table-power';

// Define your data type
interface User extends StrictTableData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  createdAt: Date;
}

// Type-safe columns
const columns: TableColumn<User>[] = [
  {
    accessorKey: 'name', // Autocomplete and type checking
    header: 'Name',
    cell: ({ row }) => row.name, // row is typed as User
  },
  // ... more columns
];

// Type-safe table
function TypedUserTable({ users }: { users: User[] }) {
  return (
    <DataTable<User>
      data={users}
      columns={columns}
      eventHandlers={{
        onCreate: async (userData) => {
          // userData is typed as Partial<User>
          return true;
        },
        onUpdate: async (id, updates) => {
          // id is string, updates is Partial<User>
          return true;
        },
      }}
    />
  );
}
```

## 🎭 Component Architecture

React Table Power uses a modular architecture:

```
react-table-power/
├── components/          # UI Components
│   ├── DataTable.tsx   # Main table component
│   ├─�� table/          # Table building blocks
│   ├── form/           # Form components
│   └── ...
├── hooks/              # Composable hooks
│   ├── useDataTable.ts
│   ├── useVirtualization.ts
│   └── ...
├── utils/              # Utilities
│   ├── exportUtils.ts
│   ├── typeGuards.ts
│   └── ...
├── types/              # TypeScript types
├── styles/             # CSS styles
└── configs/            # Framework configs
```

## 📱 Mobile Support

React Table Power is mobile-first with:

- **Touch Gestures**: Swipe to scroll, tap to select
- **Responsive Design**: Adapts to all screen sizes
- **Accessible**: Works with screen readers and keyboard navigation
- **Performance**: Optimized for mobile devices

```tsx
<DataTable
  data={data}
  columns={columns}
  responsive={true}
  size="small" // Better for mobile
  striped={false} // Cleaner on mobile
  // Mobile-specific optimizations applied automatically
/>
```

## 🌐 Internationalization

```tsx
import { DataTableProvider } from 'react-table-power';

const i18nConfig = {
  search: 'Buscar',
  filter: 'Filtrar',
  noResults: 'Sin resultados',
  loading: 'Cargando...',
  rowsPerPage: 'Filas por página',
  // ... more translations
};

function App() {
  return (
    <DataTableProvider
      config={{
        labels: i18nConfig,
        dateFormat: 'dd/MM/yyyy',
        numberFormat: { locale: 'es-ES' },
      }}
    >
      <MyApp />
    </DataTableProvider>
  );
}
```

## 🔍 API Reference

### DataTable Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `T[]` | `[]` | Array of data objects |
| `columns` | `TableColumn<T>[]` | `[]` | Column definitions |
| `loading` | `boolean` | `false` | Loading state |
| `pagination` | `boolean \| PaginationConfig` | `true` | Pagination configuration |
| `selection` | `SelectionConfig` | `undefined` | Row selection settings |
| `virtualization` | `VirtualizationConfig` | `undefined` | Virtualization settings |
| `export` | `ExportConfig` | `undefined` | Export functionality |
| `theme` | `TableThemeConfig` | `undefined` | Theme configuration |

[View full API documentation →](https://react-table-power.dev/docs/api)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT © [Your Name](https://github.com/your-username)

## 🔗 Links

- [Documentation](https://react-table-power.dev)
- [Examples](https://react-table-power.dev/examples)
- [CodeSandbox Demo](https://codesandbox.io/s/react-table-power-demo)
- [GitHub](https://github.com/your-username/react-table-power)
- [npm](https://www.npmjs.com/package/react-table-power)

## 🙏 Acknowledgments

- [TanStack Table](https://tanstack.com/table) - The powerful table library that powers React Table Power
- [TanStack Virtual](https://tanstack.com/virtual) - Virtualization capabilities
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [Framer Motion](https://framer.com/motion) - Animation library
- [shadcn/ui](https://ui.shadcn.com) - Design system inspiration

---

**Made with ❤️ for the React community**
