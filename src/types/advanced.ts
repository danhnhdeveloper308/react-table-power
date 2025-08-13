import { z } from 'zod';
import { 
  DialogFormMode, 
  FormAdapter, 
  FormAPI, 
  FormState, 
  FormValidationError 
} from './forms';

/**
 * Advanced utility types for the form system
 */

/**
 * Extract the inferred type from a Zod schema
 */
export type InferSchema<T> = T extends z.ZodType<infer U, any, any> ? U : never;

/**
 * Make specific properties optional
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties required
 */
export type Required<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Deep partial type for nested objects
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends object
    ? DeepPartial<T[P]>
    : T[P];
};

/**
 * Deep required type for nested objects
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends (infer U)[]
    ? DeepRequired<U>[]
    : T[P] extends object
    ? DeepRequired<T[P]>
    : T[P];
};

/**
 * Extract keys that match a specific type
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * Pick properties of a specific type
 */
export type PickByType<T, U> = Pick<T, KeysOfType<T, U>>;

/**
 * Omit properties of a specific type
 */
export type OmitByType<T, U> = Omit<T, KeysOfType<T, U>>;

/**
 * Get the value type of an object
 */
export type ValueOf<T> = T[keyof T];

/**
 * Get the parameters of a function
 */
export type Parameters<T> = T extends (...args: infer P) => any ? P : never;

/**
 * Get the return type of a function
 */
export type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

/**
 * Make a function async if it isn't already
 */
export type MakeAsync<T> = T extends (...args: infer P) => Promise<infer R>
  ? T
  : T extends (...args: infer P) => infer R
  ? (...args: P) => Promise<R>
  : never;

/**
 * Extract the awaited type from a Promise
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T;

/**
 * Union to intersection type
 */
