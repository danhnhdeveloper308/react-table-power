import React, { useState } from 'react'
import { DataTable } from 'react-table-power'
import 'react-table-power/styles.ts'

// Simple form components for CRUD operations
const CreateUserForm = React.forwardRef<HTMLDivElement, { onSubmit: (data: any) => void; onCancel: () => void }>((props, ref) => {
  const { onSubmit, onCancel } = props;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    city: '',
    status: 'pending' as const,
    joinDate: new Date().toISOString().split('T')[0],
    department: '',
    bio: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      age: parseInt(formData.age) || 0,
      skills: []
    })
  }

  return (
    <div ref={ref}>
      <form onSubmit={handleSubmit} className="user-form">
        <div className="form-grid">
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Age</label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              min="18"
              max="120"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="form-input"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="form-group">
            <label>Department</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group full-width">
            <label>Join Date</label>
            <input
              type="date"
              value={formData.joinDate}
              onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group full-width">
            <label>Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="form-textarea"
              rows={3}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Create User
          </button>
        </div>
      </form>
    </div>
  )
})

const EditUserForm = React.forwardRef<HTMLDivElement, {
  user: User;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}>((props, ref) => {
  const { user, onSubmit, onCancel } = props;
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    age: user.age?.toString() || '',
    city: user.city || '',
    status: user.status || 'pending',
    joinDate: user.joinDate || '',
    department: user.department || '',
    bio: user.bio || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...user,
      ...formData,
      age: parseInt(formData.age) || 0
    })
  }

  return (
    <div ref={ref}>
      <form onSubmit={handleSubmit} className="user-form">
        <div className="form-grid">
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Age</label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              min="18"
              max="120"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="form-input"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="form-group">
            <label>Department</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group full-width">
            <label>Join Date</label>
            <input
              type="date"
              value={formData.joinDate}
              onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group full-width">
            <label>Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="form-textarea"
              rows={3}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Update User
          </button>
        </div>
      </form>
    </div>
  )
})

const ViewUserForm = React.forwardRef<HTMLDivElement, { user: User; onClose: () => void }>((props, ref) => {
  const { user, onClose } = props;
  return (
    <div ref={ref} className="user-view">
      <div className="view-grid">
        <div className="view-item">
          <label>Name</label>
          <p>{user.name}</p>
        </div>
        <div className="view-item">
          <label>Email</label>
          <p>{user.email}</p>
        </div>
        <div className="view-item">
          <label>Age</label>
          <p>{user.age} years old</p>
        </div>
        <div className="view-item">
          <label>City</label>
          <p>{user.city}</p>
        </div>
        <div className="view-item">
          <label>Status</label>
          <p>
            <span className={`status-badge ${user.status}`}>
              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
            </span>
          </p>
        </div>
        <div className="view-item">
          <label>Department</label>
          <p>{user.department || 'Not assigned'}</p>
        </div>
        <div className="view-item">
          <label>Join Date</label>
          <p>{user.joinDate ? new Date(user.joinDate).toLocaleDateString() : 'Not set'}</p>
        </div>
        {user.skills && user.skills.length > 0 && (
          <div className="view-item">
            <label>Skills</label>
            <div className="skills-list">
              {user.skills.map((skill, index) => (
                <span key={index} className="skill-tag">{skill}</span>
              ))}
            </div>
          </div>
        )}
        {user.bio && (
          <div className="view-item full-width">
            <label>Bio</label>
            <p>{user.bio}</p>
          </div>
        )}
      </div>
      <div className="form-actions">
        <button onClick={onClose} className="btn btn-primary">
          Close
        </button>
      </div>
    </div>
  )
})

function DeleteUserForm({
  user,
  onConfirm,
  onCancel
}: {
  user: User;
  onConfirm: () => void;
  onCancel: () => void
}) {
  return (
    <div className="delete-confirmation">
      <div className="warning-icon">⚠️</div>
      <h3>Delete User</h3>
      <p>Are you sure you want to delete <strong>{user.name}</strong>? This action cannot be undone.</p>

      <div className="user-summary">
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Department:</strong> {user.department || 'Not assigned'}</p>
        <p><strong>Status:</strong> {user.status}</p>
      </div>

      <div className="form-actions">
        <button onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
        <button onClick={onConfirm} className="btn btn-danger">
          Delete User
        </button>
      </div>
    </div>
  )
}

interface User {
  id: number
  name: string
  email: string
  age: number
  city: string
  status: 'active' | 'inactive' | 'pending'
  joinDate: string
  department?: string
  skills?: string[]
  bio?: string
}

