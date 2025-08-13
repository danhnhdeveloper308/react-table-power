import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Dialog lifecycle states
 */
export type DialogLifecycleState = 
  | 'closed'
  | 'opening'
  | 'open'
  | 'closing'
  | 'error';

/**
 * Dialog lifecycle events
 */
export interface DialogLifecycleEvents {
  onBeforeOpen?: () => Promise<boolean> | boolean;
  onOpen?: () => void;
  onBeforeClose?: () => Promise<boolean> | boolean;
  onClose?: () => void;
  onError?: (error: Error) => void;
  onStateChange?: (state: DialogLifecycleState) => void;
}

/**
 * Dialog cleanup function
 */
export type DialogCleanupFunction = () => void;

/**
 * Dialog lifecycle manager
 */
export class DialogLifecycleManager {
  private state: DialogLifecycleState = 'closed';
  private cleanupFunctions: Set<DialogCleanupFunction> = new Set();
  private events: DialogLifecycleEvents = {};
  private stateHistory: DialogLifecycleState[] = [];
  private errorRecoveryTimeout?: NodeJS.Timeout;
  
  constructor(events?: DialogLifecycleEvents) {
    this.events = events || {};
  }
  
  /**
   * Get current state
   */
  getState(): DialogLifecycleState {
    return this.state;
  }
  
  /**
   * Get state history
   */
  getStateHistory(): DialogLifecycleState[] {
    return [...this.stateHistory];
  }
  
  /**
   * Set state with event handling
   */
  private async setState(newState: DialogLifecycleState): Promise<void> {
    const previousState = this.state;
    this.stateHistory.push(previousState);
    
    // Keep only last 10 states
    if (this.stateHistory.length > 10) {
      this.stateHistory.shift();
    }
    
    this.state = newState;
    
    try {
      this.events.onStateChange?.(newState);
    } catch (error) {
      console.error('[DialogLifecycle] Error in state change handler:', error);
    }
  }
  
  /**
   * Open dialog with lifecycle management
   */
  async open(): Promise<boolean> {
    if (this.state === 'open' || this.state === 'opening') {
      return true;
    }
    
    try {
      await this.setState('opening');
      
      // Call before open handler
      if (this.events.onBeforeOpen) {
        const canOpen = await this.events.onBeforeOpen();
        if (!canOpen) {
          await this.setState('closed');
          return false;
        }
      }
      
      await this.setState('open');
      this.events.onOpen?.();
      
      return true;
    } catch (error) {
      console.error('[DialogLifecycle] Error opening dialog:', error);
      await this.handleError(error as Error);
      return false;
    }
  }
  
  /**
   * Close dialog with lifecycle management
   */
  async close(): Promise<boolean> {
    if (this.state === 'closed' || this.state === 'closing') {
      return true;
    }
    
    try {
      await this.setState('closing');
      
      // Call before close handler
      if (this.events.onBeforeClose) {
        const canClose = await this.events.onBeforeClose();
        if (!canClose) {
          await this.setState('open');
          return false;
        }
      }
      
      // Run cleanup functions
      this.runCleanup();
      
      await this.setState('closed');
      this.events.onClose?.();
      
      return true;
    } catch (error) {
      console.error('[DialogLifecycle] Error closing dialog:', error);
      await this.handleError(error as Error);
      return false;
    }
  }
  
  /**
   * Handle errors in dialog lifecycle
   */
  private async handleError(error: Error): Promise<void> {
    await this.setState('error');
    this.events.onError?.(error);
    
    // Clear any existing recovery timeout
    if (this.errorRecoveryTimeout) {
      clearTimeout(this.errorRecoveryTimeout);
    }
    
    // Auto-recovery after 5 seconds
    this.errorRecoveryTimeout = setTimeout(() => {
      this.recoverFromError();
    }, 5000);
  }
  
