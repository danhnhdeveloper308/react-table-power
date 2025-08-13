import { useState } from 'react'
import { DataTable } from 'react-table-power'
import 'react-table-power/styles.ts'

interface User {
  id: number
  name: string
  email: string
  age: number
  city: string
  status: 'active' | 'inactive' | 'pending'
  joinDate: string
}

const sampleData: User[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', age: 28, city: 'New York', status: 'active', joinDate: '2023-01-15' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 34, city: 'Los Angeles', status: 'active', joinDate: '2023-02-20' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 42, city: 'Chicago', status: 'inactive', joinDate: '2023-03-10' },
  { id: 4, name: 'Alice Brown', email: 'alice@example.com', age: 29, city: 'Houston', status: 'pending', joinDate: '2023-04-05' },
  { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', age: 35, city: 'Phoenix', status: 'active', joinDate: '2023-05-12' },
  { id: 6, name: 'Diana Davis', email: 'diana@example.com', age: 31, city: 'Philadelphia', status: 'active', joinDate: '2023-06-18' },
  { id: 7, name: 'Edward Miller', email: 'edward@example.com', age: 27, city: 'San Antonio', status: 'inactive', joinDate: '2023-07-22' },
  { id: 8, name: 'Fiona Garcia', email: 'fiona@example.com', age: 33, city: 'San Diego', status: 'pending', joinDate: '2023-08-08' },
]

const columns = [
  { accessorKey: 'id', header: 'ID', sortable: true },
  { accessorKey: 'name', header: 'Name', sortable: true },
  { accessorKey: 'email', header: 'Email', sortable: true },
  { accessorKey: 'age', header: 'Age', sortable: true },
  { accessorKey: 'city', header: 'City', sortable: true },
  { 
    accessorKey: 'status', 
    header: 'Status', 
    sortable: true,
    cell: ({ row }: any) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        row.original.status === 'active' ? 'bg-green-100 text-green-800' :
        row.original.status === 'inactive' ? 'bg-red-100 text-red-800' :
        'bg-yellow-100 text-yellow-800'
      }`}>
        {row.original.status}
      </span>
    )
  },
  { accessorKey: 'joinDate', header: 'Join Date', sortable: true },
]

function App() {
  const [tableData, setTableData] = useState<User[]>(sampleData)

  const handleDelete = (id: number) => {
    setTableData(prev => prev.filter(item => item.id !== id))
  }

  const handleEdit = (formData: Partial<User>, id: number) => {
    setTableData(prev => 
      prev.map(item => item.id === id ? { ...item, ...formData } : item)
    )
  }

  const handleCreate = (formData: Omit<User, 'id'>) => {
    const newId = Math.max(...tableData.map(item => item.id)) + 1
    setTableData(prev => [...prev, { id: newId, ...formData }])
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>
          React Table Power - Demo
        </h1>
        
        <DataTable
          data={tableData}
          columns={columns}
          title="User Management"
          description="Manage users with full CRUD operations"
          pagination={true}
          globalSearch={true}
          striped
          hover
          selection={{
            enabled: true,
            type: 'checkbox',
          }}
          actions={[
            {
              key: 'edit',
              label: 'Edit',
              onClick: (row: User) => {
                console.log('Edit row:', row)
              },
              variant: 'outline',
            },
            {
              key: 'delete',
              label: 'Delete',
              onClick: (row: User) => {
                handleDelete(row.id)
              },
              variant: 'destructive',
            },
          ]}
          bulkActions={[
            {
              key: 'delete',
              label: 'Delete Selected',
              onClick: (selectedRows: User[], selectedKeys: string[]) => {
                selectedKeys.forEach(key => {
                  const id = parseInt(key)
                  handleDelete(id)
                })
              },
              variant: 'destructive',
            },
          ]}
          export={{
            enabled: true,
            formats: ['csv', 'excel', 'pdf'],
            fileName: 'users-export',
          }}
          eventHandlers={{
            onCreate: handleCreate,
            onUpdate: handleEdit,
            onDelete: handleDelete,
          }}
        />
      </div>
    </div>
  )
}

export default App
