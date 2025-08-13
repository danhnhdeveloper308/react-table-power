/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';
import { DialogFormWrapper } from '../components/DialogFormWrapper';
import { AccessibleDialogFormWrapper } from '../components/AccessibleDialogFormWrapper';
import { reactHookFormAdapter } from '../adapters';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}));

// Mock hooks
jest.mock('../hooks/useAnimationPreference', () => ({
  useAnimationPreference: () => ({ reducedMotion: false })
}));

jest.mock('../hooks/useOnClickOutside', () => ({
  useOnClickOutside: jest.fn()
}));

jest.mock('../utils/dialogLifecycle', () => ({
  useDialogLifecycle: () => ({
    state: 'open',
    open: jest.fn(),
    close: jest.fn()
  }),
  useDialogFocus: () => ({
    focusFirst: jest.fn(),
    focusLast: jest.fn()
  }),
  usePreventBodyScroll: jest.fn()
}));

describe('DialogFormWrapper', () => {
  const defaultSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    age: z.number().min(18, 'Must be at least 18')
  });

  const defaultProps = {
    open: true,
    schema: defaultSchema,
    onSubmit: jest.fn(),
    renderFields: ({ form }: any) => (
      <div>
        <input 
          {...form.getRawForm().register('name')}
          data-testid="name-input"
          placeholder="Name"
        />
        <input 
          {...form.getRawForm().register('email')}
          data-testid="email-input" 
          placeholder="Email"
          type="email"
        />
        <input 
          {...form.getRawForm().register('age', { valueAsNumber: true })}
          data-testid="age-input"
          placeholder="Age"
          type="number"
        />
      </div>
    )
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders dialog when open is true', () => {
      render(<DialogFormWrapper {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('name-input')).toBeInTheDocument();
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('age-input')).toBeInTheDocument();
    });

    it('does not render dialog when open is false', () => {
      render(<DialogFormWrapper {...defaultProps} open={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders custom title and description', () => {
      render(
        <DialogFormWrapper 
          {...defaultProps} 
          title="Custom Title"
          description="Custom description text"
        />
      );
      
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom description text')).toBeInTheDocument();
    });

    it('renders default titles based on mode', () => {
      const modes = [
        { mode: 'create' as const, title: 'Create New' },
        { mode: 'edit' as const, title: 'Edit' },
        { mode: 'view' as const, title: 'View Details' },
        { mode: 'delete' as const, title: 'Confirm Delete' }
      ];

      modes.forEach(({ mode, title }) => {
        const { unmount } = render(
          <DialogFormWrapper {...defaultProps} mode={mode} />
        );
        
        expect(screen.getByText(title)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit with validated form data', async () => {
      const onSubmit = jest.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      
      render(<DialogFormWrapper {...defaultProps} onSubmit={onSubmit} />);
      
      // Fill out the form
      await user.type(screen.getByTestId('name-input'), 'John Doe');
      await user.type(screen.getByTestId('email-input'), 'john@example.com');
      await user.type(screen.getByTestId('age-input'), '25');
      
      // Submit the form
      await user.click(screen.getByRole('button', { name: /create/i }));
      
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
          age: 25
        });
      });
    });

    it('displays validation errors for invalid data', async () => {
      const onSubmit = jest.fn();
      const user = userEvent.setup();
      
      render(<DialogFormWrapper {...defaultProps} onSubmit={onSubmit} />);
      
      // Try to submit without filling required fields
      await user.click(screen.getByRole('button', { name: /create/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });
      
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('shows loading state during submission', async () => {
      const onSubmit = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      const user = userEvent.setup();
      
      render(<DialogFormWrapper {...defaultProps} onSubmit={onSubmit} />);
      
      // Fill out valid data
      await user.type(screen.getByTestId('name-input'), 'John Doe');
      await user.type(screen.getByTestId('email-input'), 'john@example.com');
      await user.type(screen.getByTestId('age-input'), '25');
      
      // Submit the form
      await user.click(screen.getByRole('button', { name: /create/i }));
      
      // Should show loading state
      expect(screen.getByText('Submitting...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByText('Submitting...')).not.toBeInTheDocument();
      });
    });

    it('handles submission errors gracefully', async () => {
      const onSubmit = jest.fn().mockRejectedValue(new Error('Submission failed'));
      const user = userEvent.setup();
      
      render(<DialogFormWrapper {...defaultProps} onSubmit={onSubmit} />);
      
      // Fill out valid data
      await user.type(screen.getByTestId('name-input'), 'John Doe');
      await user.type(screen.getByTestId('email-input'), 'john@example.com');
      await user.type(screen.getByTestId('age-input'), '25');
      
      // Submit the form
      await user.click(screen.getByRole('button', { name: /create/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Submission failed')).toBeInTheDocument();
      });
    });

    it('handles server validation errors', async () => {
      const serverError = {
        errors: {
          email: 'Email already exists',
          name: 'Name is too short'
        }
      };
      const onSubmit = jest.fn().mockRejectedValue(serverError);
      const user = userEvent.setup();
      
      render(<DialogFormWrapper {...defaultProps} onSubmit={onSubmit} />);
      
      // Fill out data and submit
      await user.type(screen.getByTestId('name-input'), 'John');
      await user.type(screen.getByTestId('email-input'), 'existing@example.com');
      await user.type(screen.getByTestId('age-input'), '25');
      
      await user.click(screen.getByRole('button', { name: /create/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
        expect(screen.getByText('Name is too short')).toBeInTheDocument();
      });
    });
  });

  describe('Dialog Interaction', () => {
    it('closes dialog when cancel button is clicked', async () => {
      const onOpenChange = jest.fn();
      const user = userEvent.setup();
      
      render(
        <DialogFormWrapper 
          {...defaultProps} 
          onOpenChange={onOpenChange}
        />
      );
      
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('closes dialog when close button is clicked', async () => {
      const onOpenChange = jest.fn();
      const user = userEvent.setup();
      
      render(
        <DialogFormWrapper 
          {...defaultProps} 
          onOpenChange={onOpenChange}
        />
      );
      
      await user.click(screen.getByLabelText(/close/i));
      
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('closes dialog on Escape key press', async () => {
      const onOpenChange = jest.fn();
      const user = userEvent.setup();
      
      render(
        <DialogFormWrapper 
          {...defaultProps} 
          onOpenChange={onOpenChange}
        />
      );
      
      await user.keyboard('{Escape}');
      
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('does not close dialog when closeOnEsc is false', async () => {
      const onOpenChange = jest.fn();
      const user = userEvent.setup();
      
      render(
        <DialogFormWrapper 
          {...defaultProps} 
          onOpenChange={onOpenChange}
          closeOnEsc={false}
        />
      );
      
      await user.keyboard('{Escape}');
      
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('prevents closing during submission', async () => {
      const onSubmit = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      const onOpenChange = jest.fn();
      const user = userEvent.setup();
      
      render(
        <DialogFormWrapper 
          {...defaultProps} 
          onSubmit={onSubmit}
          onOpenChange={onOpenChange}
        />
      );
      
      // Fill out and submit form
      await user.type(screen.getByTestId('name-input'), 'John Doe');
      await user.type(screen.getByTestId('email-input'), 'john@example.com');
      await user.type(screen.getByTestId('age-input'), '25');
      
      await user.click(screen.getByRole('button', { name: /create/i }));
      
      // Try to close during submission
      await user.keyboard('{Escape}');
      
      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });

  describe('Default Values', () => {
    it('populates form with sync default values', () => {
      const defaultValues = {
        name: 'Default Name',
        email: 'default@example.com',
        age: 30
      };
      
      render(
        <DialogFormWrapper 
          {...defaultProps} 
          defaultValues={defaultValues}
        />
      );
      
      expect(screen.getByDisplayValue('Default Name')).toBeInTheDocument();
      expect(screen.getByDisplayValue('default@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('30')).toBeInTheDocument();
    });

    it('handles async default values', async () => {
      const defaultValues = () => Promise.resolve({
        name: 'Async Name',
        email: 'async@example.com',
        age: 25
      });
      
      render(
        <DialogFormWrapper 
          {...defaultProps} 
          defaultValues={defaultValues}
        />
      );
      
      // Should show loading initially
      expect(screen.getByText('Loading form...')).toBeInTheDocument();
      
      // Wait for values to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('Async Name')).toBeInTheDocument();
        expect(screen.getByDisplayValue('async@example.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('25')).toBeInTheDocument();
      });
    });

    it('handles async default values error', async () => {
      const defaultValues = () => Promise.reject(new Error('Failed to load'));
      
      render(
        <DialogFormWrapper 
          {...defaultProps} 
          defaultValues={defaultValues}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load')).toBeInTheDocument();
      });
    });
  });

  describe('Different Modes', () => {
    it('renders readonly fields in view mode', () => {
      render(
        <DialogFormWrapper 
          {...defaultProps} 
          mode="view"
          defaultValues={{ name: 'John', email: 'john@example.com', age: 25 }}
        />
      );
      
      const nameInput = screen.getByTestId('name-input');
      const emailInput = screen.getByTestId('email-input');
      const ageInput = screen.getByTestId('age-input');
      
      expect(nameInput).toHaveAttribute('readonly');
      expect(emailInput).toHaveAttribute('readonly');
      expect(ageInput).toHaveAttribute('readonly');
    });

    it('does not show submit button in view mode', () => {
      render(
        <DialogFormWrapper 
          {...defaultProps} 
          mode="view"
        />
      );
      
      expect(screen.queryByRole('button', { name: /create|save|delete/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('shows destructive button styling for delete mode', () => {
      render(
        <DialogFormWrapper 
          {...defaultProps} 
          mode="delete"
        />
      );
      
      const deleteButton = screen.getByRole('button', { name: /delete/i });
      expect(deleteButton).toHaveClass('rtp-button-destructive');
    });
  });

  describe('Custom Rendering', () => {
    it('uses custom footer when provided', () => {
      const customFooter = jest.fn(() => (
        <div data-testid="custom-footer">Custom Footer</div>
      ));
      
      render(
        <DialogFormWrapper 
          {...defaultProps} 
          renderFooter={customFooter}
        />
      );
      
      expect(screen.getByTestId('custom-footer')).toBeInTheDocument();
      expect(customFooter).toHaveBeenCalledWith(
        expect.objectContaining({
          submitting: false,
          submitLabel: 'Create',
          formState: expect.any(Object)
        })
      );
    });

    it('passes form context correctly to renderFields', () => {
      const renderFields = jest.fn(() => <div>Fields</div>);
      
      render(
        <DialogFormWrapper 
          {...defaultProps} 
          renderFields={renderFields}
        />
      );
      
      expect(renderFields).toHaveBeenCalledWith(
        expect.objectContaining({
          form: expect.any(Object),
          submitting: false,
          mode: 'create',
          formState: expect.any(Object),
          isReadOnly: false
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('displays external error prop', () => {
      render(
        <DialogFormWrapper 
          {...defaultProps} 
          error="External error message"
        />
      );
      
      expect(screen.getByText('External error message')).toBeInTheDocument();
    });

    it('displays Error object correctly', () => {
      const error = new Error('Test error');
      
      render(
        <DialogFormWrapper 
          {...defaultProps} 
          error={error}
        />
      );
      
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows loading overlay when loading prop is true', () => {
      render(
        <DialogFormWrapper 
          {...defaultProps} 
          loading={true}
        />
      );
      
      expect(screen.getByText('Loading form...')).toBeInTheDocument();
    });

    it('disables buttons during loading', () => {
      render(
        <DialogFormWrapper 
          {...defaultProps} 
          loading={true}
        />
      );
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      const submitButton = screen.getByRole('button', { name: /create/i });
      
      expect(cancelButton).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });
});

describe('AccessibleDialogFormWrapper', () => {
  const defaultProps = {
    open: true,
    schema: z.object({
      name: z.string().min(1),
      email: z.string().email()
    }),
    onSubmit: jest.fn(),
    renderFields: () => <div>Fields</div>
  };

  it('has proper ARIA attributes', () => {
    render(<AccessibleDialogFormWrapper {...defaultProps} />);
    
    const dialog = screen.getByRole('dialog');
    
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');
    expect(dialog).toHaveAttribute('aria-busy', 'false');
    expect(dialog).toHaveAttribute('tabindex', '-1');
  });

  it('has screen reader announcements', () => {
    render(<AccessibleDialogFormWrapper {...defaultProps} />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has proper heading structure', () => {
    render(
      <AccessibleDialogFormWrapper 
        {...defaultProps} 
        title="Test Dialog"
        description="Test description"
      />
    );
    
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Test Dialog');
    
    const description = screen.getByText('Test description');
    expect(description).toHaveAttribute('id');
  });

  it('has proper error announcements', () => {
    render(
      <AccessibleDialogFormWrapper 
        {...defaultProps} 
        error="Test error"
      />
    );
    
    const errorDiv = screen.getByRole('alert');
    expect(errorDiv).toHaveAttribute('aria-live', 'assertive');
    expect(errorDiv).toHaveTextContent('Test error');
  });
});