const initialUsers: User[] = [
  { 
    id: 1, 
    name: 'John Doe', 
    email: 'john@example.com', 
    age: 28, 
    city: 'New York', 
    status: 'active', 
    joinDate: '2023-01-15',
    department: 'Engineering',
    skills: ['React', 'TypeScript', 'Node.js'],
    bio: 'Senior frontend developer with 5+ years experience'
  },
  { 
    id: 2, 
    name: 'Jane Smith', 
    email: 'jane@example.com', 
    age: 34, 
    city: 'Los Angeles', 
    status: 'active', 
    joinDate: '2023-02-20',
    department: 'Marketing',
    skills: ['Content Marketing', 'SEO', 'Analytics'],
    bio: 'Marketing specialist focused on digital growth strategies'
  },
  { 
    id: 3, 
    name: 'Bob Johnson', 
    email: 'bob@example.com', 
    age: 42, 
    city: 'Chicago', 
    status: 'inactive', 
    joinDate: '2023-03-10',
    department: 'Sales',
    skills: ['Sales', 'CRM', 'Business Development'],
    bio: 'Experienced sales manager with enterprise clients'
  },
  { 
    id: 4, 
    name: 'Alice Brown', 
    email: 'alice@example.com', 
    age: 29, 
    city: 'Houston', 
    status: 'pending', 
    joinDate: '2023-04-05',
    department: 'HR',
    skills: ['Recruiting', 'Employee Relations', 'Training'],
    bio: 'HR professional specializing in talent acquisition'
  },
  { 
    id: 5, 
    name: 'Charlie Wilson', 
    email: 'charlie@example.com', 
    age: 35, 
    city: 'Phoenix', 
    status: 'active', 
    joinDate: '2023-05-12',
    department: 'Support',
    skills: ['Customer Support', 'Technical Writing', 'Training'],
    bio: 'Customer success manager with technical background'
  },
  { 
    id: 6, 
    name: 'Diana Davis', 
    email: 'diana@example.com', 
    age: 31, 
    city: 'Philadelphia', 
    status: 'active', 
    joinDate: '2023-06-18',
    department: 'Design',
    skills: ['UI/UX Design', 'Figma', 'Prototyping'],
    bio: 'Creative designer focused on user experience'
  },
  { 
    id: 7, 
    name: 'Edward Miller', 
    email: 'edward@example.com', 
    age: 27, 
    city: 'San Antonio', 
    status: 'inactive', 
    joinDate: '2023-07-22',
    department: 'Engineering',
    skills: ['Python', 'Django', 'PostgreSQL'],
    bio: 'Backend developer specializing in data systems'
  },
  { 
    id: 8, 
    name: 'Fiona Garcia', 
    email: 'fiona@example.com', 
    age: 33, 
    city: 'San Diego', 
    status: 'pending', 
    joinDate: '2023-08-08',
    department: 'Product',
    skills: ['Product Management', 'Analytics', 'Strategy'],
    bio: 'Product manager with focus on growth metrics'
  }
]

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' }
]

