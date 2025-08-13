import React from 'react';
import { z } from 'zod';

/**
 * Dialog form modes supported by the system
 */
export type DialogFormMode = 'create' | 'edit' | 'view' | 'delete';

/**
 * Form submission state
 */
export interface FormSubmissionState {
  isSubmitting: boolean;
  submitError?: string;
  submitCount: number;
}

/**
 * Form adapter interface to standardize interactions with different form libraries
 * This provides a consistent API that can work with React Hook Form, Formik, Final Form, etc.
 */
export interface FormAdapter<TData = any> {
  /**
   * Create a form provider and its associated API methods
   * This is the main entry point for creating a form with any library
   */
  useCreate<TSchemaInput = TData>(params: {
    schema?: any; // Zod, Yup, Joi, etc.
    defaultValues?: Partial<TSchemaInput> | (() => Promise<Partial<TSchemaInput>>);
    mode?: DialogFormMode;
    validationMode?: 'onSubmit' | 'onBlur' | 'onChange' | 'onTouched' | 'all';
    reValidateMode?: 'onSubmit' | 'onBlur' | 'onChange';
    criteriaMode?: 'firstError' | 'all';
    shouldFocusError?: boolean;
    shouldUnregister?: boolean;
  }): FormAdapterResult<TSchemaInput>;
}

/**
 * Result of using a form adapter
 */
export interface FormAdapterResult<TData = any> {
  /**
   * React provider component that wraps the form
   */
  Provider: React.ComponentType<{ children: React.ReactNode }>;
  
  /**
   * Form API object - typed according to the adapter
   */
  api: FormAPI<TData>;
  
  /**
   * Handle form submission with validation
   */
  handleSubmit: (onValid: (values: TData) => Promise<void> | void) => (e?: React.FormEvent) => Promise<void>;
  
  /**
   * Set a field-level error
   */
  setError: (path: string, message: string) => void;
  
  /**
   * Set multiple field errors at once
   */
  setErrors: (errors: Record<string, string>) => void;
  
  /**
   * Clear all errors
   */
  clearErrors: () => void;
  
  /**
   * Reset form to initial or provided values
   */
  reset: (values?: Partial<TData>) => void;
  
  /**
   * Get current form values
   */
  getValues: () => TData;
  
  /**
   * Set form values programmatically
   */
  setValues: (values: Partial<TData>) => void;
  
  /**
   * Trigger validation manually
   */
  trigger: (fieldNames?: string | string[]) => Promise<boolean>;
  
  /**
   * Current form state
   */
  formState: FormState;
  
  /**
   * Watch form values for changes
   */
  watch: (fieldNames?: string | string[]) => any;
  
  /**
   * Subscribe to form state changes
   */
  subscribe: (callback: (state: FormState) => void) => () => void;
}

/**
 * Generic form API that adapters must implement
 */
export interface FormAPI<TData = any> {
  /**
   * Get form values without validation
   */
  getValues: () => TData;
  
  /**
   * Get validated form values (throws if validation fails)
   */
  getValidatedValues: () => Promise<TData>;
  
  /**
   * Set form values
   */
  setValues: (values: Partial<TData>) => void;
  
  /**
   * Reset form to initial or new values
   */
  reset: (values?: Partial<TData>) => void;
  
  /**
   * Trigger validation
   */
  validate: (fieldNames?: string | string[]) => Promise<boolean>;
  
  /**
   * Submit form programmatically
   */
  submit: () => Promise<boolean>;
  
  /**
   * Set field error
   */
  setError: (path: string, message: string) => void;
  
  /**
   * Set multiple errors
   */
  setErrors: (errors: Record<string, string>) => void;
  
  /**
   * Clear all errors
   */
  clearErrors: () => void;
  
  /**
   * Get current errors
   */
  getErrors: () => Record<string, any>;
  
  /**
   * Check if form is dirty
   */
  isDirty: () => boolean;
  
  /**
   * Check if form is valid
   */
  isValid: () => boolean;
  
  /**
   * Check if form is submitting
   */
  isSubmitting: () => boolean;
  
  /**
   * Watch specific fields
   */
  watch: (fieldNames?: string | string[]) => any;
  
  /**
   * Subscribe to form changes
   */
  subscribe: (callback: (state: FormState) => void) => () => void;
}

/**
 * Form state interface
 */
export interface FormState {
  isDirty: boolean;
  isValid: boolean;
  isSubmitting: boolean;
  isLoading: boolean;
  submitCount: number;
  errors: Record<string, any>;
  touchedFields: Record<string, boolean>;
  dirtyFields: Record<string, boolean>;
  isSubmitted: boolean;
  isSubmitSuccessful: boolean;
  isValidating: boolean;
}