  /**
   * Recover from error state
   */
  async recoverFromError(): Promise<void> {
    if (this.state !== 'error') return;
    
    try {
      // Try to return to previous stable state
      const lastStableState = this.findLastStableState();
      await this.setState(lastStableState);
      
      if (this.errorRecoveryTimeout) {
        clearTimeout(this.errorRecoveryTimeout);
        this.errorRecoveryTimeout = undefined;
      }
    } catch (error) {
      console.error('[DialogLifecycle] Error during recovery:', error);
    }
  }
  
  /**
   * Find last stable state from history
   */
  private findLastStableState(): DialogLifecycleState {
    for (let i = this.stateHistory.length - 1; i >= 0; i--) {
      const state = this.stateHistory[i];
      if (state === 'open' || state === 'closed') {
        return state;
      }
    }
    return 'closed';
  }
  
  /**
   * Add cleanup function
   */
  addCleanup(cleanup: DialogCleanupFunction): void {
    this.cleanupFunctions.add(cleanup);
  }
  
  /**
   * Remove cleanup function
   */
  removeCleanup(cleanup: DialogCleanupFunction): void {
    this.cleanupFunctions.delete(cleanup);
  }
  
  /**
   * Run all cleanup functions
   */
  private runCleanup(): void {
    this.cleanupFunctions.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.error('[DialogLifecycle] Error in cleanup function:', error);
      }
    });
    this.cleanupFunctions.clear();
  }
  
  /**
   * Update event handlers
   */
  updateEvents(events: Partial<DialogLifecycleEvents>): void {
    this.events = { ...this.events, ...events };
  }
  
  /**
   * Destroy the lifecycle manager
   */
  destroy(): void {
    if (this.errorRecoveryTimeout) {
      clearTimeout(this.errorRecoveryTimeout);
    }
    this.runCleanup();
    this.events = {};
    this.stateHistory = [];
  }
}

/**
 * Hook for managing dialog lifecycle
 */
export function useDialogLifecycle(
  events?: DialogLifecycleEvents
): {
  manager: DialogLifecycleManager;
  state: DialogLifecycleState;
  open: () => Promise<boolean>;
  close: () => Promise<boolean>;
  addCleanup: (cleanup: DialogCleanupFunction) => void;
  removeCleanup: (cleanup: DialogCleanupFunction) => void;
} {
  const managerRef = useRef<DialogLifecycleManager>();
  const [state, setState] = useState<DialogLifecycleState>('closed');
  
  // Create manager on first render
  if (!managerRef.current) {
    managerRef.current = new DialogLifecycleManager({
      ...events,
      onStateChange: (newState) => {
        setState(newState);
        events?.onStateChange?.(newState);
      }
    });
  }
  
  // Update events when they change
  useEffect(() => {
    if (managerRef.current && events) {
      managerRef.current.updateEvents({
        ...events,
        onStateChange: (newState) => {
          setState(newState);
          events?.onStateChange?.(newState);
        }
      });
    }
  }, [events]);
  
  // Cleanup on unmount
  useEffect(() => {
    const manager = managerRef.current;
    return () => {
      manager?.destroy();
    };
  }, []);
  
  // Expose manager methods
  const open = useCallback(() => {
    return managerRef.current?.open() ?? Promise.resolve(false);
  }, []);
  
  const close = useCallback(() => {
    return managerRef.current?.close() ?? Promise.resolve(false);
  }, []);
  
  const addCleanup = useCallback((cleanup: DialogCleanupFunction) => {
    managerRef.current?.addCleanup(cleanup);
  }, []);
  
  const removeCleanup = useCallback((cleanup: DialogCleanupFunction) => {
    managerRef.current?.removeCleanup(cleanup);
  }, []);
  
  return {
    manager: managerRef.current,
    state,
    open,
    close,
    addCleanup,
    removeCleanup
  };
}

/**
 * Focus management for dialogs
 */
export class DialogFocusManager {
  private previousActiveElement: Element | null = null;
  private focusableElements: Element[] = [];
  private dialogElement: HTMLElement | null = null;
  private focusTrapActive = false;
  
