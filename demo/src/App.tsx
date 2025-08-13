import React, { useState, useMemo } from 'react'
import { z } from 'zod'
import { DataTable } from 'react-table-power'
import { EnhancedFormDialogManager } from 'react-table-power/src/components/EnhancedFormDialogManager'
import { useFormContext, Controller } from 'react-hook-form'
import 'react-table-power/styles.ts'

// User schema for validation
const userSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  age: z.number().min(18, 'Must be at least 18 years old').max(120, 'Age must be realistic'),
  city: z.string().min(1, 'City is required'),
  status: z.enum(['active', 'inactive', 'pending'], {
    errorMap: () => ({ message: 'Please select a valid status' })
  }),
  joinDate: z.string().min(1, 'Join date is required'),
  department: z.enum(['engineering', 'marketing', 'sales', 'support', 'hr'], {
    errorMap: () => ({ message: 'Please select a department' })
  }).optional(),
  skills: z.array(z.string()).default([]),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional()
})

type User = z.infer<typeof userSchema>

const initialUsers: User[] = [
  { 
    id: 1, 
    name: 'John Doe', 
    email: 'john@example.com', 
    age: 28, 
    city: 'New York', 
    status: 'active', 
    joinDate: '2023-01-15',
    department: 'engineering',
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
    department: 'marketing',
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
    department: 'sales',
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
    department: 'hr',
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
    department: 'support',
    skills: ['Customer Support', 'Technical Writing', 'Training'],
    bio: 'Customer success manager with technical background'
  }
]

// Department and skill options
const departmentOptions = [
  { value: 'engineering', label: 'Engineering' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'sales', label: 'Sales' },
  { value: 'support', label: 'Support' },
  { value: 'hr', label: 'Human Resources' }
]

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' }
]

const skillSuggestions = [
  'React', 'TypeScript', 'Node.js', 'Python', 'Java', 'JavaScript',
  'Content Marketing', 'SEO', 'Analytics', 'PPC', 'Social Media',
  'Sales', 'CRM', 'Business Development', 'Lead Generation',
  'Customer Support', 'Technical Writing', 'Training', 'Documentation',
  'Recruiting', 'Employee Relations', 'Performance Management'
]

