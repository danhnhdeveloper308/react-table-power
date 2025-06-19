// Export all hooks from the hooks directory

// Export named exports from each hook file
export { useTableDialog } from './useTableDialog';
export { useTableFilter } from './useTableFilter';
export { useTableExport } from './useTableExport';
export { useTableSettings, defaultSettings } from './useTableSettings';
export type { TableSettings } from './useTableSettings';
export { useColumnVisibility } from './useColumnVisibility';
export { useDataTable } from './useDataTable';
export { useAnimationPreference } from './useAnimationPreference';
export { useSafeTableSettings } from './useSafeTableSettings';
export { useLoadingStateManager } from './useLoadingStateManager';

// CRITICAL FIX: Export safe requestAnimationFrame utility
export const safeRequestAnimationFrame = (callback: () => void) => {
  if (typeof window !== 'undefined' && window.requestAnimationFrame) {
    return window.requestAnimationFrame(callback);
  } else {
    // Fallback for SSR environments
    return setTimeout(callback, 16); // ~60fps
  }
};
