/**
 * Form adapters for different form libraries
 */

// React Hook Form adapter (production ready)
export {
  ReactHookFormAdapter,
  createReactHookFormAdapter,
  reactHookFormAdapter,
  useRHFWithZod,
  createTypedRHFAdapter
} from './reactHookFormAdapter';
export type { RHFAdapterConfig } from './reactHookFormAdapter';

// Formik adapter (scaffold - TODO)
export {
  FormikAdapter,
  createFormikAdapter,
  formikAdapter,
  useFormikWithYup
} from './formikAdapter';
export type { FormikAdapterConfig } from './formikAdapter';

// Final Form adapter (scaffold - TODO)
export {
  FinalFormAdapter,
  createFinalFormAdapter,
  finalFormAdapter,
  useFinalForm
} from './finalFormAdapter';
export type { FinalFormAdapterConfig } from './finalFormAdapter';

// Default adapter (React Hook Form)
export { reactHookFormAdapter as defaultFormAdapter } from './reactHookFormAdapter';

/**
 * Get the appropriate adapter based on library preference
 */
export const getFormAdapter = (library: 'rhf' | 'formik' | 'finalform' = 'rhf') => {
  switch (library) {
    case 'rhf':
      return reactHookFormAdapter;
    case 'formik':
      throw new Error('Formik adapter is not yet implemented. Use React Hook Form (rhf) instead.');
    case 'finalform':
      throw new Error('Final Form adapter is not yet implemented. Use React Hook Form (rhf) instead.');
    default:
      return reactHookFormAdapter;
  }
};

/**
 * Check if an adapter is available
 */
export const isAdapterAvailable = (library: 'rhf' | 'formik' | 'finalform'): boolean => {
  switch (library) {
    case 'rhf':
      return true;
    case 'formik':
    case 'finalform':
      return false;
    default:
      return false;
  }
};