// Create form component
function UserCreateForm() {
  const { register, control, formState: { errors } } = useFormContext<User>()
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label htmlFor="name" className="form-label required">Full Name</label>
          <input
            {...register('name')}
            id="name"
            className={`form-input ${errors.name ? 'error' : ''}`}
            placeholder="Enter full name"
          />
          {errors.name && <p className="form-error">{errors.name.message}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="email" className="form-label required">Email Address</label>
          <input
            {...register('email')}
            id="email"
            type="email"
            className={`form-input ${errors.email ? 'error' : ''}`}
            placeholder="user@example.com"
          />
          {errors.email && <p className="form-error">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="form-group">
          <label htmlFor="age" className="form-label required">Age</label>
          <input
            {...register('age', { valueAsNumber: true })}
            id="age"
            type="number"
            min="18"
            max="120"
            className={`form-input ${errors.age ? 'error' : ''}`}
            placeholder="25"
          />
          {errors.age && <p className="form-error">{errors.age.message}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="city" className="form-label required">City</label>
          <input
            {...register('city')}
            id="city"
            className={`form-input ${errors.city ? 'error' : ''}`}
            placeholder="Enter city"
          />
          {errors.city && <p className="form-error">{errors.city.message}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="joinDate" className="form-label required">Join Date</label>
          <input
            {...register('joinDate')}
            id="joinDate"
            type="date"
            className={`form-input ${errors.joinDate ? 'error' : ''}`}
          />
          {errors.joinDate && <p className="form-error">{errors.joinDate.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label htmlFor="status" className="form-label required">Status</label>
          <select
            {...register('status')}
            id="status"
            className={`form-select ${errors.status ? 'error' : ''}`}
          >
            <option value="">Select status</option>
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.status && <p className="form-error">{errors.status.message}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="department" className="form-label">Department</label>
          <select
            {...register('department')}
            id="department"
            className="form-select"
          >
            <option value="">Select department</option>
            {departmentOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Skills</label>
        <Controller
          name="skills"
          control={control}
          render={({ field }) => (
            <SkillsInput
              value={field.value || []}
              onChange={field.onChange}
              suggestions={skillSuggestions}
            />
          )}
        />
      </div>

      <div className="form-group">
        <label htmlFor="bio" className="form-label">Bio</label>
        <textarea
          {...register('bio')}
          id="bio"
          className="form-textarea"
          placeholder="Brief description about the user..."
          rows={3}
          maxLength={500}
        />
        {errors.bio && <p className="form-error">{errors.bio.message}</p>}
      </div>
    </div>
  )
}

// Edit form component (reuses create form)
function UserEditForm() {
  return <UserCreateForm />
}

// View form component (read-only)
function UserViewForm() {
  const { watch } = useFormContext<User>()
  const user = watch()

  return (
    <div className="space-y-4">
      <div className="view-grid">
        <div className="view-item">
          <label className="view-label">Full Name</label>
          <p className="view-value">{user.name}</p>
        </div>

        <div className="view-item">
          <label className="view-label">Email Address</label>
          <p className="view-value">{user.email}</p>
        </div>

        <div className="view-item">
          <label className="view-label">Age</label>
          <p className="view-value">{user.age} years old</p>
        </div>

        <div className="view-item">
          <label className="view-label">City</label>
          <p className="view-value">{user.city}</p>
        </div>

        <div className="view-item">
          <label className="view-label">Status</label>
          <p className="view-value">
            <span className={`status-badge ${user.status}`}>
              {statusOptions.find(s => s.value === user.status)?.label}
            </span>
          </p>
        </div>

        <div className="view-item">
          <label className="view-label">Department</label>
          <p className="view-value">
            {user.department ? departmentOptions.find(d => d.value === user.department)?.label : 'Not assigned'}
          </p>
        </div>

        <div className="view-item">
          <label className="view-label">Join Date</label>
          <p className="view-value">
            {user.joinDate ? new Date(user.joinDate).toLocaleDateString() : 'Not set'}
          </p>
        </div>

        <div className="view-item">
          <label className="view-label">Skills</label>
          <div className="skills-list">
            {user.skills && user.skills.length > 0 ? (
              user.skills.map((skill, index) => (
                <span key={index} className="skill-tag">{skill}</span>
              ))
            ) : (
              <span className="no-skills">No skills listed</span>
            )}
          </div>
        </div>

        {user.bio && (
          <div className="view-item full-width">
            <label className="view-label">Bio</label>
            <p className="view-value bio-text">{user.bio}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Delete confirmation component
function UserDeleteForm() {
  const { watch } = useFormContext<User>()
  const user = watch()

  return (
    <div className="delete-confirmation">
      <div className="warning-icon">⚠️</div>
      <p className="warning-text">
        Are you sure you want to delete this user? This action cannot be undone.
      </p>
      <div className="user-summary">
        <h4>User to be deleted:</h4>
        <dl>
          <dt>Name:</dt>
          <dd>{user.name}</dd>
          <dt>Email:</dt>
          <dd>{user.email}</dd>
          <dt>Status:</dt>
          <dd>{statusOptions.find(s => s.value === user.status)?.label}</dd>
        </dl>
      </div>
    </div>
  )
}

// Skills input component
function SkillsInput({ 
  value = [], 
  onChange, 
  suggestions = [] 
}: {
  value: string[]
  onChange: (skills: string[]) => void
  suggestions: string[]
}) {
  const [inputValue, setInputValue] = useState('')

  const addSkill = (skill: string) => {
    const trimmedSkill = skill.trim()
    if (trimmedSkill && !value.includes(trimmedSkill)) {
      onChange([...value, trimmedSkill])
    }
    setInputValue('')
  }

  const removeSkill = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addSkill(inputValue)
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      removeSkill(value.length - 1)
    }
  }

  const availableSuggestions = suggestions.filter(
    suggestion => !value.includes(suggestion) && 
    suggestion.toLowerCase().includes(inputValue.toLowerCase())
  )

  return (
    <div className="skills-input">
      <div className="skills-container">
        {value.map((skill, index) => (
          <span key={index} className="skill-tag editable">
            {skill}
            <button
              type="button"
              onClick={() => removeSkill(index)}
              className="skill-remove"
              title="Remove skill"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="skills-input-field"
          placeholder="Add skills..."
        />
      </div>
      {inputValue && availableSuggestions.length > 0 && (
        <div className="skills-suggestions">
          {availableSuggestions.slice(0, 8).map(suggestion => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addSkill(suggestion)}
              className="skill-suggestion"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function App() {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [nextId, setNextId] = useState(6)

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
            <div className="user-department">
              {departmentOptions.find(d => d.value === row.department)?.label}
            </div>
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

  // Simulate API operations with loading delay
  const handleSubmit = async (data: User, mode: 'create' | 'edit' | 'delete') => {
    console.log(`${mode} operation:`, data)
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    switch (mode) {
      case 'create':
        const newUser = { ...data, id: nextId }
        setUsers(prev => [...prev, newUser])
        setNextId(prev => prev + 1)
        break
        
      case 'edit':
        setUsers(prev => 
          prev.map(u => u.id === data.id ? data : u)
        )
        break
        
      case 'delete':
        setUsers(prev => 
          prev.filter(u => u.id !== data.id)
        )
        break
    }

    return true
  }

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

  // Define schemas for different operations
  const schemas = useMemo(() => ({
    create: userSchema.omit({ id: true }),
    edit: userSchema,
    view: userSchema,
    delete: userSchema
  }), [])

  const formComponents = useMemo(() => ({
    create: UserCreateForm,
    edit: UserEditForm,
    view: UserViewForm,
    delete: UserDeleteForm
  }), [])

  const defaultValuesProviders = useMemo(() => ({
    create: () => ({
      status: 'pending' as const,
      skills: [],
      joinDate: new Date().toISOString().split('T')[0]
    })
  }), [])

  return (
    <div style={{ width: '100%', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div className="page-header">
          <h1>React Table Power - Enhanced CRUD Demo</h1>
          <p>Complete user management with advanced form dialogs, validation, and type safety</p>
        </div>
        
        <EnhancedFormDialogManager
          schemas={schemas}
          formComponents={formComponents}
          defaultValuesProviders={defaultValuesProviders}
          onSubmit={handleSubmit}
          dialogConfig={{
            width: '800px',
            closeOnClickOutside: true,
            closeOnEsc: true
          }}
        >
          {({ openCreateDialog, openEditDialog, openViewDialog, openDeleteDialog }) => (
            <div className="demo-container">
              <div className="table-header">
                <div className="table-info">
                  <h2>User Management ({users.length} users)</h2>
                  <p>Manage your team members with full CRUD operations</p>
                </div>
                <button
                  onClick={() => openCreateDialog()}
                  className="btn btn-primary create-btn"
                >
                  + Add New User
                </button>
              </div>

              <DataTable
                data={users}
                columns={columns}
                title="Users"
                description="Complete user management system"
                pagination={true}
                globalSearch={true}
                striped
                hover
                selection={{
                  enabled: true,
                  type: 'checkbox',
                }}
                builtInActions={{
                  create: false, // We handle this with our custom button
                  edit: true,
                  delete: true,
                  view: true,
                }}
                customActions={[
                  {
                    key: 'view',
                    label: 'View',
                    onClick: (row: User) => openViewDialog(row),
                    variant: 'outline',
                    icon: '👁️'
                  },
                  {
                    key: 'edit',
                    label: 'Edit',
                    onClick: (row: User) => openEditDialog(row),
                    variant: 'primary',
                    icon: '✏️'
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    onClick: (row: User) => openDeleteDialog(row),
                    variant: 'destructive',
                    icon: '🗑️'
                  }
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

              {users.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">👥</div>
                  <h3>No users found</h3>
                  <p>Get started by adding your first team member</p>
                  <button
                    onClick={() => openCreateDialog()}
                    className="btn btn-primary"
                  >
                    Add First User
                  </button>
                </div>
              )}
            </div>
          )}
        </EnhancedFormDialogManager>
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
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2rem;
          border-bottom: 1px solid #e5e7eb;
          background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
        }

        .table-info h2 {
          margin: 0 0 0.25rem 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
        }

        .table-info p {
          margin: 0;
          color: #6b7280;
          font-size: 0.95rem;
        }

        .create-btn {
          padding: 0.75rem 1.5rem;
          font-size: 0.95rem;
          font-weight: 600;
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

        .skill-tag.editable {
          background: #dbeafe;
          color: #1e40af;
          padding: 0.25rem 0.5rem;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
        }

        .skill-remove {
          background: none;
          border: none;
          color: #1e40af;
          cursor: pointer;
          font-weight: bold;
          padding: 0;
          margin-left: 0.25rem;
          font-size: 0.875rem;
        }

        .skill-remove:hover {
          color: #1d4ed8;
        }

        .no-skills {
          color: #9ca3af;
          font-size: 0.75rem;
          font-style: italic;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
          font-size: 0.875rem;
          text-decoration: none;
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

        .form-group {
          margin-bottom: 1rem;
        }

        .form-label {
          display: block;
          font-weight: 500;
          margin-bottom: 0.375rem;
          color: #374151;
          font-size: 0.875rem;
        }

        .form-label.required::after {
          content: '*';
          color: #dc2626;
          margin-left: 0.25rem;
        }

        .form-input,
        .form-select,
        .form-textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          transition: all 0.2s ease;
          background: white;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-input.error,
        .form-select.error,
        .form-textarea.error {
          border-color: #dc2626;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
        }

        .form-error {
          color: #dc2626;
          font-size: 0.8rem;
          margin-top: 0.375rem;
          margin-bottom: 0;
          font-weight: 500;
        }

        .grid {
          display: grid;
        }

        .grid-cols-2 {
          grid-template-columns: repeat(2, 1fr);
        }

        .grid-cols-3 {
          grid-template-columns: repeat(3, 1fr);
        }

        .gap-4 {
          gap: 1rem;
        }

        .space-y-4 > * + * {
          margin-top: 1rem;
        }

        .skills-input {
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          padding: 0.75rem;
          background: white;
        }

        .skills-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .skills-input-field {
          border: none;
          outline: none;
          flex: 1;
          min-width: 120px;
          padding: 0.375rem;
          font-size: 0.875rem;
        }

        .skills-suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
          padding-top: 0.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .skill-suggestion {
          background: #f3f4f6;
          color: #374151;
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
          font-weight: 500;
        }

        .skill-suggestion:hover {
          background: #e5e7eb;
        }

        .view-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
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

        .view-label {
          display: block;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 0.375rem;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .view-value {
          margin: 0;
          color: #1f2937;
          font-weight: 500;
          font-size: 0.95rem;
        }

        .bio-text {
          line-height: 1.6;
          color: #4b5563;
        }

        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
        }

        .delete-confirmation {
          text-align: center;
          padding: 1.5rem;
        }

        .warning-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .warning-text {
          margin-bottom: 1.5rem;
          color: #374151;
          font-size: 1.1rem;
          line-height: 1.6;
        }

        .user-summary {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 1.5rem;
          margin-top: 1.5rem;
        }

        .user-summary h4 {
          margin-top: 0;
          margin-bottom: 1rem;
          font-weight: 600;
          color: #1f2937;
        }

        .user-summary dl {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 0.75rem;
          margin: 0;
        }

        .user-summary dt {
          font-weight: 600;
          color: #6b7280;
        }

        .user-summary dd {
          margin: 0;
          color: #1f2937;
          font-weight: 500;
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

        @media (max-width: 768px) {
          .table-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .grid-cols-2,
          .grid-cols-3 {
            grid-template-columns: 1fr;
          }

          .view-grid {
            grid-template-columns: 1fr;
          }

          .page-header h1 {
            font-size: 2rem;
          }

          .page-header p {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  )
}

export default App