  /**
   * Initialize focus management for a dialog
   */
  initialize(dialogElement: HTMLElement): void {
    this.dialogElement = dialogElement;
    this.previousActiveElement = document.activeElement;
    this.updateFocusableElements();
    this.setupFocusTrap();
    this.focusFirstElement();
  }
  
  /**
   * Update list of focusable elements
   */
  private updateFocusableElements(): void {
    if (!this.dialogElement) return;
    
    const focusableSelectors = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable]'
    ].join(', ');
    
    this.focusableElements = Array.from(
      this.dialogElement.querySelectorAll(focusableSelectors)
    ).filter(element => {
      return element.offsetWidth > 0 && element.offsetHeight > 0;
    });
  }
  
  /**
   * Set up focus trap
   */
  private setupFocusTrap(): void {
    this.focusTrapActive = true;
    document.addEventListener('keydown', this.handleKeyDown);
  }
  
  /**
   * Handle keydown events for focus management
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.focusTrapActive || !this.dialogElement) return;
    
    if (event.key === 'Tab') {
      this.trapTabKey(event);
    } else if (event.key === 'Escape') {
      // Let the dialog handle escape
      return;
    }
  };
  
  /**
   * Trap tab key within dialog
   */
  private trapTabKey(event: KeyboardEvent): void {
    if (this.focusableElements.length === 0) {
      event.preventDefault();
      return;
    }
    
    const firstElement = this.focusableElements[0] as HTMLElement;
    const lastElement = this.focusableElements[this.focusableElements.length - 1] as HTMLElement;
    
    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }
  
  /**
   * Focus first focusable element
   */
  focusFirstElement(): void {
    if (this.focusableElements.length > 0) {
      (this.focusableElements[0] as HTMLElement).focus();
    } else if (this.dialogElement) {
      this.dialogElement.focus();
    }
  }
  
  /**
   * Focus last focusable element
   */
  focusLastElement(): void {
    if (this.focusableElements.length > 0) {
      (this.focusableElements[this.focusableElements.length - 1] as HTMLElement).focus();
    }
  }
  
  /**
   * Restore focus to previous element
   */
  restoreFocus(): void {
    if (this.previousActiveElement) {
      (this.previousActiveElement as HTMLElement).focus();
    }
  }
  
  /**
   * Destroy focus management
   */
  destroy(): void {
    this.focusTrapActive = false;
    document.removeEventListener('keydown', this.handleKeyDown);
    this.restoreFocus();
    this.dialogElement = null;
    this.focusableElements = [];
    this.previousActiveElement = null;
  }
}

/**
 * Hook for dialog focus management
 */
export function useDialogFocus(
  dialogRef: React.RefObject<HTMLElement>,
  active: boolean
): {
  focusManager: DialogFocusManager;
  focusFirst: () => void;
  focusLast: () => void;
} {
  const focusManagerRef = useRef<DialogFocusManager>();
  
  // Create focus manager on first render
  if (!focusManagerRef.current) {
    focusManagerRef.current = new DialogFocusManager();
  }
  
  // Initialize/destroy focus management based on active state
  useEffect(() => {
    const focusManager = focusManagerRef.current;
    const dialogElement = dialogRef.current;
    
    if (active && dialogElement && focusManager) {
      focusManager.initialize(dialogElement);
      
      return () => {
        focusManager.destroy();
      };
    } else if (!active && focusManager) {
      focusManager.destroy();
    }
  }, [active, dialogRef]);
  
  const focusFirst = useCallback(() => {
    focusManagerRef.current?.focusFirstElement();
  }, []);
  
  const focusLast = useCallback(() => {
    focusManagerRef.current?.focusLastElement();
  }, []);
  
  return {
    focusManager: focusManagerRef.current,
    focusFirst,
    focusLast
  };
}

/**
 * Hook for preventing body scroll when dialog is open
 */
export function usePreventBodyScroll(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    
    const originalStyle = window.getComputedStyle(document.body).overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    
    // Calculate scrollbar width
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    // Prevent scrolling and account for scrollbar
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    
    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [active]);
}

export default DialogLifecycleManager;
