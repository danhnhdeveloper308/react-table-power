/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { z } from 'zod';
import { ReactHookFormAdapter } from '../adapters/reactHookFormAdapter';

// Mock React Hook Form
jest.mock('react-hook-form', () => ({
  useForm: jest.fn(() => ({
    register: jest.fn(),
    handleSubmit: jest.fn(),
    formState: {
      errors: {},
      isDirty: false,
      isValid: true,
      isSubmitting: false,
      submitCount: 0,
      touchedFields: {},
      dirtyFields: {},
      isSubmitted: false,
      isSubmitSuccessful: false,
      isValidating: false
    },
    getValues: jest.fn(() => ({})),
    setValue: jest.fn(),
    reset: jest.fn(),
    trigger: jest.fn(() => Promise.resolve(true)),
    setError: jest.fn(),
    clearErrors: jest.fn(),
    watch: jest.fn()
  })),
  FormProvider: ({ children }: any) => children
}));

jest.mock('@hookform/resolvers/zod', () => ({
  zodResolver: jest.fn()
}));

describe('ReactHookFormAdapter', () => {
  const testSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    age: z.number().min(18, 'Must be at least 18')
  });

  let adapter: ReactHookFormAdapter;

  beforeEach(() => {
    adapter = new ReactHookFormAdapter();
    jest.clearAllMocks();
  });

  describe('useCreate', () => {
    it('creates form adapter result with required properties', () => {
      const { result } = renderHook(() =>
        adapter.useCreate({
          schema: testSchema,
          defaultValues: { name: '', email: '', age: 18 },
          mode: 'create'
        })
      );

      expect(result.current).toHaveProperty('Provider');
      expect(result.current).toHaveProperty('api');
      expect(result.current).toHaveProperty('handleSubmit');
      expect(result.current).toHaveProperty('setError');
      expect(result.current).toHaveProperty('setErrors');
      expect(result.current).toHaveProperty('clearErrors');
      expect(result.current).toHaveProperty('reset');
      expect(result.current).toHaveProperty('getValues');
      expect(result.current).toHaveProperty('setValues');
      expect(result.current).toHaveProperty('trigger');
      expect(result.current).toHaveProperty('formState');
      expect(result.current).toHaveProperty('watch');
      expect(result.current).toHaveProperty('subscribe');
    });

    it('handles async default values', async () => {
      const asyncDefaultValues = () => Promise.resolve({
        name: 'John',
        email: 'john@example.com',
        age: 25
      });

      const { result } = renderHook(() =>
        adapter.useCreate({
          schema: testSchema,
          defaultValues: asyncDefaultValues,
          mode: 'create'
        })
      );

      // Initially form state should show loading
      expect(result.current.formState.isLoading).toBe(true);

      // Wait for async values to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.formState.isLoaded).toBe(true);
    });

    it('creates form with different validation modes', () => {
      const validationModes = ['onSubmit', 'onBlur', 'onChange', 'onTouched', 'all'] as const;

      validationModes.forEach(mode => {
        const { result } = renderHook(() =>
          adapter.useCreate({
            schema: testSchema,
            validationMode: mode
          })
        );

        expect(result.current).toBeDefined();
        expect(result.current.api).toBeDefined();
      });
    });

    it('handles form configuration options', () => {
      const { result } = renderHook(() =>
        adapter.useCreate({
          schema: testSchema,
          validationMode: 'onSubmit',
          reValidateMode: 'onChange',
          criteriaMode: 'all',
          shouldFocusError: true,
          shouldUnregister: false
        })
      );

      expect(result.current).toBeDefined();
    });
  });

  describe('ReactHookFormAPI', () => {
    let formResult: any;

    beforeEach(() => {
      const { result } = renderHook(() =>
        adapter.useCreate({
          schema: testSchema,
          defaultValues: { name: 'Test', email: 'test@example.com', age: 25 }
        })
      );
      formResult = result.current;
    });

    describe('getValues', () => {
      it('returns current form values', () => {
        const values = formResult.api.getValues();
        expect(values).toBeDefined();
        expect(typeof values).toBe('object');
      });
    });

    describe('setValues', () => {
      it('sets form values', () => {
        const newValues = {
          name: 'New Name',
          email: 'new@example.com',
          age: 30
        };

        act(() => {
          formResult.api.setValues(newValues);
        });

        // Verify setValue was called for each field
        expect(formResult.api.getRawForm().setValue).toHaveBeenCalled();
      });
    });

    describe('validate', () => {
      it('validates all fields when no field names provided', async () => {
        const isValid = await formResult.api.validate();
        
        expect(formResult.api.getRawForm().trigger).toHaveBeenCalledWith();
        expect(typeof isValid).toBe('boolean');
      });

      it('validates specific fields when field names provided', async () => {
        const fieldNames = ['name', 'email'];
        
        await formResult.api.validate(fieldNames);
        
        expect(formResult.api.getRawForm().trigger).toHaveBeenCalledWith(fieldNames);
      });
    });

    describe('getValidatedValues', () => {
      it('returns validated values when form is valid', async () => {
        // Mock successful validation
        formResult.api.getRawForm().trigger.mockResolvedValue(true);
        formResult.api.getRawForm().getValues.mockReturnValue({
          name: 'John',
          email: 'john@example.com',
          age: 25
        });

        const values = await formResult.api.getValidatedValues();
        
        expect(values).toEqual({
          name: 'John',
          email: 'john@example.com',
          age: 25
        });
      });

      it('throws error when form validation fails', async () => {
        // Mock failed validation
        formResult.api.getRawForm().trigger.mockResolvedValue(false);
        formResult.api.getRawForm().formState = {
          ...formResult.api.getRawForm().formState,
          errors: {
            name: { message: 'Name is required' },
            email: { message: 'Invalid email' }
          }
        };

        await expect(formResult.api.getValidatedValues()).rejects.toMatchObject({
          name: 'ValidationError',
          errors: expect.any(Array)
        });
      });
    });

    describe('setError', () => {
      it('sets field error', () => {
        act(() => {
          formResult.api.setError('name', 'Custom error message');
        });

        expect(formResult.api.getRawForm().setError).toHaveBeenCalledWith(
          'name',
          {
            type: 'manual',
            message: 'Custom error message'
          }
        );
      });
    });

    describe('setErrors', () => {
      it('sets multiple field errors', () => {
        const errors = {
          name: 'Name error',
          email: 'Email error'
        };

        act(() => {
          formResult.api.setErrors(errors);
        });

        expect(formResult.api.getRawForm().setError).toHaveBeenCalledTimes(2);
        expect(formResult.api.getRawForm().setError).toHaveBeenCalledWith(
          'name',
          { type: 'manual', message: 'Name error' }
        );
        expect(formResult.api.getRawForm().setError).toHaveBeenCalledWith(
          'email',
          { type: 'manual', message: 'Email error' }
        );
      });
    });

    describe('clearErrors', () => {
      it('clears all form errors', () => {
        act(() => {
          formResult.api.clearErrors();
        });

        expect(formResult.api.getRawForm().clearErrors).toHaveBeenCalled();
      });
    });

    describe('reset', () => {
      it('resets form to default values', () => {
        act(() => {
          formResult.api.reset();
        });

        expect(formResult.api.getRawForm().reset).toHaveBeenCalled();
      });

      it('resets form to provided values', () => {
        const newValues = { name: 'Reset Name', email: 'reset@example.com', age: 20 };

        act(() => {
          formResult.api.reset(newValues);
        });

        expect(formResult.api.getRawForm().reset).toHaveBeenCalledWith(newValues);
      });
    });

    describe('state getters', () => {
      it('returns correct dirty state', () => {
        expect(typeof formResult.api.isDirty()).toBe('boolean');
      });

      it('returns correct valid state', () => {
        expect(typeof formResult.api.isValid()).toBe('boolean');
      });

      it('returns correct submitting state', () => {
        expect(typeof formResult.api.isSubmitting()).toBe('boolean');
      });

      it('returns current errors', () => {
        const errors = formResult.api.getErrors();
        expect(typeof errors).toBe('object');
      });
    });

    describe('watch', () => {
      it('watches all fields when no field names provided', () => {
        formResult.api.watch();
        
        expect(formResult.api.getRawForm().watch).toHaveBeenCalledWith();
      });

      it('watches specific fields when field names provided', () => {
        const fieldNames = ['name', 'email'];
        
        formResult.api.watch(fieldNames);
        
        expect(formResult.api.getRawForm().watch).toHaveBeenCalledWith(fieldNames);
      });
    });
  });

  describe('handleSubmit', () => {
    it('creates submit handler that calls onValid with form data', async () => {
      const { result } = renderHook(() =>
        adapter.useCreate({
          schema: testSchema,
          defaultValues: { name: 'John', email: 'john@example.com', age: 25 }
        })
      );

      const onValid = jest.fn();
      const submitHandler = result.current.handleSubmit(onValid);

      // Mock form data
      const formData = { name: 'John', email: 'john@example.com', age: 25 };
      
      await act(async () => {
        await submitHandler(formData);
      });

      expect(onValid).toHaveBeenCalledWith(formData);
    });

    it('handles server errors in submit handler', async () => {
      const { result } = renderHook(() =>
        adapter.useCreate({
          schema: testSchema
        })
      );

      const serverError = {
        errors: {
          email: 'Email already exists'
        }
      };

      const onValid = jest.fn().mockRejectedValue(serverError);
      const submitHandler = result.current.handleSubmit(onValid);

      const formData = { name: 'John', email: 'john@example.com', age: 25 };

      await expect(
        act(async () => {
          await submitHandler(formData);
        })
      ).rejects.toEqual(serverError);

      // Should set server errors on form
      expect(result.current.api.getRawForm().setError).toHaveBeenCalledWith(
        'email',
        { type: 'server', message: 'Email already exists' }
      );
    });
  });

  describe('Form State', () => {
    it('provides comprehensive form state', () => {
      const { result } = renderHook(() =>
        adapter.useCreate({
          schema: testSchema
        })
      );

      const formState = result.current.formState;

      expect(formState).toHaveProperty('isDirty');
      expect(formState).toHaveProperty('isValid');
      expect(formState).toHaveProperty('isSubmitting');
      expect(formState).toHaveProperty('isLoading');
      expect(formState).toHaveProperty('submitCount');
      expect(formState).toHaveProperty('errors');
      expect(formState).toHaveProperty('touchedFields');
      expect(formState).toHaveProperty('dirtyFields');
      expect(formState).toHaveProperty('isSubmitted');
      expect(formState).toHaveProperty('isSubmitSuccessful');
      expect(formState).toHaveProperty('isValidating');
      expect(formState).toHaveProperty('isLoaded');
      expect(formState).toHaveProperty('disabled');
    });

    it('updates loading state correctly', async () => {
      const asyncDefaultValues = () => 
        new Promise(resolve => 
          setTimeout(() => resolve({ name: 'Test' }), 100)
        );

      const { result } = renderHook(() =>
        adapter.useCreate({
          schema: testSchema,
          defaultValues: asyncDefaultValues
        })
      );

      // Initially should be loading
      expect(result.current.formState.isLoading).toBe(true);
      expect(result.current.formState.isLoaded).toBe(false);

      // Wait for loading to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      expect(result.current.formState.isLoading).toBe(false);
      expect(result.current.formState.isLoaded).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('handles Zod validation errors correctly', async () => {
      const { result } = renderHook(() =>
        adapter.useCreate({
          schema: testSchema
        })
      );

      // Mock validation failure
      result.current.api.getRawForm().trigger.mockResolvedValue(false);
      result.current.api.getRawForm().formState.errors = {
        name: { message: 'Name is required', type: 'required' },
        email: { message: 'Invalid email', type: 'pattern' }
      };

      try {
        await result.current.api.getValidatedValues();
      } catch (error: any) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors).toEqual([
          { field: 'name', message: 'Name is required', code: 'required', value: undefined },
          { field: 'email', message: 'Invalid email', code: 'pattern', value: undefined }
        ]);
      }
    });
  });

  describe('Provider Component', () => {
    it('creates a valid React component', () => {
      const { result } = renderHook(() =>
        adapter.useCreate({
          schema: testSchema
        })
      );

      const Provider = result.current.Provider;
      
      expect(typeof Provider).toBe('function');
      expect(Provider.name).toBe('Provider');
    });
  });
});