export type UnionToIntersection<U> = 
  (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

/**
 * Form-specific types
 */

/**
 * Schema-based form data type
 */
export type SchemaFormData<TSchema> = TSchema extends z.ZodType<infer U, any, any> ? U : never;

/**
 * Form field path type for nested objects
 */
export type FieldPath<T> = T extends object ? {
  [K in keyof T]: K extends string | number
    ? T[K] extends object
      ? `${K}` | `${K}.${FieldPath<T[K]>}`
      : `${K}`
    : never;
}[keyof T] : never;

/**
 * Get the type of a field from a path
 */
export type FieldValue<T, P extends string> = P extends keyof T
  ? T[P]
  : P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? FieldValue<T[K], Rest>
    : never
  : never;

/**
 * Form adapter with schema inference
 */
export interface TypedFormAdapter<TSchema extends z.ZodType<any, any, any>> 
  extends FormAdapter<SchemaFormData<TSchema>> {
  readonly schema: TSchema;
  readonly formType: SchemaFormData<TSchema>;
}

/**
 * Form API with schema inference
 */
export interface TypedFormAPI<TSchema extends z.ZodType<any, any, any>> 
  extends FormAPI<SchemaFormData<TSchema>> {
  readonly schema: TSchema;
  
  /**
   * Type-safe field value getter
   */
  getFieldValue<P extends FieldPath<SchemaFormData<TSchema>>>(
    path: P
  ): FieldValue<SchemaFormData<TSchema>, P> | undefined;
  
  /**
   * Type-safe field value setter
   */
  setFieldValue<P extends FieldPath<SchemaFormData<TSchema>>>(
    path: P,
    value: FieldValue<SchemaFormData<TSchema>, P>
  ): void;
  
  /**
   * Type-safe field validation
   */
  validateField<P extends FieldPath<SchemaFormData<TSchema>>>(
    path: P
  ): Promise<boolean>;
  
  /**
   * Type-safe partial update
   */
  updateValues(
    values: DeepPartial<SchemaFormData<TSchema>>
  ): void;
}

/**
 * Dialog form props with schema inference
 */
export interface TypedDialogFormProps<TSchema extends z.ZodType<any, any, any>> {
  schema: TSchema;
  mode?: DialogFormMode;
  defaultValues?: DeepPartial<SchemaFormData<TSchema>> | 
                  (() => Promise<DeepPartial<SchemaFormData<TSchema>>>);
  onSubmit: (values: SchemaFormData<TSchema>) => Promise<void> | void;
  renderFields: (context: TypedFormRenderContext<TSchema>) => React.ReactNode;
  formAdapter?: TypedFormAdapter<TSchema>;
}

/**
 * Form render context with schema inference
 */
export interface TypedFormRenderContext<TSchema extends z.ZodType<any, any, any>> {
  form: TypedFormAPI<TSchema>;
  formData: SchemaFormData<TSchema>;
  submitting: boolean;
  submitError?: string;
  mode: DialogFormMode;
  formState: FormState;
  isReadOnly: boolean;
}

/**
 * CRUD operations with type safety
 */
export interface TypedCRUDOperations<T> {
  create: (data: Omit<T, 'id'>) => Promise<T>;
  read: (id: string | number) => Promise<T>;
  update: (id: string | number, data: Partial<T>) => Promise<T>;
  delete: (id: string | number) => Promise<void>;
  list: (params?: any) => Promise<T[]>;
}

/**
 * Form validation with schema inference
 */
export interface TypedFormValidation<TSchema extends z.ZodType<any, any, any>> {
  schema: TSchema;
  validate: (data: unknown) => Promise<{
    success: boolean;
    data?: SchemaFormData<TSchema>;
    errors?: FormValidationError[];
  }>;
  validateField: <P extends FieldPath<SchemaFormData<TSchema>>>(
    path: P,
    value: FieldValue<SchemaFormData<TSchema>, P>
  ) => Promise<boolean>;
}

/**
 * Event handlers with type safety
 */
export type TypedEventHandler<T> = (data: T) => Promise<void> | void;

export type TypedSubmitHandler<TSchema extends z.ZodType<any, any, any>> = 
  TypedEventHandler<SchemaFormData<TSchema>>;

export type TypedChangeHandler<TSchema extends z.ZodType<any, any, any>> = 
  TypedEventHandler<DeepPartial<SchemaFormData<TSchema>>>;

/**
 * Form hooks with schema inference
 */
export interface TypedFormHook<TSchema extends z.ZodType<any, any, any>> {
  (config?: {
    defaultValues?: DeepPartial<SchemaFormData<TSchema>>;
    mode?: DialogFormMode;
    validationMode?: 'onSubmit' | 'onBlur' | 'onChange' | 'onTouched' | 'all';
  }): TypedFormAPI<TSchema>;
}

/**
 * Dialog hook with schema inference
 */
export interface TypedDialogHook<TSchema extends z.ZodType<any, any, any>> {
  schema: TSchema;
  open: (
    mode: DialogFormMode,
    data?: DeepPartial<SchemaFormData<TSchema>>
  ) => void;
  close: () => void;
  submit: TypedSubmitHandler<TSchema>;
  state: {
    open: boolean;
    mode: DialogFormMode | null;
    data: DeepPartial<SchemaFormData<TSchema>> | null;
    loading: boolean;
    error: string | null;
  };
}

/**
 * Component props with generic constraints
 */
export interface ComponentWithSchema<TSchema extends z.ZodType<any, any, any>> {
  schema: TSchema;
}

export interface ComponentWithData<T> {
  data: T;
}

export interface ComponentWithMode {
  mode: DialogFormMode;
}

/**
 * Higher-order component types
 */
export type WithFormSchema<
  TSchema extends z.ZodType<any, any, any>,
  TProps = {}
> = React.ComponentType<TProps & ComponentWithSchema<TSchema>>;

export type WithFormData<T, TProps = {}> = React.ComponentType<TProps & ComponentWithData<T>>;

export type WithFormMode<TProps = {}> = React.ComponentType<TProps & ComponentWithMode>;

/**
 * Factory function types
 */
export type FormAdapterFactory<TSchema extends z.ZodType<any, any, any>> = 
  () => TypedFormAdapter<TSchema>;

export type FormHookFactory<TSchema extends z.ZodType<any, any, any>> = 
  () => TypedFormHook<TSchema>;

export type DialogHookFactory<TSchema extends z.ZodType<any, any, any>> = 
  () => TypedDialogHook<TSchema>;

/**
 * Configuration types with generics
 */
export interface TypedFormConfig<TSchema extends z.ZodType<any, any, any>> {
  schema: TSchema;
  adapter?: TypedFormAdapter<TSchema>;
  validation?: TypedFormValidation<TSchema>;
  defaultValues?: DeepPartial<SchemaFormData<TSchema>>;
  events?: {
    onSubmit?: TypedSubmitHandler<TSchema>;
    onChange?: TypedChangeHandler<TSchema>;
    onError?: (error: FormValidationError[]) => void;
  };
}

/**
 * Table integration types
 */
export interface TypedTableFormIntegration<
  TSchema extends z.ZodType<any, any, any>,
  TTableData extends SchemaFormData<TSchema> = SchemaFormData<TSchema>
> {
  schema: TSchema;
  tableData: TTableData[];
  crudOperations: TypedCRUDOperations<TTableData>;
  formConfig: TypedFormConfig<TSchema>;
  
  // CRUD dialog methods
  openCreate: () => void;
  openEdit: (item: TTableData) => void;
  openView: (item: TTableData) => void;
  openDelete: (item: TTableData) => void;
  
  // State
  dialogState: {
    open: boolean;
    mode: DialogFormMode | null;
    item: TTableData | null;
  };
}

/**
 * Utility type for creating strongly-typed forms
 */
export type CreateTypedForm<TSchema extends z.ZodType<any, any, any>> = {
  schema: TSchema;
  FormData: SchemaFormData<TSchema>;
  useForm: TypedFormHook<TSchema>;
  useDialog: TypedDialogHook<TSchema>;
  FormWrapper: WithFormSchema<TSchema>;
  validation: TypedFormValidation<TSchema>;
};

/**
 * Advanced conditional types
 */

/**
 * Check if a type is a Zod schema
 */
export type IsZodSchema<T> = T extends z.ZodType<any, any, any> ? true : false;

/**
 * Extract schema from form adapter
 */
export type ExtractSchema<T> = T extends TypedFormAdapter<infer S> ? S : never;

/**
 * Extract data type from form adapter
 */
export type ExtractFormData<T> = T extends FormAdapter<infer D> ? D : never;

/**
 * Conditional form props based on adapter type
 */
export type ConditionalFormProps<T> = T extends TypedFormAdapter<infer S>
  ? TypedDialogFormProps<S>
  : T extends FormAdapter<infer D>
  ? {
      data?: D;
      onSubmit: (data: D) => Promise<void> | void;
      renderFields: (context: any) => React.ReactNode;
    }
  : never;

export default {};
