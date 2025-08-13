/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { z } from 'zod';
import { useFormDialog } from '../hooks/useFormDialog';
import { useFormWithSchema } from '../hooks/useFormWithSchema';
import { ReactHookFormAdapter } from '../adapters/reactHookFormAdapter';

// Mock the adapter
jest.mock('../adapters/reactHookFormAdapter');

describe('useFormDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('initializes with correct default state', () => {
      const { result } = renderHook(() => useFormDialog());

      expect(result.current.dialogState).toEqual({
        open: false,
        mode: null,
        data: null,
        title: undefined,
        description: undefined,
        loading: false,
        error: null
      });
    });
  });

  describe('Dialog Operations', () => {
    it('opens create dialog with correct state', () => {
      const { result } = renderHook(() => useFormDialog());

      act(() => {
        result.current.openCreateDialog({ name: 'Test' }, { title: 'Custom Create' });
      });

      expect(result.current.dialogState).toEqual({
        open: true,
        mode: 'create',
        data: { name: 'Test' },
        title: 'Custom Create',
        description: 'Fill in the information below to create a new item.',
        loading: false,
        error: null
      });
    });

    it('opens edit dialog with data', () => {
      const { result } = renderHook(() => useFormDialog());
      const testData = { id: 1, name: 'Test User', email: 'test@example.com' };

      act(() => {
        result.current.openEditDialog(testData);
      });

      expect(result.current.dialogState).toEqual({
        open: true,
        mode: 'edit',
        data: testData,
        title: 'Edit',
        description: 'Update the information below to save your changes.',
        loading: false,
        error: null
      });
    });

    it('opens view dialog with readonly mode', () => {
      const { result } = renderHook(() => useFormDialog());
      const testData = { id: 1, name: 'Test User' };

      act(() => {
        result.current.openViewDialog(testData);
      });

      expect(result.current.dialogState).toEqual({
        open: true,
        mode: 'view',
        data: testData,
        title: 'View Details',
        description: 'View the details of this item.',
        loading: false,
        error: null
      });
    });

    it('opens delete dialog with confirmation', () => {
      const { result } = renderHook(() => useFormDialog());
      const testData = { id: 1, name: 'Test User' };

      act(() => {
        result.current.openDeleteDialog(testData);
      });

      expect(result.current.dialogState).toEqual({
        open: true,
        mode: 'delete',
        data: testData,
        title: 'Confirm Delete',
        description: 'Are you sure you want to delete this item? This action cannot be undone.',
        loading: false,
        error: null
      });
    });

    it('opens custom dialog with specified mode', () => {
      const { result } = renderHook(() => useFormDialog());
      const testData = { id: 1, name: 'Test' };

      act(() => {
        result.current.openCustomDialog('custom', testData, {
          title: 'Custom Action',
          description: 'Custom description'
        });
      });

      expect(result.current.dialogState).toEqual({
        open: true,
        mode: 'custom',
        data: testData,
        title: 'Custom Action',
        description: 'Custom description',
        loading: false,
        error: null
      });
    });

    it('closes dialog and resets state', () => {
      const { result } = renderHook(() => useFormDialog());

      // First open a dialog
      act(() => {
        result.current.openCreateDialog({ name: 'Test' });
      });

      expect(result.current.dialogState.open).toBe(true);

      // Close the dialog
      act(() => {
        result.current.closeDialog();
      });

      expect(result.current.dialogState.open).toBe(false);

      // Wait for cleanup timeout
      act(() => {
        jest.advanceTimersByTime(250);
      });

      expect(result.current.dialogState).toEqual({
        open: false,
        mode: null,
        data: null,
        title: undefined,
        description: undefined,
        loading: false,
        error: null
      });
    });
  });

  describe('State Management', () => {
    it('sets loading state', () => {
      const { result } = renderHook(() => useFormDialog());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.dialogState.loading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.dialogState.loading).toBe(false);
    });

    it('sets error state', () => {
      const { result } = renderHook(() => useFormDialog());

      act(() => {
        result.current.setError('Test error message');
      });

      expect(result.current.dialogState.error).toBe('Test error message');

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.dialogState.error).toBeNull();
    });
  });

  describe('Submit Handler', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('handles successful submission', async () => {
      const { result } = renderHook(() => useFormDialog());
      const mockOnSubmit = jest.fn().mockResolvedValue(true);

      // Open a dialog first
      act(() => {
        result.current.openCreateDialog({ name: 'Test' });
      });

      const submitHandler = result.current.handleSubmit(mockOnSubmit);
      const testData = { name: 'Test User', email: 'test@example.com' };

      await act(async () => {
        await submitHandler(testData);
      });

      expect(mockOnSubmit).toHaveBeenCalledWith(testData, 'create');
      expect(result.current.dialogState.open).toBe(false);
      expect(result.current.dialogState.loading).toBe(false);
      expect(result.current.dialogState.error).toBeNull();
    });

    it('handles submission failure', async () => {
      const { result } = renderHook(() => useFormDialog());
      const mockOnSubmit = jest.fn().mockResolvedValue(false);

      // Open a dialog first
      act(() => {
        result.current.openCreateDialog({ name: 'Test' });
      });

      const submitHandler = result.current.handleSubmit(mockOnSubmit);
      const testData = { name: 'Test User' };

      await act(async () => {
        await submitHandler(testData);
      });

      expect(mockOnSubmit).toHaveBeenCalledWith(testData, 'create');
      expect(result.current.dialogState.open).toBe(true); // Should remain open
      expect(result.current.dialogState.error).toBe('Operation failed. Please try again.');
    });

    it('handles submission error', async () => {
      const { result } = renderHook(() => useFormDialog());
      const error = new Error('Submission failed');
      const mockOnSubmit = jest.fn().mockRejectedValue(error);

      // Open a dialog first
      act(() => {
        result.current.openEditDialog({ id: 1, name: 'Test' });
      });

      const submitHandler = result.current.handleSubmit(mockOnSubmit);
      const testData = { id: 1, name: 'Updated Test' };

      await expect(
        act(async () => {
          await submitHandler(testData);
        })
      ).rejects.toThrow('Submission failed');

      expect(result.current.dialogState.error).toBe('Submission failed');
      expect(result.current.dialogState.loading).toBe(false);
    });

    it('sets loading state during submission', async () => {
      const { result } = renderHook(() => useFormDialog());
      let resolveSubmit: (value: boolean) => void;
      const mockOnSubmit = jest.fn().mockReturnValue(
        new Promise(resolve => {
          resolveSubmit = resolve;
        })
      );

      // Open dialog
      act(() => {
        result.current.openCreateDialog();
      });

      const submitHandler = result.current.handleSubmit(mockOnSubmit);

      // Start submission
      const submitPromise = act(async () => {
        await submitHandler({ name: 'Test' });
      });

      // Should be loading
      expect(result.current.dialogState.loading).toBe(true);

      // Complete submission
      act(() => {
        resolveSubmit(true);
      });

      await submitPromise;

      expect(result.current.dialogState.loading).toBe(false);
    });

    it('throws error when no dialog mode is set', async () => {
      const { result } = renderHook(() => useFormDialog());
      const mockOnSubmit = jest.fn();

      const submitHandler = result.current.handleSubmit(mockOnSubmit);

      await expect(
        act(async () => {
          await submitHandler({ name: 'Test' });
        })
      ).rejects.toThrow('No dialog mode set');
    });
  });

  describe('TypedFormDialog', () => {
    it('returns enhanced dialog with schema binding', () => {
      const { useTypedFormDialog } = require('../hooks/useFormDialog');
      const schema = z.object({
        name: z.string(),
        email: z.string().email()
      });

      const { result } = renderHook(() => 
        useTypedFormDialog(schema, 'edit')
      );

      expect(result.current).toHaveProperty('schema', schema);
      expect(result.current).toHaveProperty('defaultMode', 'edit');
      expect(result.current).toHaveProperty('openCreate');
      expect(result.current).toHaveProperty('openEdit');
      expect(result.current).toHaveProperty('openView');
      expect(result.current).toHaveProperty('openDelete');

      // Test type-safe operations
      const testData = { name: 'Test', email: 'test@example.com' };

      act(() => {
        result.current.openCreate({ name: 'New' });
        result.current.openEdit(testData);
        result.current.openView(testData);
        result.current.openDelete(testData);
      });

      expect(result.current.dialogState.mode).toBe('delete');
      expect(result.current.dialogState.data).toEqual(testData);
    });
  });
});

