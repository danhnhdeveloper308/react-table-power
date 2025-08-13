/**
 * @jest-environment jsdom
 */

import { 
  DialogLifecycleManager, 
  DialogFocusManager,
  useDialogLifecycle,
  useDialogFocus,
  usePreventBodyScroll 
} from '../utils/dialogLifecycle';

import {
  FormErrorHandler,
  ValidationError,
  ServerError,
  NetworkError,
  FormErrorUtils,
  globalFormErrorHandler
} from '../utils/formErrorHandling';

import { ZodError, z } from 'zod';
import { renderHook } from '@testing-library/react';

describe('DialogLifecycleManager', () => {
  let manager: DialogLifecycleManager;
  let mockEvents: any;

  beforeEach(() => {
    mockEvents = {
      onBeforeOpen: jest.fn().mockResolvedValue(true),
      onOpen: jest.fn(),
      onBeforeClose: jest.fn().mockResolvedValue(true),
      onClose: jest.fn(),
      onError: jest.fn(),
      onStateChange: jest.fn()
    };
    manager = new DialogLifecycleManager(mockEvents);
  });

  afterEach(() => {
    manager.destroy();
  });

  describe('State Management', () => {
    it('initializes with closed state', () => {
      expect(manager.getState()).toBe('closed');
      expect(manager.getStateHistory()).toEqual([]);
    });

    it('transitions through states correctly on open', async () => {
      await manager.open();

      expect(mockEvents.onStateChange).toHaveBeenCalledWith('opening');
      expect(mockEvents.onStateChange).toHaveBeenCalledWith('open');
      expect(mockEvents.onBeforeOpen).toHaveBeenCalled();
      expect(mockEvents.onOpen).toHaveBeenCalled();
      expect(manager.getState()).toBe('open');
    });

    it('transitions through states correctly on close', async () => {
      await manager.open();
      await manager.close();

      expect(mockEvents.onStateChange).toHaveBeenCalledWith('closing');
      expect(mockEvents.onStateChange).toHaveBeenCalledWith('closed');
      expect(mockEvents.onBeforeClose).toHaveBeenCalled();
      expect(mockEvents.onClose).toHaveBeenCalled();
      expect(manager.getState()).toBe('closed');
    });

    it('maintains state history', async () => {
      await manager.open();
      await manager.close();

      const history = manager.getStateHistory();
      expect(history).toContain('closed');
      expect(history).toContain('opening');
      expect(history).toContain('open');
      expect(history).toContain('closing');
    });

    it('limits state history to 10 entries', async () => {
      // Trigger many state changes
      for (let i = 0; i < 15; i++) {
        await manager.open();
        await manager.close();
      }

      const history = manager.getStateHistory();
      expect(history.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Event Handling', () => {
    it('prevents opening when onBeforeOpen returns false', async () => {
      mockEvents.onBeforeOpen.mockResolvedValue(false);

      const result = await manager.open();

      expect(result).toBe(false);
      expect(manager.getState()).toBe('closed');
      expect(mockEvents.onOpen).not.toHaveBeenCalled();
    });

    it('prevents closing when onBeforeClose returns false', async () => {
      await manager.open();
      mockEvents.onBeforeClose.mockResolvedValue(false);

      const result = await manager.close();

      expect(result).toBe(false);
      expect(manager.getState()).toBe('open');
      expect(mockEvents.onClose).not.toHaveBeenCalled();
    });

    it('handles errors during lifecycle events', async () => {
      const error = new Error('Test error');
      mockEvents.onBeforeOpen.mockRejectedValue(error);

      const result = await manager.open();

      expect(result).toBe(false);
      expect(manager.getState()).toBe('error');
      expect(mockEvents.onError).toHaveBeenCalledWith(error);
    });

    it('recovers from error state automatically', async () => {
      jest.useFakeTimers();

      const error = new Error('Test error');
      mockEvents.onBeforeOpen.mockRejectedValue(error);

      await manager.open();
      expect(manager.getState()).toBe('error');

      // Fast-forward 5 seconds for auto-recovery
      jest.advanceTimersByTime(5000);

      await new Promise(resolve => setTimeout(resolve, 0));
      expect(manager.getState()).toBe('closed');

      jest.useRealTimers();
    });
  });

  describe('Cleanup Management', () => {
    it('adds and removes cleanup functions', () => {
      const cleanup1 = jest.fn();
      const cleanup2 = jest.fn();

      manager.addCleanup(cleanup1);
      manager.addCleanup(cleanup2);
      manager.removeCleanup(cleanup1);

      // Manually trigger cleanup
      manager['runCleanup']();

      expect(cleanup1).not.toHaveBeenCalled();
      expect(cleanup2).toHaveBeenCalled();
    });

    it('runs cleanup functions on close', async () => {
      const cleanup = jest.fn();
      manager.addCleanup(cleanup);

      await manager.open();
      await manager.close();

      expect(cleanup).toHaveBeenCalled();
    });

    it('handles errors in cleanup functions gracefully', async () => {
      const cleanup = jest.fn().mockImplementation(() => {
        throw new Error('Cleanup error');
      });
      manager.addCleanup(cleanup);

      // Should not throw
      await expect(manager.close()).resolves.toBe(true);
    });
  });

  describe('State Validation', () => {
    it('does not open when already open', async () => {
      await manager.open();
      const result = await manager.open();

      expect(result).toBe(true);
      expect(mockEvents.onBeforeOpen).toHaveBeenCalledTimes(1);
    });

    it('does not close when already closed', async () => {
      const result = await manager.close();

      expect(result).toBe(true);
      expect(mockEvents.onBeforeClose).not.toHaveBeenCalled();
    });
  });
});

describe('DialogFocusManager', () => {
  let focusManager: DialogFocusManager;
  let dialogElement: HTMLDivElement;

  beforeEach(() => {
    focusManager = new DialogFocusManager();
    
    // Create mock dialog element
    dialogElement = document.createElement('div');
    dialogElement.innerHTML = `
      <button>First Button</button>
      <input type="text" />
      <select></select>
      <button>Last Button</button>
    `;
    document.body.appendChild(dialogElement);
  });

  afterEach(() => {
    focusManager.destroy();
    document.body.removeChild(dialogElement);
  });

  describe('Initialization', () => {
    it('initializes with dialog element', () => {
      const previousElement = document.createElement('button');
      document.body.appendChild(previousElement);
      previousElement.focus();

      focusManager.initialize(dialogElement);

      // Should focus first element
      const firstButton = dialogElement.querySelector('button') as HTMLButtonElement;
      expect(document.activeElement).toBe(firstButton);

      document.body.removeChild(previousElement);
    });

    it('stores previous active element', () => {
      const previousElement = document.createElement('button');
      document.body.appendChild(previousElement);
      previousElement.focus();

      focusManager.initialize(dialogElement);
      focusManager.destroy();

      expect(document.activeElement).toBe(previousElement);
      document.body.removeChild(previousElement);
    });
  });

  describe('Focus Trap', () => {
    beforeEach(() => {
      focusManager.initialize(dialogElement);
    });

    it('traps focus on Tab key', () => {
      const buttons = dialogElement.querySelectorAll('button');
      const lastButton = buttons[buttons.length - 1] as HTMLButtonElement;
      
      lastButton.focus();

      // Simulate Tab key
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      document.dispatchEvent(tabEvent);

      // Should focus first element
      expect(document.activeElement).toBe(buttons[0]);
    });

    it('traps focus on Shift+Tab key', () => {
      const buttons = dialogElement.querySelectorAll('button');
      const firstButton = buttons[0] as HTMLButtonElement;
      
      firstButton.focus();

      // Simulate Shift+Tab key
      const shiftTabEvent = new KeyboardEvent('keydown', { 
        key: 'Tab', 
        shiftKey: true 
      });
      document.dispatchEvent(shiftTabEvent);

      // Should focus last element
      const lastButton = buttons[buttons.length - 1] as HTMLButtonElement;
      expect(document.activeElement).toBe(lastButton);
    });

    it('handles empty focusable elements', () => {
      const emptyDialog = document.createElement('div');
      document.body.appendChild(emptyDialog);

      const emptyFocusManager = new DialogFocusManager();
      emptyFocusManager.initialize(emptyDialog);

      // Should not throw error
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      expect(() => document.dispatchEvent(tabEvent)).not.toThrow();

      emptyFocusManager.destroy();
      document.body.removeChild(emptyDialog);
    });
  });

  describe('Focus Navigation', () => {
    beforeEach(() => {
      focusManager.initialize(dialogElement);
    });

    it('focuses first element', () => {
      focusManager.focusFirstElement();

      const firstButton = dialogElement.querySelector('button') as HTMLButtonElement;
      expect(document.activeElement).toBe(firstButton);
    });

    it('focuses last element', () => {
      focusManager.focusLastElement();

      const buttons = dialogElement.querySelectorAll('button');
      const lastButton = buttons[buttons.length - 1] as HTMLButtonElement;
      expect(document.activeElement).toBe(lastButton);
    });
  });
});

describe('Dialog Lifecycle Hooks', () => {
  describe('useDialogLifecycle', () => {
    it('provides dialog lifecycle methods', () => {
      const events = {
        onOpen: jest.fn(),
        onClose: jest.fn()
      };

      const { result } = renderHook(() => useDialogLifecycle(events));

      expect(result.current).toHaveProperty('manager');
      expect(result.current).toHaveProperty('state');
      expect(result.current).toHaveProperty('open');
      expect(result.current).toHaveProperty('close');
      expect(result.current).toHaveProperty('addCleanup');
      expect(result.current).toHaveProperty('removeCleanup');
    });

    it('updates state when lifecycle changes', async () => {
      const { result } = renderHook(() => useDialogLifecycle());

      expect(result.current.state).toBe('closed');

      await result.current.open();

      expect(result.current.state).toBe('open');
    });
  });

  describe('useDialogFocus', () => {
    it('provides focus management methods', () => {
      const dialogRef = { current: document.createElement('div') };

      const { result } = renderHook(() => useDialogFocus(dialogRef, true));

      expect(result.current).toHaveProperty('focusManager');
      expect(result.current).toHaveProperty('focusFirst');
      expect(result.current).toHaveProperty('focusLast');
    });
  });

  describe('usePreventBodyScroll', () => {
    it('prevents body scroll when active', () => {
      const originalOverflow = document.body.style.overflow;

      const { rerender } = renderHook(
        ({ active }) => usePreventBodyScroll(active),
        { initialProps: { active: true } }
      );

      expect(document.body.style.overflow).toBe('hidden');

      rerender({ active: false });

      expect(document.body.style.overflow).toBe(originalOverflow);
    });

    it('accounts for scrollbar width', () => {
      // Mock scrollbar width calculation
      Object.defineProperty(window, 'innerWidth', { value: 1024 });
      Object.defineProperty(document.documentElement, 'clientWidth', { value: 1008 });

      renderHook(() => usePreventBodyScroll(true));

      expect(document.body.style.paddingRight).toBe('16px');
    });
  });
});

describe('FormErrorHandler', () => {
  let errorHandler: FormErrorHandler;

  beforeEach(() => {
    errorHandler = new FormErrorHandler();
  });

  describe('Error Processing', () => {
    it('processes Zod validation errors', () => {
      const schema = z.object({
        name: z.string().min(1),
        email: z.string().email()
      });

      try {
        schema.parse({ name: '', email: 'invalid' });
      } catch (error) {
        const processed = errorHandler.processError(error);

        expect(processed.code).toBe('ZOD_VALIDATION_ERROR');
        expect(processed.severity).toBe('warning');
        expect(processed.fieldErrors).toHaveProperty('name');
        expect(processed.fieldErrors).toHaveProperty('email');
        expect(processed.validationErrors).toHaveLength(2);
        expect(processed.canRetry).toBe(true);
      }
    });

    it('processes custom validation errors', () => {
      const error = new ValidationError(
        'Validation failed',
        { name: 'Required', email: 'Invalid format' },
        'CUSTOM_VALIDATION'
      );

      const processed = errorHandler.processError(error);

      expect(processed.code).toBe('CUSTOM_VALIDATION');
      expect(processed.severity).toBe('warning');
      expect(processed.fieldErrors).toEqual({
        name: 'Required',
        email: 'Invalid format'
      });
      expect(processed.requiresUserAction).toBe(true);
    });

    it('processes server errors', () => {
      const error = new ServerError(
        'Server validation failed',
        422,
        'VALIDATION_ERROR',
        { email: 'Email already exists' }
      );

      const processed = errorHandler.processError(error);

      expect(processed.code).toBe('VALIDATION_ERROR');
      expect(processed.severity).toBe('error');
      expect(processed.fieldErrors).toEqual({ email: 'Email already exists' });
      expect(processed.canRetry).toBe(false);
    });

    it('processes network errors', () => {
      const error = new NetworkError('Connection failed', 'NETWORK_ERROR');

      const processed = errorHandler.processError(error);

      expect(processed.code).toBe('NETWORK_ERROR');
      expect(processed.severity).toBe('error');
      expect(processed.canRetry).toBe(true);
      expect(processed.requiresUserAction).toBe(false);
    });

    it('processes generic errors', () => {
      const error = new Error('Generic error');

      const processed = errorHandler.processError(error);

      expect(processed.code).toBe('GENERIC_ERROR');
      expect(processed.severity).toBe('error');
      expect(processed.message).toBe('Generic error');
    });

    it('processes string errors', () => {
      const error = 'String error message';

      const processed = errorHandler.processError(error);

      expect(processed.code).toBe('STRING_ERROR');
      expect(processed.message).toBe('String error message');
    });

    it('processes unknown errors', () => {
      const error = { unknown: 'object' };

      const processed = errorHandler.processError(error);

      expect(processed.code).toBe('UNKNOWN_ERROR');
      expect(processed.message).toBe('An unknown error occurred. Please try again.');
    });
  });

  describe('Recovery Strategies', () => {
    it('creates retry strategy for network errors', () => {
      const networkError = new NetworkError('Connection failed');
      const processed = errorHandler.processError(networkError);
      const strategy = errorHandler.getRecoveryStrategy(processed);

      expect(strategy.strategy).toBe('retry');
      expect(strategy.maxRetries).toBe(3);
      expect(strategy.canAutoRecover).toBe(true);
    });

    it('creates user action strategy for validation errors', () => {
      const validationError = new ValidationError('Invalid data');
      const processed = errorHandler.processError(validationError);
      const strategy = errorHandler.getRecoveryStrategy(processed);

      expect(strategy.strategy).toBe('user_action');
      expect(strategy.canAutoRecover).toBe(false);
      expect(strategy.actionRequired).toBe('Fix validation errors');
    });

    it('creates escalate strategy for critical errors', () => {
      const criticalError = new Error('Critical system error');
      const processed = errorHandler.processError(criticalError);
      processed.severity = 'critical';
      
      const strategy = errorHandler.getRecoveryStrategy(processed);

      expect(strategy.strategy).toBe('escalate');
      expect(strategy.maxRetries).toBe(0);
      expect(strategy.actionRequired).toBe('Contact support');
    });

    it('increments retry count for existing strategies', () => {
      const error = new NetworkError('Connection failed');
      const processed = errorHandler.processError(error);
      
      const strategy1 = errorHandler.getRecoveryStrategy(processed);
      const strategy2 = errorHandler.getRecoveryStrategy(processed);

      expect(strategy2.retryCount).toBe(strategy1.retryCount + 1);
    });
  });

  describe('Error History', () => {
    it('maintains error history', () => {
      const error1 = new Error('First error');
      const error2 = new Error('Second error');

      errorHandler.processError(error1);
      errorHandler.processError(error2);

      const history = errorHandler.getErrorHistory();

      expect(history).toHaveLength(2);
      expect(history[0].message).toBe('First error');
      expect(history[1].message).toBe('Second error');
    });

    it('limits history size', () => {
      // Add more than max history size
      for (let i = 0; i < 60; i++) {
        errorHandler.processError(new Error(`Error ${i}`));
      }

      const history = errorHandler.getErrorHistory();
      expect(history.length).toBeLessThanOrEqual(50);
    });

    it('clears error history', () => {
      errorHandler.processError(new Error('Test error'));
      expect(errorHandler.getErrorHistory()).toHaveLength(1);

      errorHandler.clearErrorHistory();
      expect(errorHandler.getErrorHistory()).toHaveLength(0);
    });
  });

  describe('Retry Logic', () => {
    it('determines if error should be retried', () => {
      const networkError = new NetworkError('Connection failed');
      const processed = errorHandler.processError(networkError);
      
      // First few retries should be allowed
      expect(errorHandler.shouldRetry(processed.code)).toBe(true);
      
      // After max retries, should not retry
      errorHandler.getRecoveryStrategy(processed); // Increment retry count
      errorHandler.getRecoveryStrategy(processed);
      errorHandler.getRecoveryStrategy(processed);
      errorHandler.getRecoveryStrategy(processed); // Should exceed max retries
      
      expect(errorHandler.shouldRetry(processed.code)).toBe(false);
    });
  });
});

describe('FormErrorUtils', () => {
  describe('Error Type Checking', () => {
    it('identifies validation errors', () => {
      const zodError = new ZodError([]);
      const validationError = new ValidationError('Test');
      const genericError = new Error('Generic');

      expect(FormErrorUtils.isValidationError(zodError)).toBe(true);
      expect(FormErrorUtils.isValidationError(validationError)).toBe(true);
      expect(FormErrorUtils.isValidationError(genericError)).toBe(false);
    });

    it('identifies server errors', () => {
      const serverError = new ServerError('Server error');
      const genericError = new Error('Generic');

      expect(FormErrorUtils.isServerError(serverError)).toBe(true);
      expect(FormErrorUtils.isServerError(genericError)).toBe(false);
    });

    it('identifies network errors', () => {
      const networkError = new NetworkError('Network error');
      const genericError = new Error('Generic');

      expect(FormErrorUtils.isNetworkError(networkError)).toBe(true);
      expect(FormErrorUtils.isNetworkError(genericError)).toBe(false);
    });
  });

  describe('Field Error Extraction', () => {
    it('extracts field errors from Zod errors', () => {
      const schema = z.object({
        name: z.string().min(1),
        email: z.string().email()
      });

      try {
        schema.parse({ name: '', email: 'invalid' });
      } catch (error) {
        const fieldErrors = FormErrorUtils.extractFieldErrors(error);
        
        expect(fieldErrors).toHaveProperty('name');
        expect(fieldErrors).toHaveProperty('email');
        expect(fieldErrors.name).toContain('at least 1');
        expect(fieldErrors.email).toContain('Invalid email');
      }
    });

    it('extracts field errors from ValidationError', () => {
      const error = new ValidationError('Test', {
        name: 'Required',
        email: 'Invalid'
      });

      const fieldErrors = FormErrorUtils.extractFieldErrors(error);

      expect(fieldErrors).toEqual({
        name: 'Required',
        email: 'Invalid'
      });
    });

    it('extracts field errors from ServerError', () => {
      const error = new ServerError('Server error', 422, 'VALIDATION', {
        email: 'Already exists'
      });

      const fieldErrors = FormErrorUtils.extractFieldErrors(error);

      expect(fieldErrors).toEqual({
        email: 'Already exists'
      });
    });
  });

  describe('User Message Creation', () => {
    it('creates user-friendly messages for different error types', () => {
      const stringError = 'String error';
      const validationError = new ValidationError('Validation failed');
      const networkError = new NetworkError('Connection failed');
      const genericError = new Error('Generic error');

      expect(FormErrorUtils.createUserMessage(stringError)).toBe('String error');
      expect(FormErrorUtils.createUserMessage(validationError)).toBe('Please correct the validation errors below.');
      expect(FormErrorUtils.createUserMessage(networkError)).toBe('Network connection error. Please check your internet connection.');
      expect(FormErrorUtils.createUserMessage(genericError)).toBe('Generic error');
    });
  });

  describe('Action Requirements', () => {
    it('determines if error requires user action', () => {
      const validationError = new ValidationError('Validation failed');
      const serverError = new ServerError('Client error', 400);
      const networkError = new NetworkError('Network failed');

      expect(FormErrorUtils.requiresUserAction(validationError)).toBe(true);
      expect(FormErrorUtils.requiresUserAction(serverError)).toBe(true);
      expect(FormErrorUtils.requiresUserAction(networkError)).toBe(false);
    });

    it('determines if error can be retried', () => {
      const networkError = new NetworkError('Network failed');
      const serverError = new ServerError('Server error', 500);
      const validationError = new ValidationError('Validation failed');

      expect(FormErrorUtils.canRetry(networkError)).toBe(true);
      expect(FormErrorUtils.canRetry(serverError)).toBe(true);
      expect(FormErrorUtils.canRetry(validationError)).toBe(false);
    });
  });
});

describe('Global Error Handler', () => {
  it('provides a global error handler instance', () => {
    expect(globalFormErrorHandler).toBeInstanceOf(FormErrorHandler);
  });

  it('maintains state across multiple uses', () => {
    const error1 = new Error('First error');
    const error2 = new Error('Second error');

    globalFormErrorHandler.processError(error1);
    globalFormErrorHandler.processError(error2);

    const history = globalFormErrorHandler.getErrorHistory();
    expect(history.length).toBeGreaterThanOrEqual(2);
  });
});