function App() {
  const [users, setUsers] = useState<User[]>(initialUsers)

  // Enhanced table columns with better formatting
  const columns = [
    { accessorKey: 'id', header: 'ID', sortable: true },
    { 
      accessorKey: 'name', 
      header: 'Name', 
      sortable: true,
      cell: ({ value, row }: any) => (
        <div className="user-cell">
          <div className="user-name">{value}</div>
          {row.department && (
            <div className="user-department">{row.department}</div>
          )}
        </div>
      )
    },
    { accessorKey: 'email', header: 'Email', sortable: true },
    { accessorKey: 'age', header: 'Age', sortable: true },
    { accessorKey: 'city', header: 'City', sortable: true },
    {
      accessorKey: 'status',
      header: 'Status',
      sortable: true,
      cell: ({ value }: any) => (
        <span className={`status-badge ${value}`}>
          {statusOptions.find(s => s.value === value)?.label || value}
        </span>
      )
    },
    { 
      accessorKey: 'skills',
      header: 'Skills',
      sortable: false,
      cell: ({ value }: any) => (
        <div className="skills-preview">
          {value && value.length > 0 ? (
            <>
              {value.slice(0, 2).map((skill: string, i: number) => (
                <span key={i} className="skill-tag small">{skill}</span>
              ))}
              {value.length > 2 && (
                <span className="skill-tag small extra">+{value.length - 2}</span>
              )}
            </>
          ) : (
            <span className="no-skills">No skills</span>
          )}
        </div>
      )
    },
    { 
      accessorKey: 'joinDate', 
      header: 'Join Date', 
      sortable: true,
      cell: ({ value }: any) => new Date(value).toLocaleDateString()
    }
  ]

  const handleDelete = (id: number) => {
    setUsers(prev => prev.filter(item => item.id !== id))
  }

  const handleEdit = (formData: Partial<User>, id: number) => {
    setUsers(prev => 
      prev.map(item => item.id === id ? { ...item, ...formData } : item)
    )
  }

  const handleCreate = (formData: Omit<User, 'id'>) => {
    const newId = Math.max(...users.map(item => item.id)) + 1
    setUsers(prev => [...prev, { id: newId, ...formData }])
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div className="page-header">
          <h1>React Table Power - Demo</h1>
          <p>Advanced DataTable with sorting, filtering, pagination, and export features</p>
        </div>
        
        <div className="demo-container">
          <DataTable
            data={users}
            columns={columns}
            title="User Management"
            description="Manage your team members with advanced table features"
            pagination={true}
            globalSearch={true}
            striped
            hover
            selection={{
              enabled: true,
              type: 'checkbox',
            }}
            builtInActions={{
              create: true,
              edit: true,
              delete: true,
              view: true,
              createFormComponent: CreateUserForm,
              editFormComponent: EditUserForm,
              viewFormComponent: ViewUserForm,
              deleteFormComponent: DeleteUserForm,
            }}
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
              {
                key: 'activate',
                label: 'Activate Selected',
                onClick: (selectedRows: User[], selectedKeys: string[]) => {
                  selectedKeys.forEach(key => {
                    const id = parseInt(key)
                    handleEdit({ status: 'active' }, id)
                  })
                },
                variant: 'primary',
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

          {users.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h3>No users found</h3>
              <p>Your user list is empty. Add some users to get started!</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .page-header {
          text-align: center;
          margin-bottom: 3rem;
          padding: 2rem 0;
        }

        .page-header h1 {
          font-size: 2.5rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
          color: #1f2937;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .page-header p {
          font-size: 1.2rem;
          color: #6b7280;
          margin: 0;
        }

        .demo-container {
          background: white;
          border-radius: 0.75rem;
          border: 1px solid #e5e7eb;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .user-cell {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .user-name {
          font-weight: 500;
          color: #1f2937;
        }

        .user-department {
          font-size: 0.75rem;
          color: #6b7280;
          font-weight: 400;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .status-badge.active {
          background: #d1fae5;
          color: #065f46;
        }

        .status-badge.inactive {
          background: #fee2e2;
          color: #991b1b;
        }

        .status-badge.pending {
          background: #fef3c7;
          color: #92400e;
        }

        .skills-preview {
          display: flex;
          gap: 0.25rem;
          flex-wrap: wrap;
          align-items: center;
        }

        .skill-tag {
          background: #e0e7ff;
          color: #3730a3;
          padding: 0.125rem 0.5rem;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .skill-tag.small {
          padding: 0.125rem 0.375rem;
          font-size: 0.625rem;
        }

        .skill-tag.extra {
          background: #f3f4f6;
          color: #6b7280;
        }

        .no-skills {
          color: #9ca3af;
          font-size: 0.75rem;
          font-style: italic;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: #6b7280;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: #374151;
        }

        .empty-state p {
          margin-bottom: 2rem;
          font-size: 1.1rem;
        }

        /* Form Styles */
        .user-form {
          padding: 1.5rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          font-weight: 500;
          margin-bottom: 0.5rem;
          color: #374151;
          font-size: 0.875rem;
        }

        .form-input,
        .form-textarea {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          transition: all 0.2s ease;
          background: white;
        }

        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .form-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
          font-size: 0.875rem;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .btn-secondary {
          background: white;
          color: #6b7280;
          border-color: #d1d5db;
        }

        .btn-secondary:hover {
          background: #f9fafb;
          color: #374151;
        }

        .btn-danger {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: white;
        }

        .btn-danger:hover {
          background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
          transform: translateY(-1px);
        }

        /* View Form Styles */
        .user-view {
          padding: 1.5rem;
        }

        .view-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .view-item {
          padding: 1rem;
          background: #f9fafb;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
        }

        .view-item.full-width {
          grid-column: 1 / -1;
        }

        .view-item label {
          display: block;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 0.375rem;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .view-item p {
          margin: 0;
          color: #1f2937;
          font-weight: 500;
          font-size: 0.95rem;
        }

        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
        }

        /* Delete Confirmation Styles */
        .delete-confirmation {
          padding: 1.5rem;
          text-align: center;
        }

        .warning-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .delete-confirmation h3 {
          margin: 0 0 1rem 0;
          color: #1f2937;
          font-size: 1.25rem;
        }

        .delete-confirmation p {
          margin-bottom: 1.5rem;
          color: #6b7280;
          line-height: 1.6;
        }

        .user-summary {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-bottom: 1.5rem;
          text-align: left;
        }

        .user-summary p {
          margin: 0.5rem 0;
          color: #374151;
        }

        @media (max-width: 768px) {
          .page-header h1 {
            font-size: 2rem;
          }

          .page-header p {
            font-size: 1rem;
          }

          .demo-container {
            border-radius: 0.5rem;
          }

          .form-grid,
          .view-grid {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}

export default App
