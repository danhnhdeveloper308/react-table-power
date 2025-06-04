import { useEffect, RefObject } from 'react';

/**
 * Hook that handles click outside of the specified element
 * @param ref - Reference to the element to monitor for outside clicks
 * @param handler - Callback function to run when a click outside is detected
 * @param excludedRefs - Optional array of refs to exclude from triggering the outside click
 */
export function useOnClickOutside(
  ref: RefObject<HTMLElement>,
  handler: (event: MouseEvent | TouchEvent) => void,
  excludedRefs: RefObject<HTMLElement>[] = []
): void {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      
      // Do nothing if the ref is not set or if clicking ref's element or descendants
      if (!ref.current || ref.current.contains(target)) {
        return;
      }
      
      // Check if the click is inside any of the excluded elements
      for (const excludedRef of excludedRefs) {
        if (excludedRef.current && excludedRef.current.contains(target)) {
          return;
        }
      }
      
      handler(event);
    };
    
    // Add event listeners
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    
    // Clean up on unmount
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler, excludedRefs]);
}

export default useOnClickOutside;