describe('useFormWithSchema', () => {
  const testSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    age: z.number().min(18)
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the adapter
    (ReactHookFormAdapter as jest.Mock).mockImplementation(() => ({
      useCreate: jest.fn().mockReturnValue({
        Provider: jest.fn(({ children }) => children),
        api: {
          getValues: jest.fn(() => ({})),
          setValues: jest.fn(),
          reset: jest.fn(),
          validate: jest.fn(),
          getValidatedValues: jest.fn(),
          setError: jest.fn(),
          setErrors: jest.fn(),
          clearErrors: jest.fn(),
          getErrors: jest.fn(() => ({})),
          isDirty: jest.fn(() => false),
          isValid: jest.fn(() => true),
          isSubmitting: jest.fn(() => false),
          watch: jest.fn(),
          subscribe: jest.fn(),
          getRawForm: jest.fn(() => ({
            trigger: jest.fn(),
            setValue: jest.fn(),
            getValues: jest.fn()
          }))
        },
        handleSubmit: jest.fn(),
        setError: jest.fn(),
        setErrors: jest.fn(),
        clearErrors: jest.fn(),
        reset: jest.fn(),
        getValues: jest.fn(),
        setValues: jest.fn(),
        trigger: jest.fn(),
        formState: {
          isDirty: false,
          isValid: true,
          isSubmitting: false,
          isLoading: false,
          submitCount: 0,
          errors: {},
          touchedFields: {},
          dirtyFields: {},
          isSubmitted: false,
          isSubmitSuccessful: false,
          isValidating: false
        },
        watch: jest.fn(),
        subscribe: jest.fn()
      })
    }));
  });

  it('creates form with schema and configuration', () => {
    const { result } = renderHook(() =>
      useFormWithSchema({
        schema: testSchema,
        defaultValues: { name: 'Test', email: 'test@example.com', age: 25 },
        mode: 'edit',
        validationMode: 'onBlur'
      })
    );

    expect(result.current).toHaveProperty('schema', testSchema);
    expect(result.current).toHaveProperty('FormData');
    expect(result.current).toHaveProperty('validateFields');
    expect(result.current).toHaveProperty('setFieldValue');
    expect(result.current).toHaveProperty('getFieldValue');
    expect(result.current).toHaveProperty('watchFields');
    expect(result.current).toHaveProperty('submitWithCallback');
  });

  it('validates specific fields', async () => {
    const { result } = renderHook(() =>
      useFormWithSchema({
        schema: testSchema,
        defaultValues: { name: 'Test', email: 'test@example.com', age: 25 }
      })
    );

    result.current.trigger = jest.fn().mockResolvedValue(true);

    const isValid = await result.current.validateFields(['name', 'email']);

    expect(result.current.trigger).toHaveBeenCalledWith(['name', 'email']);
    expect(isValid).toBe(true);
  });

  it('sets field value with type safety', () => {
    const { result } = renderHook(() =>
      useFormWithSchema({
        schema: testSchema,
        defaultValues: { name: '', email: '', age: 18 }
      })
    );

    act(() => {
      result.current.setFieldValue('name', 'New Name');
    });

    expect(result.current.setValues).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New Name'
      })
    );
  });

  it('gets field value with type safety', () => {
    const { result } = renderHook(() =>
      useFormWithSchema({
        schema: testSchema,
        defaultValues: { name: 'Test Name', email: 'test@example.com', age: 25 }
      })
    );

    result.current.getValues = jest.fn().mockReturnValue({
      name: 'Test Name',
      email: 'test@example.com',
      age: 25
    });

    const name = result.current.getFieldValue('name');

    expect(result.current.getValues).toHaveBeenCalled();
  });

  it('watches specific fields', () => {
    const { result } = renderHook(() =>
      useFormWithSchema({
        schema: testSchema,
        defaultValues: { name: '', email: '', age: 18 }
      })
    );

    result.current.watch = jest.fn().mockReturnValue(['Test', 'test@example.com']);

    const watchedValues = result.current.watchFields(['name', 'email']);

    expect(result.current.watch).toHaveBeenCalledWith(['name', 'email']);
  });

  it('creates submit handler with callback', () => {
    const { result } = renderHook(() =>
      useFormWithSchema({
        schema: testSchema
      })
    );

    const mockCallback = jest.fn();
    result.current.handleSubmit = jest.fn().mockReturnValue(jest.fn());

    const submitHandler = result.current.submitWithCallback(mockCallback);

    expect(result.current.handleSubmit).toHaveBeenCalledWith(mockCallback);
    expect(typeof submitHandler).toBe('function');
  });

  describe('Factory Functions', () => {
    it('createFormHook creates reusable form hook', () => {
      const { createFormHook } = require('../hooks/useFormWithSchema');
      
      const useUserForm = createFormHook(testSchema);

      const { result } = renderHook(() =>
        useUserForm({
          mode: 'create',
          defaultValues: { name: 'Default' }
        })
      );

      expect(result.current).toHaveProperty('schema', testSchema);
    });

    it('createDefaultValues ensures type safety', () => {
      const { createDefaultValues } = require('../hooks/useFormWithSchema');
      
      const defaultValues = createDefaultValues(testSchema, {
        name: 'Test',
        email: 'test@example.com'
      });

      expect(defaultValues).toEqual({
        name: 'Test',
        email: 'test@example.com'
      });
    });

    it('createAsyncDefaultValues creates async loader', async () => {
      const { createAsyncDefaultValues } = require('../hooks/useFormWithSchema');
      
      const asyncLoader = createAsyncDefaultValues(
        testSchema,
        async () => ({
          name: 'Async Name',
          email: 'async@example.com',
          age: 30
        })
      );

      const values = await asyncLoader();

      expect(values).toEqual({
        name: 'Async Name',
        email: 'async@example.com',
        age: 30
      });
    });
  });

  describe('Conditional Schema', () => {
    it('useConditionalFormWithSchema updates schema based on dependencies', () => {
      const { useConditionalFormWithSchema } = require('../hooks/useFormWithSchema');
      
      let includeAge = true;

      const { result, rerender } = renderHook(() =>
        useConditionalFormWithSchema(
          () => includeAge 
            ? z.object({ name: z.string(), age: z.number() })
            : z.object({ name: z.string() }),
          { defaultValues: { name: 'Test' } },
          [includeAge]
        )
      );

      const initialSchema = result.current.schema;

      // Change dependency
      includeAge = false;
      rerender();

      // Schema should update
      expect(result.current.schema).not.toBe(initialSchema);
    });
  });
});
