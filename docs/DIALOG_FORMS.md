# Dialog Forms - Complete Guide

This guide provides comprehensive documentation for the enhanced dialog and form system in react-table-power, featuring first-class React Hook Form + Zod support with an extensible adapter architecture.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Quick Start](#quick-start)
3. [Basic Usage](#basic-usage)
4. [Advanced Features](#advanced-features)
5. [Form Adapters](#form-adapters)
6. [Error Handling](#error-handling)
7. [Accessibility](#accessibility)
8. [Theming & Styling](#theming--styling)
9. [Testing](#testing)
10. [Migration Guide](#migration-guide)
11. [API Reference](#api-reference)

## Architecture Overview

The dialog form system is built around three core concepts:

### 1. Provider-Driven Forms
All form components consume a form provider (React Hook Form's FormProvider by default) ensuring consistent form state management across the application.

### 2. Adapter Pattern
A flexible adapter interface allows support for different form libraries:
- **React Hook Form + Zod** (Production ready)
- **Formik + Yup** (Scaffolded for future implementation)
- **Final Form** (Scaffolded for future implementation)

### 3. Type-Safe Operations
Full TypeScript support with schema inference provides compile-time safety and excellent developer experience.

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   DialogForm    │───▶│   FormAdapter    │───▶│   Form Library  │
│   Wrapper       │    │   Interface      │    │   (RHF/Formik)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ��─────────────────┐
│   Lifecycle     │    │   Error          │    │   Validation    │
│   Management    │    │   Handling       │    │   (Zod/Yup)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Quick Start

### Installation

```bash
# Required dependencies
npm install react-hook-form @hookform/resolvers zod

# Optional for enhanced animations
npm install framer-motion
```

### Basic Setup

```tsx
import React from 'react';
import { z } from 'zod';
import { DialogFormWrapper } from 'react-table-power';

// Define your schema
const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  age: z.number().min(18, 'Must be at least 18')
});

// Your component
function UserDialog({ open, onClose, onSubmit }) {
  return (
    <DialogFormWrapper
      open={open}
      mode="create"
      title="Create User"
      schema={userSchema}
      onSubmit={onSubmit}
      onOpenChange={onClose}
      renderFields={({ form }) => (
        <div className="space-y-4">
          <div>
            <label htmlFor="name">Name</label>
            <input
              {...form.getRawForm().register('name')}
              id="name"
              className="form-input"
            />
            {form.formState.errors.name && (
              <p className="error">{form.formState.errors.name.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="email">Email</label>
            <input
              {...form.getRawForm().register('email')}
              id="email"
              type="email"
              className="form-input"
            />
            {form.formState.errors.email && (
              <p className="error">{form.formState.errors.email.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="age">Age</label>
            <input
              {...form.getRawForm().register('age', { valueAsNumber: true })}
              id="age"
              type="number"
              className="form-input"
            />
            {form.formState.errors.age && (
              <p className="error">{form.formState.errors.age.message}</p>
            )}
          </div>
        </div>
      )}
    />
  );
}
```

## Basic Usage

### Dialog Modes

The system supports four primary dialog modes:

#### Create Mode
```tsx
<DialogFormWrapper
  mode="create"
  title="Create New User"
  schema={userSchema}
  onSubmit={async (data) => {
    await api.users.create(data);
  }}
  renderFields={({ form }) => <UserForm form={form} />}
/>
```

#### Edit Mode
```tsx
<DialogFormWrapper
  mode="edit"
  title="Edit User"
  schema={userSchema}
  defaultValues={async () => await api.users.getById(userId)}
  onSubmit={async (data) => {
    await api.users.update(userId, data);
  }}
  renderFields={({ form }) => <UserForm form={form} />}
/>
```

#### View Mode (Read-only)
```tsx
<DialogFormWrapper
  mode="view"
  title="User Details"
  schema={userSchema}
  defaultValues={userData}
  renderFields={({ form, isReadOnly }) => (
    <UserForm form={form} readOnly={isReadOnly} />
  )}
/>
```

#### Delete Mode
```tsx
<DialogFormWrapper
  mode="delete"
  title="Confirm Deletion"
  schema={userSchema}
  defaultValues={userData}
  onSubmit={async () => {
    await api.users.delete(userId);
  }}
  renderFields={({ form }) => (
    <div>
      <p>Are you sure you want to delete this user?</p>
      <UserSummary data={form.getValues()} />
    </div>
  )}
/>
```

### Working with Default Values

#### Synchronous Default Values
```tsx
const defaultValues = {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
};

<DialogFormWrapper
  schema={userSchema}
  defaultValues={defaultValues}
  // ...other props
/>
```

#### Asynchronous Default Values
```tsx
const loadUserData = async () => {
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
};

<DialogFormWrapper
  schema={userSchema}
  defaultValues={loadUserData}
  // ...other props
/>
```

#### Conditional Default Values
```tsx
const getDefaultValues = () => {
  if (mode === 'create') {
    return { age: 18 }; // Minimum age
  } else {
    return loadUserData(); // Load existing data
  }
};

<DialogFormWrapper
  schema={userSchema}
  defaultValues={getDefaultValues}
  // ...other props
/>
```

## Advanced Features

### Enhanced Form Dialog Manager

For CRUD operations, use the `EnhancedFormDialogManager` for a complete solution:

```tsx
import { EnhancedFormDialogManager } from 'react-table-power';

function UserManagement() {
  const handleSubmit = async (data, mode) => {
    switch (mode) {
      case 'create':
        await api.users.create(data);
        break;
      case 'edit':
        await api.users.update(data.id, data);
        break;
      case 'delete':
        await api.users.delete(data.id);
        break;
    }
    return true; // Success
  };

  return (
    <EnhancedFormDialogManager
      schemas={{
        create: userCreateSchema,
        edit: userEditSchema,
        view: userViewSchema,
        delete: userDeleteSchema
      }}
      formComponents={{
        create: CreateUserForm,
        edit: EditUserForm,
        view: ViewUserForm,
        delete: DeleteUserConfirmation
      }}
      onSubmit={handleSubmit}
    >
      {({ openCreateDialog, openEditDialog, openViewDialog, openDeleteDialog }) => (
        <div>
          <button onClick={() => openCreateDialog()}>
            Create User
          </button>
          
          <UserTable
            onEdit={(user) => openEditDialog(user)}
            onView={(user) => openViewDialog(user)}
            onDelete={(user) => openDeleteDialog(user)}
          />
        </div>
      )}
    </EnhancedFormDialogManager>
  );
}
```

### Custom Form Components

Create reusable form components with the form context:

```tsx
import { useFormContext } from 'react-hook-form';

function UserForm({ readOnly = false }) {
  const { register, formState: { errors } } = useFormContext();
  
  return (
    <div className="space-y-4">
      <FormField
        label="Name"
        error={errors.name?.message}
        required
      >
        <input
          {...register('name')}
          readOnly={readOnly}
          className="form-input"
        />
      </FormField>
      
      <FormField
        label="Email"
        error={errors.email?.message}
        required
      >
        <input
          {...register('email')}
          type="email"
          readOnly={readOnly}
          className="form-input"
        />
      </FormField>
      
      <FormField
        label="Age"
        error={errors.age?.message}
      >
        <input
          {...register('age', { valueAsNumber: true })}
          type="number"
          readOnly={readOnly}
          className="form-input"
        />
      </FormField>
    </div>
  );
}

function FormField({ label, error, required, children }) {
  return (
    <div className="form-field">
      <label className={`form-label ${required ? 'required' : ''}`}>
        {label}
      </label>
      {children}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
```

### Controller for Complex Components

For controlled components like date pickers or custom selects:

```tsx
import { Controller } from 'react-hook-form';

function UserFormWithController() {
  return (
    <div className="space-y-4">
      {/* Regular input */}
      <input {...register('name')} />
      
      {/* Controlled component */}
      <Controller
        name="birthDate"
        control={form.control}
        render={({ field, fieldState }) => (
          <DatePicker
            value={field.value}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      
      {/* Multi-select */}
      <Controller
        name="roles"
        control={form.control}
        render={({ field }) => (
          <MultiSelect
            value={field.value}
            onChange={field.onChange}
            options={roleOptions}
          />
        )}
      />
    </div>
  );
}
```

### Array Fields with useFieldArray

For dynamic form fields:

```tsx
import { useFieldArray } from 'react-hook-form';

const contactSchema = z.object({
  name: z.string(),
  contacts: z.array(z.object({
    type: z.enum(['email', 'phone']),
    value: z.string()
  }))
});

function ContactForm() {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'contacts'
  });

  return (
    <div className="space-y-4">
      <input {...register('name')} placeholder="Name" />
      
      <div className="contacts-section">
        <h3>Contacts</h3>
        
        {fields.map((field, index) => (
          <div key={field.id} className="contact-row">
            <select {...register(`contacts.${index}.type`)}>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
            </select>
            
            <input
              {...register(`contacts.${index}.value`)}
              placeholder="Contact value"
            />
            
            <button
              type="button"
              onClick={() => remove(index)}
              className="btn-danger"
            >
              Remove
            </button>
          </div>
        ))}
        
        <button
          type="button"
          onClick={() => append({ type: 'email', value: '' })}
          className="btn-secondary"
        >
          Add Contact
        </button>
      </div>
    </div>
  );
}
```

## Form Adapters

### React Hook Form Adapter (Default)

The default adapter provides full React Hook Form + Zod integration:

```tsx
import { reactHookFormAdapter } from 'react-table-power/adapters';

<DialogFormWrapper
  formAdapter={reactHookFormAdapter}
  schema={zodSchema}
  // ...other props
/>
```

### Type-Safe Adapter Creation

Create strongly-typed adapters for specific schemas:

```tsx
import { createTypedRHFAdapter } from 'react-table-power/adapters';

const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number()
});

const userFormAdapter = createTypedRHFAdapter(userSchema);

// Usage with full type safety
const userForm = userFormAdapter.create({
  name: 'John',
  age: 25
  // email is optional since it's not required by the creation
});
```

### Custom Adapter Implementation

Implement custom adapters for other form libraries:

```tsx
import { FormAdapter } from 'react-table-power/types';

class MyCustomFormAdapter implements FormAdapter {
  useCreate(params) {
    // Your custom form library integration
    const form = useMyFormLibrary(params);
    
    return {
      Provider: ({ children }) => (
        <MyFormProvider form={form}>
          {children}
        </MyFormProvider>
      ),
      api: {
        getValues: () => form.values,
        setValues: (values) => form.setValues(values),
        // ... implement all required methods
      },
      handleSubmit: (onValid) => form.handleSubmit(onValid),
      // ... implement all required properties
    };
  }
}

// Usage
const customAdapter = new MyCustomFormAdapter();

<DialogFormWrapper
  formAdapter={customAdapter}
  // ...other props
/>
```

## Error Handling

### Form Validation Errors

The system automatically handles Zod validation errors:

```tsx
const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email'),
  age: z.number().min(18, 'Must be at least 18 years old')
});

// Validation errors are automatically displayed
<DialogFormWrapper
  schema={userSchema}
  renderFields={({ form }) => (
    <div>
      {/* Errors are automatically available in form.formState.errors */}
      <input {...form.getRawForm().register('name')} />
      {form.formState.errors.name && (
        <span className="error">{form.formState.errors.name.message}</span>
      )}
    </div>
  )}
/>
```

### Server Validation Errors

Handle server-side validation errors by throwing them in your submit handler:

```tsx
const handleSubmit = async (data) => {
  try {
    await api.users.create(data);
  } catch (error) {
    if (error.status === 422) {
      // Server validation errors
      throw {
        errors: {
          email: 'Email already exists',
          name: 'Name is too similar to existing user'
        }
      };
    }
    throw error; // Re-throw other errors
  }
};

<DialogFormWrapper
  onSubmit={handleSubmit}
  // ... other props
/>
```

### Custom Error Display

Customize error presentation:

```tsx
<DialogFormWrapper
  renderFields={({ form, submitError }) => (
    <div>
      {/* Form-level error */}
      {submitError && (
        <div className="alert alert-error mb-4">
          {submitError}
        </div>
      )}
      
      {/* Field-level errors */}
      <div className="field">
        <input {...form.getRawForm().register('email')} />
        {form.formState.errors.email && (
          <div className="field-error">
            <Icon name="warning" />
            {form.formState.errors.email.message}
          </div>
        )}
      </div>
    </div>
  )}
/>
```

### Error Recovery

The system includes automatic error recovery strategies:

```tsx
import { FormErrorHandler } from 'react-table-power/utils';

const errorHandler = new FormErrorHandler();

const handleSubmit = async (data) => {
  try {
    await api.users.create(data);
  } catch (error) {
    const processed = errorHandler.processError(error);
    const strategy = errorHandler.getRecoveryStrategy(processed);
    
    if (strategy.canAutoRecover && strategy.retryCount < strategy.maxRetries) {
      // Automatic retry for network errors
      setTimeout(() => handleSubmit(data), strategy.retryDelay);
    } else {
      // Show error to user
      throw error;
    }
  }
};
```

## Accessibility

The dialog system includes comprehensive accessibility features:

### ARIA Support

```tsx
// All dialogs automatically include proper ARIA attributes
<DialogFormWrapper
  title="Create User" // Sets aria-labelledby
  description="Fill out the form below" // Sets aria-describedby
  // Automatically includes:
  // - role="dialog"
  // - aria-modal="true"
  // - aria-busy when loading
  // - proper focus management
/>
```

### Keyboard Navigation

- **Tab/Shift+Tab**: Navigate between form fields
- **Escape**: Close dialog (configurable)
- **Enter**: Submit form when focused on submit button
- **Home/End**: Jump to first/last focusable element (with Ctrl/Cmd)

### Screen Reader Support

```tsx
// Automatic announcements for screen readers
<DialogFormWrapper
  // Announces dialog opening/closing
  // Announces form submission status
  // Announces validation errors
  renderFields={({ form }) => (
    <div>
      {/* Use proper labels and descriptions */}
      <label htmlFor="email">
        Email Address
        <span className="required">*</span>
      </label>
      <input
        id="email"
        {...form.getRawForm().register('email')}
        aria-describedby="email-help email-error"
        aria-invalid={!!form.formState.errors.email}
      />
      <div id="email-help" className="field-help">
        We'll never share your email with anyone else.
      </div>
      {form.formState.errors.email && (
        <div id="email-error" className="field-error" role="alert">
          {form.formState.errors.email.message}
        </div>
      )}
    </div>
  )}
/>
```

### High Contrast and Reduced Motion

The system automatically respects user preferences:

```css
/* Automatically applied based on user preferences */
@media (prefers-contrast: high) {
  .rtp-dialog {
    border: 2px solid currentColor;
  }
}

@media (prefers-reduced-motion: reduce) {
  .rtp-dialog {
    animation: none !important;
    transition: none !important;
  }
}
```

## Theming & Styling

### CSS Custom Properties

The system uses CSS custom properties for easy theming:

```css
:root {
  /* Colors */
  --rtp-color-primary: #3b82f6;
  --rtp-color-secondary: #6b7280;
  --rtp-color-destructive: #dc2626;
  
  /* Backgrounds */
  --rtp-bg-primary: #ffffff;
  --rtp-bg-secondary: #f9fafb;
  --rtp-bg-overlay: rgba(0, 0, 0, 0.5);
  
  /* Borders */
  --rtp-border-color: #e5e7eb;
  --rtp-border-radius: 0.5rem;
  
  /* Spacing */
  --rtp-space-sm: 0.5rem;
  --rtp-space-md: 1rem;
  --rtp-space-lg: 1.5rem;
  
  /* Typography */
  --rtp-font-size-sm: 0.875rem;
  --rtp-font-size-md: 1rem;
  --rtp-font-size-lg: 1.125rem;
}

/* Dark mode */
.dark {
  --rtp-color-primary: #60a5fa;
  --rtp-bg-primary: #1f2937;
  --rtp-bg-secondary: #111827;
  --rtp-text-primary: #f9fafb;
  --rtp-border-color: #374151;
}
```

### Custom Dialog Sizes

```tsx
<DialogFormWrapper
  width="auto" // Default: auto-sizing
  maxWidth="600px" // Limit maximum width
  className="custom-dialog" // Add custom classes
/>

// CSS
.custom-dialog {
  min-height: 400px;
  max-height: 80vh;
}

// Predefined sizes
.rtp-dialog-sm { width: 24rem; }
.rtp-dialog-md { width: 32rem; }
.rtp-dialog-lg { width: 42rem; }
.rtp-dialog-xl { width: 56rem; }
```

### Custom Button Styling

```tsx
<DialogFormWrapper
  renderFooter={({ submitting, onSubmit, onCancel }) => (
    <div className="custom-footer">
      <button 
        type="button" 
        onClick={onCancel}
        className="btn btn-outline"
      >
        Cancel
      </button>
      <button 
        type="submit" 
        onClick={onSubmit}
        disabled={submitting}
        className="btn btn-primary"
      >
        {submitting ? (
          <>
            <Spinner className="w-4 h-4 mr-2" />
            Saving...
          </>
        ) : (
          'Save Changes'
        )}
      </button>
    </div>
  )}
/>
```

## Testing

### Unit Testing with Jest and React Testing Library

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';
import { DialogFormWrapper } from 'react-table-power';

const testSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email')
});

describe('UserDialog', () => {
  it('submits form with valid data', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    
    render(
      <DialogFormWrapper
        open={true}
        schema={testSchema}
        onSubmit={onSubmit}
        renderFields={({ form }) => (
          <div>
            <input 
              {...form.getRawForm().register('name')}
              data-testid="name-input"
            />
            <input 
              {...form.getRawForm().register('email')}
              data-testid="email-input"
            />
          </div>
        )}
      />
    );
    
    await user.type(screen.getByTestId('name-input'), 'John Doe');
    await user.type(screen.getByTestId('email-input'), 'john@example.com');
    await user.click(screen.getByRole('button', { name: /create/i }));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com'
      });
    });
  });
  
  it('displays validation errors', async () => {
    render(
      <DialogFormWrapper
        open={true}
        schema={testSchema}
        onSubmit={jest.fn()}
        renderFields={({ form }) => (
          <div>
            <input {...form.getRawForm().register('name')} />
            {form.formState.errors.name && (
              <span>{form.formState.errors.name.message}</span>
            )}
          </div>
        )}
      />
    );
    
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /create/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
  });
});
```

### Integration Testing

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { EnhancedFormDialogManager } from 'react-table-power';

// Mock API
const mockApi = {
  users: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
};

describe('UserManagement Integration', () => {
  it('handles complete CRUD workflow', async () => {
    const handleSubmit = async (data, mode) => {
      switch (mode) {
        case 'create':
          await mockApi.users.create(data);
          break;
        case 'edit':
          await mockApi.users.update(data.id, data);
          break;
        case 'delete':
          await mockApi.users.delete(data.id);
          break;
      }
      return true;
    };

    render(
      <EnhancedFormDialogManager
        schemas={{ create: userSchema, edit: userSchema, delete: userSchema }}
        onSubmit={handleSubmit}
      >
        {({ openCreateDialog, openEditDialog, openDeleteDialog }) => (
          <div>
            <button onClick={() => openCreateDialog()}>Create</button>
            <button onClick={() => openEditDialog({ id: 1, name: 'John' })}>
              Edit
            </button>
            <button onClick={() => openDeleteDialog({ id: 1, name: 'John' })}>
              Delete
            </button>
          </div>
        )}
      </EnhancedFormDialogManager>
    );

    // Test create workflow
    fireEvent.click(screen.getByText('Create'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    // Test edit workflow
    fireEvent.click(screen.getByText('Edit'));
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    
    // Test delete workflow
    fireEvent.click(screen.getByText('Delete'));
    expect(screen.getByText(/confirm delete/i)).toBeInTheDocument();
  });
});
```

### Accessibility Testing

```tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Dialog Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(
      <DialogFormWrapper
        open={true}
        title="Accessible Dialog"
        schema={testSchema}
        renderFields={() => <div>Content</div>}
      />
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('has proper focus management', () => {
    render(
      <DialogFormWrapper
        open={true}
        schema={testSchema}
        renderFields={() => (
          <input data-testid="first-input" autoFocus />
        )}
      />
    );
    
    expect(screen.getByTestId('first-input')).toHaveFocus();
  });
});
```

## Migration Guide

### From Legacy Dialog Components

If you're migrating from the old AppendableDialog or FormDialogManager:

```tsx
// Old way
<AppendableDialog
  activeDialog="create"
  activeRecord={userData}
  formComponents={{
    create: CreateUserForm
  }}
  onSubmit={handleSubmit}
/>

// New way
<DialogFormWrapper
  open={true}
  mode="create"
  schema={userSchema}
  defaultValues={userData}
  onSubmit={handleSubmit}
  renderFields={({ form }) => <CreateUserForm form={form} />}
/>
```

### Updating Form Components

```tsx
// Old form component
function OldUserForm({ data, onSubmit, isReadOnly }) {
  const [formData, setFormData] = useState(data);
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSubmit(formData);
    }}>
      <input 
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        readOnly={isReadOnly}
      />
    </form>
  );
}

// New form component
function NewUserForm() {
  const { register, formState: { errors } } = useFormContext();
  
  return (
    <div>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
    </div>
  );
}
```

## API Reference

### DialogFormWrapper Props

```typescript
interface DialogFormProps<TSchemaInput, TOutput = TSchemaInput> {
  // Dialog state
  open?: boolean;
  mode?: DialogFormMode; // 'create' | 'edit' | 'view' | 'delete'
  
  // Content
  title?: string;
  description?: string;
  
  // Schema and validation
  schema: z.ZodType<TSchemaInput, any, any>;
  defaultValues?: Partial<TSchemaInput> | (() => Promise<Partial<TSchemaInput>>);
  
  // Handlers
  onSubmit: (values: TOutput) => Promise<void> | void;
  onOpenChange?: (open: boolean) => void;
  
  // Rendering
  renderFields: (context: FormRenderContext<TSchemaInput>) => React.ReactNode;
  renderFooter?: (context: FooterRenderContext) => React.ReactNode;
  
  // Configuration
  formAdapter?: FormAdapter;
  validationMode?: 'onSubmit' | 'onBlur' | 'onChange' | 'onTouched' | 'all';
  resetOnClose?: boolean;
  
  // Appearance
  width?: string | number;
  maxWidth?: string | number;
  className?: string;
  
  // Behavior
  closeOnClickOutside?: boolean;
  closeOnEsc?: boolean;
  disabled?: boolean;
  loading?: boolean;
  error?: string | Error | null;
}
```

### Form Render Context

```typescript
interface FormRenderContext<TData> {
  form: FormAPI<TData>;
  submitting: boolean;
  submitError?: string;
  mode: DialogFormMode;
  formState: FormState;
  isReadOnly: boolean;
}
```

### Form API

```typescript
interface FormAPI<TData> {
  getValues: () => TData;
  getValidatedValues: () => Promise<TData>;
  setValues: (values: Partial<TData>) => void;
  reset: (values?: Partial<TData>) => void;
  validate: (fieldNames?: string | string[]) => Promise<boolean>;
  setError: (path: string, message: string) => void;
  setErrors: (errors: Record<string, string>) => void;
  clearErrors: () => void;
  getErrors: () => Record<string, any>;
  isDirty: () => boolean;
  isValid: () => boolean;
  isSubmitting: () => boolean;
  watch: (fieldNames?: string | string[]) => any;
  subscribe: (callback: (state: FormState) => void) => () => void;
}
```

---

For more examples and advanced use cases, see the [examples directory](../examples/) and [API documentation](./API.md).