/**
 * Context for form rendering
 */
export interface FormRenderContext<TData = any> {
  /**
   * Form instance from the adapter
   */
  form: FormAPI<TData>;
  
  /**
   * Current form submission state
   */
  submitting: boolean;
  
  /**
   * Form-level submit error
   */
  submitError?: string;
  
  /**
   * Current dialog mode
   */
  mode: DialogFormMode;
  
  /**
   * Form state
   */
  formState: FormState;
  
  /**
   * Whether the form is in read-only mode
   */
  isReadOnly: boolean;
}

/**
 * Props for DialogFormWrapper component
 */
export interface DialogFormProps<TSchemaInput = any, TOutput = TSchemaInput> {
  /**
   * Dialog mode
   */
  mode?: DialogFormMode;
  
  /**
   * Dialog title
   */
  title?: string;
  
  /**
   * Dialog description
   */
  description?: string;
  
  /**
   * Validation schema (Zod, Yup, etc.)
   */
  schema: z.ZodType<TSchemaInput, any, any> | any;
  
  /**
   * Initial form values - can be async for loading from server
   */
  defaultValues?: Partial<TSchemaInput> | (() => Promise<Partial<TSchemaInput>>);
  
  /**
   * Form submission handler
   */
  onSubmit: (values: TOutput) => Promise<void> | void;
  
  /**
   * Dialog open/close handler
   */
  onOpenChange?: (open: boolean) => void;
  
  /**
   * Render function for form fields
   */
  renderFields: (context: FormRenderContext<TSchemaInput>) => React.ReactNode;
  
  /**
   * Optional custom footer render function
   */
  renderFooter?: (context: {
    submitting: boolean;
    submitLabel?: string;
    onSubmit: () => Promise<void>;
    onCancel: () => void;
    formState: FormState;
  }) => React.ReactNode;
  
  /**
   * Submit button label
   */
  submitLabel?: string;
  
  /**
   * Whether to reset form on close
   */
  resetOnClose?: boolean;
  
  /**
   * Form adapter to use (defaults to React Hook Form)
   */
  formAdapter?: FormAdapter<TSchemaInput>;
  
  /**
   * Whether dialog is open
   */
  open?: boolean;
  
  /**
   * Validation mode
   */
  validationMode?: 'onSubmit' | 'onBlur' | 'onChange' | 'onTouched' | 'all';
  
  /**
   * Re-validation mode
   */
  reValidateMode?: 'onSubmit' | 'onBlur' | 'onChange';
  
  /**
   * Whether to focus first error on validation failure
   */
  shouldFocusError?: boolean;
  
  /**
   * Additional form props
   */
  formProps?: Record<string, any>;
  
  /**
   * Whether form is disabled
   */
  disabled?: boolean;
  
  /**
   * Loading state
   */
  loading?: boolean;
  
  /**
   * Error state
   */
  error?: string | Error | null;
  
  /**
   * Dialog width
   */
  width?: string | number;
  
  /**
   * Dialog max width
   */
  maxWidth?: string | number;
  
  /**
   * Close on click outside
   */
  closeOnClickOutside?: boolean;
  
  /**
   * Close on ESC key
   */
  closeOnEsc?: boolean;
  
  /**
   * Custom CSS class
   */
  className?: string;
}

/**
 * Form validation error structure
 */
export interface FormValidationError {
  field: string;
  message: string;
  code?: string;
  value?: any;
}

/**
 * Form submission result
 */
export interface FormSubmissionResult<TData = any> {
  success: boolean;
  data?: TData;
  errors?: FormValidationError[];
  message?: string;
}

/**
 * Event handlers for form lifecycle
 */
export interface FormEventHandlers<TData = any> {
  onSubmit?: (data: TData) => Promise<FormSubmissionResult<TData>> | FormSubmissionResult<TData>;
  onReset?: () => void;
  onValidate?: (data: TData) => Promise<boolean> | boolean;
  onChange?: (data: Partial<TData>) => void;
  onError?: (errors: FormValidationError[]) => void;
}

/**
 * Form configuration options
 */
export interface FormConfig {
  validateOnMount?: boolean;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
  focusFirstErrorOnSubmit?: boolean;
  scrollToErrorOnSubmit?: boolean;
  clearErrorsOnSubmit?: boolean;
  resetOnSuccessfulSubmit?: boolean;
}
