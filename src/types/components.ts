import React from 'react';
import { z } from 'zod';
import { 
  DialogFormMode, 
  FormState, 
  FormAPI,
  FormRenderContext 
} from './forms';
import { 
  SchemaFormData, 
  DeepPartial, 
  TypedFormAPI,
  FieldPath,
  FieldValue 
} from './advanced';

/**
 * Base component props
 */
export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  'data-testid'?: string;
}

/**
 * Loading state props
 */
export interface LoadingProps {
  loading?: boolean;
  loadingText?: string;
  loadingComponent?: React.ComponentType<any>;
}

/**
 * Error state props
 */
export interface ErrorProps {
  error?: string | Error | null;
  errorComponent?: React.ComponentType<{ error: string | Error | null }>;
  onErrorRetry?: () => void;
}

/**
 * Dialog size variants
 */
export type DialogSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * Dialog animation variants
 */
export type DialogAnimation = 'fade' | 'slide' | 'scale' | 'none';

/**
 * Dialog placement options
 */
export type DialogPlacement = 'center' | 'top' | 'bottom' | 'left' | 'right';

/**
 * Base dialog props
 */
export interface BaseDialogProps extends BaseComponentProps, LoadingProps, ErrorProps {
  open?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  title?: string;
  description?: string;
  size?: DialogSize;
  animation?: DialogAnimation;
  placement?: DialogPlacement;
  closeOnClickOutside?: boolean;
  closeOnEsc?: boolean;
  focusTrap?: boolean;
  restoreFocus?: boolean;
  preventBodyScroll?: boolean;
  zIndex?: number;
}

/**
 * Form field base props
 */
export interface BaseFieldProps<T = any> extends BaseComponentProps {
  name: string;
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  label?: string;
  placeholder?: string;
  description?: string;
  error?: string;
  touched?: boolean;
  dirty?: boolean;
}

/**
 * Input field props
 */
