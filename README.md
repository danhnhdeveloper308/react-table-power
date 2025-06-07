# React Table Power

A powerful, modern, and highly reusable DataTable component for React with TypeScript support.

[![npm version](https://img.shields.io/npm/v/react-datatable-kit.svg?style=flat-square)](https://www.npmjs.com/package/react-datatable-kit)
[![npm downloads](https://img.shields.io/npm/dm/react-datatable-kit.svg?style=flat-square)](https://www.npmjs.com/package/react-datatable-kit)
[![license](https://img.shields.io/npm/l/react-datatable-kit.svg?style=flat-square)](https://github.com/danhnhdeveloper308/react-datatable-kit/blob/main/LICENSE)

## Features

- 🚀 Built with [TanStack Table v8](https://tanstack.com/table/v8) (React Table)
- 🎭 Works with [React 18+](https://reactjs.org/)
- ⚡️ Supports both Next.js [App Router](https://nextjs.org/docs/app) & [Pages Router](https://nextjs.org/docs/pages)
- 🌐 CSR and SSR Compatible
- 💅 Customizable with CSS classes and modular design
- 🔍 Advanced filtering, sorting, and searching
- 📊 Export data to CSV, Excel, and PDF
- 📱 Fully responsive design
- ♿ Accessible (WCAG 2.1 compliant)
- 🌙 Dark mode support
- ⚙️ TypeScript support
- 👍 Zero configuration required for basic usage

## Installation

```bash
# With npm
npm install react-datatable-kit @tanstack/react-table

# With yarn
yarn add react-datatable-kit @tanstack/react-table

# With pnpm
pnpm add react-datatable-kit @tanstack/react-table
```

Optional dependencies based on your needs:

```bash
# For form handling
npm install react-hook-form zod

# For animations
npm install framer-motion

# For data export (only needed if you use export functionality)
npm install papaparse xlsx jspdf jspdf-autotable
```

## Basic Usage

```tsx
import React from 'react';
import { DataTable } from 'react-datatable-kit';
import 'react-datatable-kit/css'; // Import the styles

// Sample data
const data = [
  { id: 1, name: 'John Doe', age: 28, city: 'New York' },
  { id: 2, name: 'Jane Smith', age: 34, city: 'Los Angeles' },
  { id: 3, name: 'Bob Johnson', age: 42, city: 'Chicago' },
];

// Column definitions
const columns = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name', sortable: true },
  { accessorKey: 'age', header: 'Age', sortable: true },
  { accessorKey: 'city', header: 'City', sortable: true },
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
        striped
        hover
      />
    </div>
  );
}

export default App;
```

## Advanced Usage

### Server-side Pagination, Sorting and Filtering

```tsx
import React from 'react';
import { DataTable } from 'react-datatable-kit';
import 'react-datatable-kit/css';

function ServerSideTable() {
  return (
    <DataTable
      data={[]} // Initial data can be empty
      columns={columns}
      title="Users"
      description="User management table with server-side operations"
      serverPagination={true}
      serverSorting={true}
      serverFiltering={true}
      serverData={{
        endpoint: 'https://api.example.com/users',
        method: 'GET',
        fetchFn: fetch, // You can use your custom fetch function
        resultsKey: 'data',
        totalKey: 'total',
        // Additional configuration for API requests
        headers: {
          Authorization: 'Bearer your-token'
        },
      }}
      pagination={{
        pageSize: 10,
        pageSizeOptions: [5, 10, 20, 50],
        showSizeChanger: true,
      }}
    />
  );
}
```

### Row Selection and Bulk Actions

```tsx
import React from 'react';
import { DataTable } from 'react-datatable-kit';
import 'react-datatable-kit/css';

function SelectableTable() {
  const handleBulkDelete = (selectedRows, selectedKeys) => {
    console.log('Deleting:', selectedKeys);
    // Implement your deletion logic here
  };
  
  const handleBulkExport = (selectedRows, selectedKeys) => {
    console.log('Exporting:', selectedRows);
    // Implement your export logic here
  };

  return (
    <DataTable
      data={data}
      columns={columns}
      selection={{
        enabled: true,
        type: 'checkbox',
        preserveSelectedRowsOnPageChange: true,
      }}
      bulkActions={[
        {
          key: 'delete',
          label: 'Delete Selected',
          icon: <TrashIcon />,
          onClick: handleBulkDelete,
          variant: 'destructive',
        },
        {
          key: 'export',
          label: 'Export Selected',
          icon: <DownloadIcon />,
          onClick: handleBulkExport,
        },
      ]}
    />
  );
}
```

### Row Actions and CRUD Operations

```tsx
import React, { useState } from 'react';
import { DataTable } from 'react-datatable-kit';
import 'react-datatable-kit/css';

function CrudTable() {
  const [tableData, setTableData] = useState(data);
  
  const handleDelete = (id) => {
    setTableData(prev => prev.filter(item => item.id !== id));
  };
  
  const handleEdit = (formData, id) => {
    setTableData(prev => 
      prev.map(item => item.id === id ? { ...item, ...formData } : item)
    );
  };
  
  const handleCreate = (formData) => {
    const newId = Math.max(...tableData.map(item => item.id)) + 1;
    setTableData(prev => [...prev, { id: newId, ...formData }]);
  };

  return (
    <DataTable
      data={tableData}
      columns={columns}
      actions={[
        {
          key: 'edit',
          label: 'Edit',
          onClick: (row) => {
            // Open edit dialog or navigate to edit page
            console.log('Edit row:', row);
          },
          variant: 'outline',
        },
        {
          key: 'delete',
          label: 'Delete',
          onClick: (row) => {
            handleDelete(row.id);
          },
          variant: 'destructive',
        },
      ]}
      eventHandlers={{
        onCreate: handleCreate,
        onUpdate: handleEdit,
        onDelete: handleDelete,
      }}
    />
  );
}
```

### Advanced Filtering

```tsx
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
    key: 'amount',
    label: 'Amount',
    type: 'number',
  },
];

function FilterableTable() {
  return (
    <DataTable
      data={data}
      columns={columns}
      filters={filterConfig}
      globalSearch={{
        enabled: true,
        placeholder: 'Search all fields...',
        debounceTime: 300,
      }}
    />
  );
}
```

### Data Export

```tsx
function ExportableTable() {
  return (
    <DataTable
      data={data}
      columns={columns}
      export={{
        enabled: true,
        formats: ['csv', 'excel', 'pdf'],
        fileName: 'table-data-export',
      }}
    />
  );
}
```

### Custom Column Rendering

```tsx
const columns = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <div className="flex items-center">
        <img 
          src={row.original.avatar} 
          className="w-8 h-8 rounded-full mr-2" 
          alt={row.original.name} 
        />
        <span>{row.original.name}</span>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <div className={`badge badge-${row.original.status}`}>
        {row.original.status}
      </div>
    ),
  },
];
```

### Expandable Rows

```tsx
function ExpandableTable() {
  return (
    <DataTable
      data={data}
      columns={columns}
      rowExpansion={{
        enabled: true,
        expandedRowRender: (row) => (
          <div className="p-4">
            <h3>Details for {row.name}</h3>
            <pre>{JSON.stringify(row, null, 2)}</pre>
          </div>
        ),
      }}
    />
  );
}
```

### Using the DataTable Hooks

For more advanced use cases, you can use the hooks directly:

```tsx
import React from 'react';
import { useDataTable, useColumnVisibility, useTableExport } from 'react-datatable-kit';

function CustomTable() {
  const tableOptions = useDataTable({
    data,
    columns,
    pagination: {
      pageSize: 10,
    },
    sorting: [{ field: 'name', direction: 'asc' }],
  });
  
  const { 
    setPage, 
    setSort, 
    setGlobalFilter,
    selectedRowKeys,
    data: tableData 
  } = tableOptions;
  
  // Now you can build your own custom UI using these functions
  return (
    <div>
      <input 
        type="text" 
        placeholder="Search..." 
        onChange={(e) => setGlobalFilter(e.target.value)} 
      />
      
      <table>
        {/* Build your custom table UI */}
      </table>
    </div>
  );
}
```

## API Reference

### `DataTable` Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `Array<object>` | `[]` | Table data array |
| `columns` | `Array<TableColumn>` | `[]` | Column definitions |
| `tableId` | `string` | auto-generated | Unique identifier for the table, used for state persistence |
| `title` | `string` | `undefined` | Table title displayed in the toolbar |
| `description` | `string` | `undefined` | Table description displayed in the toolbar |
| `loading` | `boolean` | `false` | Loading state of the table |
| `loadingConfig` | `LoadingConfig` | `undefined` | Configure loading state appearance |
| `pagination` | `boolean \| PaginationConfig` | `true` | Enable pagination and its configuration |
| `total` | `number` | `undefined` | Total number of records (for server-side pagination) |
| `serverPagination` | `boolean` | `false` | Use server-side pagination |
| `selection` | `SelectionConfig` | `undefined` | Row selection configuration |
| `sorting` | `Array<SortConfig>` | `[]` | Default sorting configuration |
| `serverSorting` | `boolean` | `false` | Use server-side sorting |
| `filters` | `Array<FilterConfig>` | `[]` | Column filter configurations |
| `filterValues` | `Record<string, any>` | `undefined` | Initial filter values |
| `serverFiltering` | `boolean` | `false` | Use server-side filtering |
| `globalSearch` | `boolean \| GlobalSearchConfig` | `false` | Enable global search and its configuration |
| `actions` | `Array<ActionConfig>` | `[]` | Row action buttons configuration |
| `bulkActions` | `Array<BulkActionConfig>` | `[]` | Bulk actions configuration for selected rows |
| `export` | `boolean \| ExportConfig` | `false` | Enable data export and its configuration |
| `dialog` | `DialogConfig` | `undefined` | Configure dialog defaults for CRUD operations |
| `rowExpansion` | `RowExpansionConfig` | `undefined` | Configure expandable rows |
| `className` | `string` | `undefined` | Additional CSS class for the container |
| `tableClassName` | `string` | `undefined` | Additional CSS class for the table element |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size variant of the table |
| `striped` | `boolean` | `true` | Enable striped rows |
| `bordered` | `boolean` | `false` | Add borders to the table |
| `hover` | `boolean` | `true` | Add hover effect to rows |
| `resizable` | `boolean` | `false` | Make columns resizable |
| `columnReordering` | `boolean` | `false` | Allow dragging columns to reorder |
| `responsive` | `boolean` | `true` | Make the table responsive |
| `accessible` | `boolean` | `true` | Add ARIA attributes for accessibility |
| `ariaLabel` | `string` | `undefined` | ARIA label for the table |
| `ariaDescription` | `string` | `undefined` | ARIA description for the table |
| `emptyStateRenderer` | `() => React.ReactNode` | `undefined` | Custom renderer for empty state |
| `errorStateRenderer` | `(error: Error) => React.ReactNode` | `undefined` | Custom renderer for error state |
| `toolbarRenderer` | `(defaultToolbar: React.ReactNode) => React.ReactNode` | `undefined` | Custom renderer for toolbar |
| `eventHandlers` | `EventHandlersConfig` | `undefined` | Event handlers for various table events |
| `serverData` | `ServerDataConfig` | `undefined` | Configuration for server-side data fetching |

For more detailed documentation of all props and TypeScript interfaces, please visit our [full API documentation](https://react-datatable-kit.dev/docs/api).

## DataTableProvider

The `DataTableProvider` component allows you to set default configurations for all DataTable instances within its context. This is especially useful for maintaining consistent styling and behavior across your application.

### Basic Usage

```tsx
import { DataTable, DataTableProvider } from 'react-table-power';

function App() {
  return (
    <DataTableProvider config={{
      theme: {
        theme: 'system',
        variant: 'modern',
        colorScheme: 'primary',
      },
      size: 'medium',
      striped: true,
      hover: true,
      bordered: false,
      sticky: true,
      animate: true
    }}>
      <MyComponent />
    </DataTableProvider>
  );
}

// Inside MyComponent or any descendant component:
function MyComponent() {
  return (
    <DataTable
      data={data}
      columns={columns}
      // These props will override provider settings
      size="large"
      // Provider settings will be used for other props
    />
  );
}
```

### Available Configuration Options

The DataTableProvider accepts a `config` prop with the following options:

- `size`: Default size for all tables ('small', 'medium', 'large')
- `theme`: Default theme configuration object
- `striped`: Whether tables should have striped rows by default
- `bordered`: Whether tables should have borders by default
- `hover`: Whether tables should have hover effects by default
- `sticky`: Whether tables should have sticky headers by default
- `animate`: Whether tables should have animations by default
- `dialog`: Default dialog configuration
- `loading`: Default loading indicator configuration
- `labels`: Default text labels and translations
- `pagination`: Default pagination configuration
- `filterDefaults`: Default filtering options
- `dateFormat`: Default date format for date columns
- `numberFormat`: Default number format for numeric columns
- `persistSettings`: Whether to persist table settings by default
- `animations`: Default animation settings

### Server-Side Rendering (SSR) Support

The DataTableProvider is compatible with server-side rendering frameworks like Next.js. It safely handles hydration and does not cause hydration mismatches.

## Using the DataTableConfig hook

For advanced use cases, you can access the configuration directly in your components:

```tsx
import { useDataTableConfig } from 'react-table-power';

function MyCustomComponent() {
  const config = useDataTableConfig();
  
  return (
    <div>
      Current theme: {config.theme?.theme || 'default'}
    </div>
  );
}
```

## High-Order Component

You can also wrap your components with the `withDataTableConfig` HOC:

```tsx
import { withDataTableConfig } from 'react-table-power';

const MyComponentWithConfig = withDataTableConfig(MyComponent);
```