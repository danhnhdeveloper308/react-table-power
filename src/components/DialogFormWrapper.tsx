import React, { useEffect, forwardRef, useImperativeHandle } from 'react';
import { DialogMode } from '../types';

interface DialogFormWrapperProps {
  /**
   * Form component to render
   */
  FormComponent: React.ComponentType<any>;
  
  /**
   * Dialog type (create, edit, view, delete)
   */
  type: DialogMode;
  
  /**
   * Form data
   */
  data?: any;
  
  /**
   * Whether the form is in a loading state
   */
  loading?: boolean;
  
  /**
   * Error object or message
   */
  error?: any;
  
  /**
   * Whether the form is read-only
   */
  isReadOnly?: boolean;
  
  /**
   * Additional props to pass to the form
   */
  formProps?: Record<string, any>;
  
  /**
   * Submit handler
   */
  onSubmit?: (data: any) => Promise<boolean> | boolean;
  
  /**
   * Close handler
   */
  onClose?: () => void;
}

/**
 * Simplified form wrapper for better integration
 */
const DialogFormWrapper = forwardRef<any, DialogFormWrapperProps>(({
  FormComponent,
  type,
  data,
  loading,
  error,
  isReadOnly,
  formProps = {},
  onSubmit,
  onClose
}, ref) => {
  const formRef = React.useRef<any>(null);

  // Expose form methods through ref
  useImperativeHandle(ref, () => formRef.current, []);

  return (
    <FormComponent
      ref={formRef}
      formRef={formRef}
      dialogType={type}
      data={data}
      loading={loading}
      error={error}
      isReadOnly={isReadOnly || type === 'view'}
      onSubmit={onSubmit}
      onClose={onClose}
      {...formProps}
    />
  );
});

DialogFormWrapper.displayName = 'DialogFormWrapper';

export default DialogFormWrapper;