export interface InputFieldProps extends BaseFieldProps<string> {
  type?: 'text' | 'email' | 'password' | 'url' | 'tel' | 'search';
  autoComplete?: string;
  autoFocus?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Textarea field props
 */
export interface TextareaFieldProps extends BaseFieldProps<string> {
  rows?: number;
  cols?: number;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  autoResize?: boolean;
}

/**
 * Select option type
 */
export interface SelectOption<T = any> {
  label: string;
  value: T;
  disabled?: boolean;
  description?: string;
  icon?: React.ReactNode;
}

/**
 * Select field props
 */
export interface SelectFieldProps<T = any> extends BaseFieldProps<T> {
  options: SelectOption<T>[];
  multiple?: boolean;
  searchable?: boolean;
  creatable?: boolean;
  clearable?: boolean;
  loading?: boolean;
  onSearch?: (query: string) => void;
  onCreateOption?: (inputValue: string) => SelectOption<T>;
  noOptionsMessage?: string;
  loadingMessage?: string;
}

/**
 * Checkbox field props
 */
export interface CheckboxFieldProps extends BaseFieldProps<boolean> {
  indeterminate?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Radio group option
 */
export interface RadioOption<T = any> {
  label: string;
  value: T;
  disabled?: boolean;
  description?: string;
}

/**
 * Radio group field props
 */
export interface RadioGroupFieldProps<T = any> extends BaseFieldProps<T> {
  options: RadioOption<T>[];
  orientation?: 'horizontal' | 'vertical';
}

/**
 * File upload field props
 */
export interface FileUploadFieldProps extends BaseFieldProps<File | File[]> {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
  onDrop?: (files: File[]) => void;
  onReject?: (rejectedFiles: File[]) => void;
  preview?: boolean;
}

/**
 * Date picker field props
 */
export interface DatePickerFieldProps extends BaseFieldProps<Date> {
  format?: string;
  minDate?: Date;
  maxDate?: Date;
  showTime?: boolean;
  timeFormat?: string;
  locale?: string;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * Number input field props
 */
export interface NumberFieldProps extends BaseFieldProps<number> {
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  format?: 'number' | 'currency' | 'percentage';
  currency?: string;
  locale?: string;
}

/**
 * Form field component type
 */
export type FormFieldComponent<T = any> = React.ComponentType<BaseFieldProps<T>>;

/**
 * Field registry for different field types
 */
export interface FieldRegistry {
  input: React.ComponentType<InputFieldProps>;
  textarea: React.ComponentType<TextareaFieldProps>;
  select: React.ComponentType<SelectFieldProps>;
  checkbox: React.ComponentType<CheckboxFieldProps>;
  radio: React.ComponentType<RadioGroupFieldProps>;
  file: React.ComponentType<FileUploadFieldProps>;
  date: React.ComponentType<DatePickerFieldProps>;
  number: React.ComponentType<NumberFieldProps>;
  [key: string]: React.ComponentType<any>;
}

/**
 * Form layout props
 */
export interface FormLayoutProps extends BaseComponentProps {
  orientation?: 'vertical' | 'horizontal';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  columns?: number | { xs?: number; sm?: number; md?: number; lg?: number };
}

/**
 * Form section props
 */
export interface FormSectionProps extends BaseComponentProps {
  title?: string;
  description?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
}

/**
 * Form group props
 */
export interface FormGroupProps extends BaseComponentProps {
  label?: string;
  description?: string;
  required?: boolean;
  error?: string;
  orientation?: 'vertical' | 'horizontal';
}

/**
 * Form actions props
 */
export interface FormActionsProps extends BaseComponentProps {
  alignment?: 'left' | 'center' | 'right' | 'between';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  sticky?: boolean;
}

/**
 * Button variants and sizes
 */
export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'tertiary' 
  | 'destructive' 
  | 'ghost' 
  | 'link';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Button props
 */
export interface ButtonProps extends BaseComponentProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * Form component with schema inference
 */
export interface TypedFormComponentProps<TSchema extends z.ZodType<any, any, any>> 
  extends BaseComponentProps {
  schema: TSchema;
  data?: DeepPartial<SchemaFormData<TSchema>>;
  mode?: DialogFormMode;
  onSubmit?: (data: SchemaFormData<TSchema>) => Promise<void> | void;
  onChange?: (data: DeepPartial<SchemaFormData<TSchema>>) => void;
  disabled?: boolean;
  readOnly?: boolean;
  fieldRegistry?: Partial<FieldRegistry>;
  layout?: FormLayoutProps;
}

/**
 * Dialog form component props
 */
export interface DialogFormComponentProps<TSchema extends z.ZodType<any, any, any> = any>
  extends BaseDialogProps {
  schema: TSchema;
  mode?: DialogFormMode;
  data?: DeepPartial<SchemaFormData<TSchema>>;
  onSubmit?: (data: SchemaFormData<TSchema>) => Promise<void> | void;
  renderForm?: (context: FormRenderContext<SchemaFormData<TSchema>>) => React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  showFooter?: boolean;
  resetOnClose?: boolean;
  validationMode?: 'onSubmit' | 'onBlur' | 'onChange' | 'onTouched' | 'all';
}

/**
 * Table column definition with form integration
 */
export interface FormTableColumn<T = any> {
  key: string;
  label: string;
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  required?: boolean;
  type?: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'custom';
  options?: SelectOption[];
  render?: (value: any, record: T, index: number) => React.ReactNode;
  editRender?: (value: any, record: T, onChange: (value: any) => void) => React.ReactNode;
  validate?: (value: any) => string | null;
  format?: (value: any) => string;
}

/**
 * Table with form integration props
 */
export interface FormTableProps<T = any> extends BaseComponentProps {
  data: T[];
  columns: FormTableColumn<T>[];
  editable?: boolean;
  selectable?: boolean;
  selectedRows?: string[] | number[];
  onSelectionChange?: (selectedRows: string[] | number[]) => void;
  onRowEdit?: (record: T, index: number) => void;
  onRowSave?: (record: T, index: number) => Promise<void> | void;
  onRowCancel?: (record: T, index: number) => void;
  onRowDelete?: (record: T, index: number) => Promise<void> | void;
  pagination?: boolean | {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
  loading?: boolean;
  empty?: React.ReactNode;
  error?: string | Error | null;
}

/**
 * CRUD table props with form integration
 */
export interface CrudTableProps<TSchema extends z.ZodType<any, any, any>>
  extends Omit<FormTableProps<SchemaFormData<TSchema>>, 'data' | 'columns'> {
  schema: TSchema;
  data: SchemaFormData<TSchema>[];
  columns: FormTableColumn<SchemaFormData<TSchema>>[];
  createForm?: React.ComponentType<TypedFormComponentProps<TSchema>>;
  editForm?: React.ComponentType<TypedFormComponentProps<TSchema>>;
  viewForm?: React.ComponentType<TypedFormComponentProps<TSchema>>;
  deleteForm?: React.ComponentType<TypedFormComponentProps<TSchema>>;
  onCreate?: (data: SchemaFormData<TSchema>) => Promise<void> | void;
  onUpdate?: (id: string | number, data: Partial<SchemaFormData<TSchema>>) => Promise<void> | void;
  onDelete?: (id: string | number) => Promise<void> | void;
  onView?: (data: SchemaFormData<TSchema>) => void;
  showActions?: boolean;
  actionButtons?: {
    create?: boolean;
    edit?: boolean;
    view?: boolean;
    delete?: boolean;
  };
}

/**
 * Form wizard step
 */
export interface FormWizardStep<TSchema extends z.ZodType<any, any, any> = any> {
  id: string;
  title: string;
  description?: string;
  optional?: boolean;
  schema?: TSchema;
  component: React.ComponentType<TypedFormComponentProps<TSchema>>;
  validate?: (data: any) => Promise<boolean> | boolean;
  onNext?: (data: any) => Promise<void> | void;
  onPrevious?: (data: any) => Promise<void> | void;
}

/**
 * Form wizard props
 */
export interface FormWizardProps<TSchema extends z.ZodType<any, any, any> = any>
  extends BaseComponentProps {
  steps: FormWizardStep<TSchema>[];
  currentStep?: number;
  onStepChange?: (step: number) => void;
  onComplete?: (data: SchemaFormData<TSchema>) => Promise<void> | void;
  onCancel?: () => void;
  allowStepNavigation?: boolean;
  showProgress?: boolean;
  persistData?: boolean;
  persistKey?: string;
}

/**
 * Dynamic form props
 */
export interface DynamicFormProps extends BaseComponentProps {
  schema: z.ZodType<any, any, any>;
  data?: any;
  onSubmit?: (data: any) => Promise<void> | void;
  onChange?: (data: any) => void;
  fieldRegistry?: FieldRegistry;
  layout?: 'vertical' | 'horizontal' | 'grid';
  columns?: number;
  renderField?: (field: any, props: BaseFieldProps) => React.ReactNode;
  renderSection?: (section: any, children: React.ReactNode) => React.ReactNode;
}

/**
 * Form provider props
 */
export interface FormProviderProps<TSchema extends z.ZodType<any, any, any> = any>
  extends BaseComponentProps {
  schema: TSchema;
  defaultValues?: DeepPartial<SchemaFormData<TSchema>>;
  mode?: DialogFormMode;
  validationMode?: 'onSubmit' | 'onBlur' | 'onChange' | 'onTouched' | 'all';
  onSubmit?: (data: SchemaFormData<TSchema>) => Promise<void> | void;
  onChange?: (data: DeepPartial<SchemaFormData<TSchema>>) => void;
  onError?: (errors: any) => void;
}

/**
 * Form field props with schema inference
 */
export interface TypedFieldProps<
  TSchema extends z.ZodType<any, any, any>,
  TPath extends FieldPath<SchemaFormData<TSchema>>
> extends BaseFieldProps<FieldValue<SchemaFormData<TSchema>, TPath>> {
  name: TPath;
  schema?: z.ZodType<FieldValue<SchemaFormData<TSchema>, TPath>>;
  form?: TypedFormAPI<TSchema>;
}

/**
 * Higher-order component types for form integration
 */
export type WithFormData<T> = <P extends {}>(
  Component: React.ComponentType<P>
) => React.ComponentType<P & { data: T }>;

export type WithFormSchema<TSchema extends z.ZodType<any, any, any>> = <P extends {}>(
  Component: React.ComponentType<P>
) => React.ComponentType<P & { schema: TSchema }>;

export type WithFormMode = <P extends {}>(
  Component: React.ComponentType<P>
) => React.ComponentType<P & { mode: DialogFormMode }>;

/**
 * Component ref types
 */
export type FormRef<TSchema extends z.ZodType<any, any, any> = any> = {
  submit: () => Promise<void>;
  reset: () => void;
  validate: () => Promise<boolean>;
  getValues: () => SchemaFormData<TSchema>;
  setValues: (values: DeepPartial<SchemaFormData<TSchema>>) => void;
  focus: (field?: FieldPath<SchemaFormData<TSchema>>) => void;
};

export type DialogRef = {
  open: () => void;
  close: () => void;
  focus: () => void;
};

export type TableRef<T = any> = {
  refresh: () => void;
  selectAll: () => void;
  clearSelection: () => void;
  getSelectedRows: () => T[];
  scrollToRow: (index: number) => void;
};

export default {};