describe('Form Adapter Factory Functions', () => {
  describe('createReactHookFormAdapter', () => {
    it('creates a new adapter instance', () => {
      const { createReactHookFormAdapter } = require('../adapters/reactHookFormAdapter');
      
      const adapter = createReactHookFormAdapter();
      
      expect(adapter).toBeInstanceOf(ReactHookFormAdapter);
    });
  });

  describe('useRHFWithZod', () => {
    it('creates form with schema and default values', () => {
      const { useRHFWithZod } = require('../adapters/reactHookFormAdapter');
      
      const schema = z.object({
        name: z.string(),
        age: z.number()
      });

      const { result } = renderHook(() =>
        useRHFWithZod(schema, { name: 'Test', age: 25 })
      );

      expect(result.current).toHaveProperty('Provider');
      expect(result.current).toHaveProperty('api');
      expect(result.current).toHaveProperty('handleSubmit');
    });
  });

  describe('createTypedRHFAdapter', () => {
    it('creates typed adapter with schema inference', () => {
      const { createTypedRHFAdapter } = require('../adapters/reactHookFormAdapter');
      
      const schema = z.object({
        name: z.string(),
        email: z.string().email(),
        age: z.number()
      });

      const typedAdapter = createTypedRHFAdapter(schema);
      
      expect(typedAdapter).toHaveProperty('create');
      expect(typeof typedAdapter.create).toBe('function');

      const { result } = renderHook(() =>
        typedAdapter.create({ name: 'Test' })
      );

      expect(result.current).toHaveProperty('Provider');
      expect(result.current).toHaveProperty('api');
    });
  });
});
