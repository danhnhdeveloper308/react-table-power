import React, { useState, useMemo } from 'react';
import { DataTable, DataTableProvider } from 'react-table-power';
import 'react-table-power/styles';

// Enhanced sample data with more realistic information
const generateSampleData = (count: number) => {
  const statuses = ['active', 'inactive', 'pending', 'suspended'];
  const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'];
  const roles = ['Manager', 'Senior', 'Junior', 'Lead', 'Director', 'VP'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@company.com`,
    age: Math.floor(Math.random() * 40) + 22,
    department: departments[Math.floor(Math.random() * departments.length)],
    role: roles[Math.floor(Math.random() * roles.length)],
    salary: Math.floor(Math.random() * 150000) + 50000,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    joinDate: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 365 * 5),
    lastActive: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30),
    projects: Math.floor(Math.random() * 10) + 1,
    performance: Math.floor(Math.random() * 5) + 1,
  }));
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors = {
    active: 'bg-green-100 text-green-800 border-green-200',
    inactive: 'bg-gray-100 text-gray-800 border-gray-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    suspended: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[status as keyof typeof colors] || colors.inactive}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const PerformanceStars = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-sm text-gray-600">{rating}/5</span>
    </div>
  );
};

export default function AdvancedDemo() {
  const [dataSize, setDataSize] = useState(1000);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  
  const data = useMemo(() => generateSampleData(dataSize), [dataSize]);

  const columns = [
    {
      accessorKey: 'id',
      header: 'ID',
      sortable: true,
      width: 80,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      sortable: true,
      cell: ({ row }: any) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
            {row.name.charAt(0)}
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.name}</div>
            <div className="text-sm text-gray-500">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'department',
      header: 'Department',
      sortable: true,
      filterable: true,
    },
    {
      accessorKey: 'role',
      header: 'Role',
      sortable: true,
      filterable: true,
    },
    {
      accessorKey: 'salary',
      header: 'Salary',
      sortable: true,
      cell: ({ row }: any) => (
        <span className="font-medium">
          ${row.salary.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      sortable: true,
      filterable: true,
      cell: ({ row }: any) => <StatusBadge status={row.status} />,
    },
    {
      accessorKey: 'performance',
      header: 'Performance',
      sortable: true,
      cell: ({ row }: any) => <PerformanceStars rating={row.performance} />,
    },
    {
      accessorKey: 'joinDate',
      header: 'Join Date',
      sortable: true,
      cell: ({ row }: any) => (
        <span className="text-sm text-gray-600">
          {row.joinDate.toLocaleDateString()}
        </span>
      ),
    },
    {
      accessorKey: 'projects',
      header: 'Projects',
      sortable: true,
      cell: ({ row }: any) => (
        <div className="text-center">
          <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
            {row.projects}
          </span>
        </div>
      ),
    },
  ];

  const filterConfig = [
    {
      key: 'department',
      label: 'Department',
      type: 'select' as const,
      options: [
        { label: 'Engineering', value: 'Engineering' },
        { label: 'Marketing', value: 'Marketing' },
        { label: 'Sales', value: 'Sales' },
        { label: 'HR', value: 'HR' },
        { label: 'Finance', value: 'Finance' },
        { label: 'Operations', value: 'Operations' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Pending', value: 'pending' },
        { label: 'Suspended', value: 'suspended' },
      ],
    },
    {
      key: 'salary',
      label: 'Salary Range',
      type: 'range' as const,
      min: 50000,
      max: 200000,
    },
  ];

  const handleCreate = async (formData: any) => {
    console.log('Creating user:', formData);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  };

  const handleUpdate = async (id: number, formData: any) => {
    console.log('Updating user:', id, formData);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  };

  const handleDelete = async (id: number) => {
    console.log('Deleting user:', id);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  };

  const handleBulkDelete = async (selectedRows: any[]) => {
    console.log('Bulk deleting users:', selectedRows.map(r => r.id));
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  };

  return (
    <DataTableProvider
      config={{
        theme: {
          theme,
          variant: 'modern',
          colorScheme: 'primary',
        },
        size: 'medium',
        striped: true,
        hover: true,
        bordered: false,
        sticky: true,
        animate: true,
        persistSettings: true,
      }}
    >
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            React Table Power - Advanced Demo
          </h1>
          <p className="text-gray-600">
            Showcasing advanced features: virtualization, filtering, CRUD operations, and more.
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <label htmlFor="dataSize" className="text-sm font-medium text-gray-700">
              Dataset Size:
            </label>
            <select
              id="dataSize"
              value={dataSize}
              onChange={(e) => setDataSize(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value={100}>100 rows</option>
              <option value={1000}>1,000 rows</option>
              <option value={10000}>10,000 rows</option>
              <option value={50000}>50,000 rows</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="theme" className="text-sm font-medium text-gray-700">
              Theme:
            </label>
            <select
              id="theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>

        {/* Advanced DataTable */}
        <DataTable
          data={data}
          columns={columns}
          title="Employee Management System"
          description={`Managing ${data.length.toLocaleString()} employees with advanced table features`}
          
          // Virtualization for large datasets
          virtualization={{
            enabled: dataSize >= 1000,
            itemHeight: 64,
            overscan: 10,
          }}
          
          // Pagination
          pagination={{
            pageSize: 50,
            pageSizeOptions: [25, 50, 100, 200],
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: true,
          }}
          
          // Selection
          selection={{
            enabled: true,
            type: 'checkbox',
            preserveSelectedRowsOnPageChange: true,
          }}
          
          // Filtering
          filters={filterConfig}
          filteringOptions={{
            advancedFiltering: true,
            allowFilterPresets: true,
            allowComplexFilters: true,
            persistFilters: true,
          }}
          
          // Global search
          globalSearch={{
            enabled: true,
            placeholder: 'Search employees...',
            debounceMs: 300,
          }}
          
          // CRUD operations
          builtInActions={{
            create: true,
            edit: true,
            delete: true,
            view: true,
          }}
          
          eventHandlers={{
            onCreate: handleCreate,
            onUpdate: handleUpdate,
            onDelete: handleDelete,
          }}
          
          // Bulk actions
          bulkActions={[
            {
              key: 'bulk-delete',
              label: 'Delete Selected',
              icon: <span>🗑️</span>,
              variant: 'destructive',
              onClick: handleBulkDelete,
            },
            {
              key: 'bulk-export',
              label: 'Export Selected',
              icon: <span>📊</span>,
              variant: 'outline',
              onClick: (selectedRows) => {
                console.log('Exporting selected:', selectedRows);
              },
            },
          ]}
          
          // Export
          export={{
            enabled: true,
            formats: ['csv', 'excel', 'pdf'],
            filename: 'employees-export',
          }}
          
          // Row expansion
          rowExpansion={{
            enabled: true,
            expandedRowRender: (record) => (
              <div className="p-4 bg-gray-50">
                <h4 className="font-semibold mb-2">Employee Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Last Active:</span>{' '}
                    {record.lastActive.toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Projects:</span>{' '}
                    {record.projects}
                  </div>
                  <div>
                    <span className="font-medium">Performance:</span>{' '}
                    {record.performance}/5
                  </div>
                  <div>
                    <span className="font-medium">Salary:</span>{' '}
                    ${record.salary.toLocaleString()}
                  </div>
                </div>
              </div>
            ),
          }}
          
          // Additional features
          striped
          hover
          responsive
          accessible
          className="shadow-lg rounded-lg"
        />
      </div>
    </DataTableProvider>
  );
}
