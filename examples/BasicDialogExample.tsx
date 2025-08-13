import React, { useState } from 'react';
import { z } from 'zod';
import { DialogFormWrapper } from '../src/components/DialogFormWrapper';
import { useFormContext } from 'react-hook-form';

// Define the user schema
const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  age: z.number().min(18, 'Must be at least 18 years old').max(120, 'Invalid age'),
  role: z.enum(['user', 'admin', 'moderator'], {
    errorMap: () => ({ message: 'Please select a valid role' })
  }),
  isActive: z.boolean().default(true),
  bio: z.string().optional()
});

type UserFormData = z.infer<typeof userSchema>;

// Reusable form component that works with React Hook Form context
function UserForm({ readOnly = false }: { readOnly?: boolean }) {
  const { register, formState: { errors }, watch, control } = useFormContext<UserFormData>();
  
  const watchedRole = watch('role');

  return (
    <div className="space-y-6">
      {/* Name Field */}
      <div className="form-group">
        <label htmlFor="name" className="form-label required">
          Full Name
        </label>
        <input
          {...register('name')}
          id="name"
          type="text"
          readOnly={readOnly}
          className={`form-input ${errors.name ? 'error' : ''}`}
          placeholder="Enter your full name"
        />
        {errors.name && (
          <p className="form-error" role="alert">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Email Field */}
      <div className="form-group">
        <label htmlFor="email" className="form-label required">
          Email Address
        </label>
        <input
          {...register('email')}
          id="email"
          type="email"
          readOnly={readOnly}
          className={`form-input ${errors.email ? 'error' : ''}`}
          placeholder="Enter your email address"
        />
        {errors.email && (
          <p className="form-error" role="alert">
            {errors.email.message}
          </p>
        )}
        <p className="form-help">
          We'll never share your email with anyone else.
        </p>
      </div>

      {/* Age Field */}
      <div className="form-group">
        <label htmlFor="age" className="form-label required">
          Age
        </label>
        <input
          {...register('age', { valueAsNumber: true })}
          id="age"
          type="number"
          readOnly={readOnly}
          className={`form-input ${errors.age ? 'error' : ''}`}
          placeholder="Enter your age"
          min="18"
          max="120"
        />
        {errors.age && (
          <p className="form-error" role="alert">
            {errors.age.message}
          </p>
        )}
      </div>

      {/* Role Select */}
      <div className="form-group">
        <label htmlFor="role" className="form-label required">
          Role
        </label>
        <select
          {...register('role')}
          id="role"
          disabled={readOnly}
          className={`form-select ${errors.role ? 'error' : ''}`}
        >
          <option value="">Select a role</option>
          <option value="user">User</option>
          <option value="moderator">Moderator</option>
          <option value="admin">Administrator</option>
        </select>
        {errors.role && (
          <p className="form-error" role="alert">
            {errors.role.message}
          </p>
        )}
      </div>

      {/* Active Status Checkbox */}
      <div className="form-group">
        <div className="checkbox-group">
          <input
            {...register('isActive')}
            id="isActive"
            type="checkbox"
            disabled={readOnly}
            className="form-checkbox"
          />
          <label htmlFor="isActive" className="form-label">
            Active Account
          </label>
        </div>
        <p className="form-help">
          Inactive accounts cannot log in to the system.
        </p>
      </div>

      {/* Bio Field - Only show for admin and moderator roles */}
      {(watchedRole === 'admin' || watchedRole === 'moderator') && (
        <div className="form-group">
          <label htmlFor="bio" className="form-label">
            Bio
          </label>
          <textarea
            {...register('bio')}
            id="bio"
            readOnly={readOnly}
            className={`form-textarea ${errors.bio ? 'error' : ''}`}
            placeholder="Tell us about yourself..."
            rows={4}
          />
          {errors.bio && (
            <p className="form-error" role="alert">
              {errors.bio.message}
            </p>
          )}
          <p className="form-help">
            This information will be visible to other users.
          </p>
        </div>
      )}
    </div>
  );
}

// Example usage component
export function BasicDialogExample() {
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    mode: 'create' | 'edit' | 'view' | 'delete';
    data?: UserFormData;
  }>({
    open: false,
    mode: 'create'
  });

  // Sample user data for editing/viewing
  const sampleUser: UserFormData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    age: 28,
    role: 'user',
    isActive: true,
    bio: 'A passionate developer who loves building great user experiences.'
  };

  // Simulate API calls
  const handleSubmit = async (data: UserFormData) => {
    console.log('Submitting:', data);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate occasional errors for demo purposes
    if (Math.random() < 0.2) {
      throw new Error('Something went wrong. Please try again.');
    }

    // Simulate server validation errors
    if (data.email === 'taken@example.com') {
      throw {
        errors: {
          email: 'This email address is already in use'
        }
      };
    }

    console.log('Success!');
  };

  const openDialog = (mode: typeof dialogState.mode, data?: UserFormData) => {
    setDialogState({ open: true, mode, data });
  };

  const closeDialog = () => {
    setDialogState(prev => ({ ...prev, open: false }));
  };

  const getDefaultValues = () => {
    switch (dialogState.mode) {
      case 'create':
        return { isActive: true, age: 18 };
      case 'edit':
      case 'view':
      case 'delete':
        return dialogState.data;
      default:
        return {};
    }
  };

  const getDialogTitle = () => {
    switch (dialogState.mode) {
      case 'create':
        return 'Create New User';
      case 'edit':
        return 'Edit User';
      case 'view':
        return 'User Details';
      case 'delete':
        return 'Confirm Deletion';
      default:
        return 'User Dialog';
    }
  };

  const getDialogDescription = () => {
    switch (dialogState.mode) {
      case 'create':
        return 'Fill in the information below to create a new user account.';
      case 'edit':
        return 'Update the user information below.';
      case 'view':
        return 'View the user account details.';
      case 'delete':
        return 'Are you sure you want to delete this user? This action cannot be undone.';
      default:
        return '';
    }
  };

  return (
    <div className="example-container">
      <div className="example-header">
        <h1>Basic Dialog Form Example</h1>
        <p>
          This example demonstrates basic CRUD operations using the DialogFormWrapper
          component with React Hook Form and Zod validation.
        </p>
      </div>

      <div className="example-actions">
        <button
          onClick={() => openDialog('create')}
          className="btn btn-primary"
        >
          Create User
        </button>
        
        <button
          onClick={() => openDialog('edit', sampleUser)}
          className="btn btn-secondary"
        >
          Edit Sample User
        </button>
        
        <button
          onClick={() => openDialog('view', sampleUser)}
          className="btn btn-outline"
        >
          View Sample User
        </button>
        
        <button
          onClick={() => openDialog('delete', sampleUser)}
          className="btn btn-danger"
        >
          Delete Sample User
        </button>
      </div>

      <div className="example-info">
        <h3>Try these features:</h3>
        <ul>
          <li>Form validation with instant feedback</li>
          <li>Different modes (create, edit, view, delete)</li>
          <li>Conditional fields based on role selection</li>
          <li>Error handling (try email "taken@example.com")</li>
          <li>Keyboard navigation and accessibility</li>
        </ul>
      </div>

      <DialogFormWrapper
        open={dialogState.open}
        mode={dialogState.mode}
        title={getDialogTitle()}
        description={getDialogDescription()}
        schema={userSchema}
        defaultValues={getDefaultValues()}
        onSubmit={handleSubmit}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
        renderFields={({ form, isReadOnly, mode }) => {
          if (mode === 'delete') {
            return (
              <div className="delete-confirmation">
                <div className="warning-icon">⚠️</div>
                <div className="user-summary">
                  <h4>User to be deleted:</h4>
                  <dl>
                    <dt>Name:</dt>
                    <dd>{dialogState.data?.name}</dd>
                    <dt>Email:</dt>
                    <dd>{dialogState.data?.email}</dd>
                    <dt>Role:</dt>
                    <dd>{dialogState.data?.role}</dd>
                  </dl>
                </div>
              </div>
            );
          }

          return <UserForm readOnly={isReadOnly} />;
        }}
        width="600px"
        closeOnClickOutside={true}
        closeOnEsc={true}
      />

      <style jsx>{`
        .example-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }

        .example-header {
          margin-bottom: 2rem;
        }

        .example-header h1 {
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }

        .example-header p {
          color: #6b7280;
          font-size: 1.1rem;
        }

        .example-actions {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .example-info {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .example-info h3 {
          margin-top: 0;
          margin-bottom: 1rem;
          font-weight: 600;
        }

        .example-info ul {
          margin: 0;
          padding-left: 1.5rem;
        }

        .example-info li {
          margin-bottom: 0.5rem;
        }

        .btn {
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }

        .btn-primary {
          background-color: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background-color: #2563eb;
        }

        .btn-secondary {
          background-color: #6b7280;
          color: white;
        }

        .btn-secondary:hover {
          background-color: #4b5563;
        }

        .btn-outline {
          border-color: #d1d5db;
          color: #374151;
          background-color: white;
        }

        .btn-outline:hover {
          background-color: #f9fafb;
        }

        .btn-danger {
          background-color: #dc2626;
          color: white;
        }

        .btn-danger:hover {
          background-color: #b91c1c;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-label {
          display: block;
          font-weight: 500;
          margin-bottom: 0.25rem;
          color: #374151;
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
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          transition: border-color 0.2s;
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
        }

        .form-checkbox {
          margin-right: 0.5rem;
        }

        .checkbox-group {
          display: flex;
          align-items: center;
        }

        .form-error {
          color: #dc2626;
          font-size: 0.875rem;
          margin-top: 0.25rem;
          margin-bottom: 0;
        }

        .form-help {
          color: #6b7280;
          font-size: 0.875rem;
          margin-top: 0.25rem;
          margin-bottom: 0;
        }

        .delete-confirmation {
          text-align: center;
          padding: 1rem;
        }

        .warning-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .user-summary {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-top: 1rem;
        }

        .user-summary h4 {
          margin-top: 0;
          margin-bottom: 1rem;
          font-weight: 600;
        }

        .user-summary dl {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 0.5rem;
          margin: 0;
        }

        .user-summary dt {
          font-weight: 500;
          color: #6b7280;
        }

        .user-summary dd {
          margin: 0;
          color: #374151;
        }
      `}</style>
    </div>
  );
}

export default BasicDialogExample;
