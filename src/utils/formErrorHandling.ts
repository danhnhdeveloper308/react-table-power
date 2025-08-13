import { ZodError, ZodIssue } from 'zod';
import { FormValidationError } from '../types/forms';

/**
 * Error types that can be handled by the form system
 */
export type FormError = 
  | ZodError
  | ValidationError
  | ServerError
  | NetworkError
  | Error
  | string
  | unknown;

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  public readonly errors: Record<string, string>;
  public readonly code: string;
  
  constructor(
    message: string,
    errors: Record<string, string> = {},
    code: string = 'VALIDATION_ERROR'
  ) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
    this.code = code;
  }
}

/**
 * Server error class
 */
export class ServerError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly errors?: Record<string, string>;
  
  constructor(
    message: string,
    status: number = 500,
    code: string = 'SERVER_ERROR',
    errors?: Record<string, string>
  ) {
    super(message);
    this.name = 'ServerError';
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

/**
 * Network error class
 */
export class NetworkError extends Error {
  public readonly code: string;
  
  constructor(message: string, code: string = 'NETWORK_ERROR') {
    super(message);
    this.name = 'NetworkError';
    this.code = code;
  }
}

/**
 * Error severity levels
 */
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Processed error information
 */
export interface ProcessedError {
  message: string;
  severity: ErrorSeverity;
  code: string;
  fieldErrors: Record<string, string>;
  validationErrors: FormValidationError[];
  canRetry: boolean;
  requiresUserAction: boolean;
  timestamp: Date;
  originalError?: any;
}

/**
 * Error recovery strategies
 */
export type ErrorRecoveryStrategy = 
  | 'retry'
  | 'reset'
  | 'ignore'
  | 'escalate'
  | 'user_action';

/**
 * Error recovery context
 */
export interface ErrorRecoveryContext {
  strategy: ErrorRecoveryStrategy;
  retryCount: number;
  maxRetries: number;
  retryDelay: number;
  canAutoRecover: boolean;
  userMessage: string;
  actionRequired?: string;
}

/**
 * Form error handler class
 */
export class FormErrorHandler {
  private errorHistory: ProcessedError[] = [];
  private maxHistorySize = 50;
  private retryStrategies: Map<string, ErrorRecoveryContext> = new Map();
  
  /**
   * Process any type of form error
   */
  processError(error: FormError, context?: any): ProcessedError {
    const processed = this.createProcessedError(error, context);
    
    // Add to history
    this.errorHistory.push(processed);
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }
    
    return processed;
  }
  
  /**
   * Create processed error from raw error
   */
  private createProcessedError(error: FormError, context?: any): ProcessedError {
    const timestamp = new Date();
    
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return this.processZodError(error, timestamp);
    }
    
    // Handle custom validation errors
    if (error instanceof ValidationError) {
      return this.processValidationError(error, timestamp);
    }
    
    // Handle server errors
    if (error instanceof ServerError) {
      return this.processServerError(error, timestamp);
    }
    
    // Handle network errors
    if (error instanceof NetworkError) {
      return this.processNetworkError(error, timestamp);
    }
    
    // Handle generic errors
    if (error instanceof Error) {
      return this.processGenericError(error, timestamp);
    }
    
    // Handle string errors
    if (typeof error === 'string') {
      return this.processStringError(error, timestamp);
    }
    
    // Handle unknown errors
    return this.processUnknownError(error, timestamp);
  }
  
  /**
   * Process Zod validation errors
   */
  private processZodError(error: ZodError, timestamp: Date): ProcessedError {
    const fieldErrors: Record<string, string> = {};
    const validationErrors: FormValidationError[] = [];
    
    error.issues.forEach((issue: ZodIssue) => {
      const path = issue.path.join('.');
      const message = issue.message;
      
      fieldErrors[path] = message;
      validationErrors.push({
        field: path,
        message,
        code: issue.code,
        value: undefined // Zod doesn't provide the actual value
      });
    });
    
    return {
      message: 'Please correct the validation errors below.',
      severity: 'warning',
      code: 'ZOD_VALIDATION_ERROR',
      fieldErrors,
      validationErrors,
      canRetry: true,
      requiresUserAction: true,
      timestamp,
      originalError: error
    };
  }
  
  /**
   * Process custom validation errors
   */
  private processValidationError(error: ValidationError, timestamp: Date): ProcessedError {
    const validationErrors: FormValidationError[] = Object.entries(error.errors).map(
      ([field, message]) => ({
        field,
        message,
        code: error.code,
        value: undefined
      })
    );
    
    return {
      message: error.message,
      severity: 'warning',
      code: error.code,
      fieldErrors: error.errors,
      validationErrors,
      canRetry: true,
      requiresUserAction: true,
      timestamp,
      originalError: error
    };
  }
  
  /**
   * Process server errors
   */
  private processServerError(error: ServerError, timestamp: Date): ProcessedError {
    const fieldErrors = error.errors || {};
    const validationErrors: FormValidationError[] = Object.entries(fieldErrors).map(
      ([field, message]) => ({
        field,
        message,
        code: error.code,
        value: undefined
      })
    );
    
    const severity: ErrorSeverity = error.status >= 500 ? 'critical' : 'error';
    const canRetry = error.status >= 500 || error.status === 429; // Server errors or rate limits
    
    return {
      message: error.message,
      severity,
      code: error.code,
      fieldErrors,
      validationErrors,
      canRetry,
      requiresUserAction: !canRetry,
      timestamp,
      originalError: error
    };
  }
  
  /**
   * Process network errors
   */
  private processNetworkError(error: NetworkError, timestamp: Date): ProcessedError {
    return {
      message: 'Network connection error. Please check your internet connection and try again.',
      severity: 'error',
      code: error.code,
      fieldErrors: {},
      validationErrors: [],
      canRetry: true,
      requiresUserAction: false,
      timestamp,
      originalError: error
    };
  }
  
  /**
   * Process generic errors
   */
  private processGenericError(error: Error, timestamp: Date): ProcessedError {
    return {
      message: error.message || 'An unexpected error occurred.',
      severity: 'error',
      code: 'GENERIC_ERROR',
      fieldErrors: {},
      validationErrors: [],
      canRetry: false,
      requiresUserAction: true,
      timestamp,
      originalError: error
    };
  }
  
  /**
   * Process string errors
   */
  private processStringError(error: string, timestamp: Date): ProcessedError {
    return {
      message: error,
      severity: 'error',
      code: 'STRING_ERROR',
      fieldErrors: {},
      validationErrors: [],
      canRetry: false,
      requiresUserAction: true,
      timestamp,
      originalError: error
    };
  }
  
  /**
   * Process unknown errors
   */
  private processUnknownError(error: unknown, timestamp: Date): ProcessedError {
    return {
      message: 'An unknown error occurred. Please try again.',
      severity: 'error',
      code: 'UNKNOWN_ERROR',
      fieldErrors: {},
      validationErrors: [],
      canRetry: true,
      requiresUserAction: true,
      timestamp,
      originalError: error
    };
  }
  
  /**
   * Get error recovery strategy
   */
  getRecoveryStrategy(error: ProcessedError): ErrorRecoveryContext {
    const existingStrategy = this.retryStrategies.get(error.code);
    
    if (existingStrategy) {
      return {
        ...existingStrategy,
        retryCount: existingStrategy.retryCount + 1
      };
    }
    
    // Create new strategy based on error type
    const strategy = this.createRecoveryStrategy(error);
    this.retryStrategies.set(error.code, strategy);
    
    return strategy;
  }
  
  /**
   * Create recovery strategy for error
   */
  private createRecoveryStrategy(error: ProcessedError): ErrorRecoveryContext {
    if (error.severity === 'critical') {
      return {
        strategy: 'escalate',
        retryCount: 0,
        maxRetries: 0,
        retryDelay: 0,
        canAutoRecover: false,
        userMessage: 'A critical error occurred. Please contact support.',
        actionRequired: 'Contact support'
      };
    }
    
    if (error.code === 'NETWORK_ERROR') {
      return {
        strategy: 'retry',
        retryCount: 0,
        maxRetries: 3,
        retryDelay: 2000,
        canAutoRecover: true,
        userMessage: 'Network error. Retrying automatically...'
      };
    }
    
    if (error.code.includes('VALIDATION')) {
      return {
        strategy: 'user_action',
        retryCount: 0,
        maxRetries: 0,
        retryDelay: 0,
        canAutoRecover: false,
        userMessage: 'Please correct the validation errors and try again.',
        actionRequired: 'Fix validation errors'
      };
    }
    
    // Default strategy
    return {
      strategy: 'retry',
      retryCount: 0,
      maxRetries: 1,
      retryDelay: 1000,
      canAutoRecover: false,
      userMessage: 'An error occurred. Please try again.'
    };
  }
  
  /**
   * Get error history
   */
  getErrorHistory(): ProcessedError[] {
    return [...this.errorHistory];
  }
  
  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
    this.retryStrategies.clear();
  }
  
  /**
   * Check if error should be retried
   */
  shouldRetry(errorCode: string): boolean {
    const strategy = this.retryStrategies.get(errorCode);
    if (!strategy) return false;
    
    return strategy.canAutoRecover && strategy.retryCount < strategy.maxRetries;
  }
}

/**
 * Global form error handler instance
 */
export const globalFormErrorHandler = new FormErrorHandler();

/**
 * Utility functions for error handling
 */
export const FormErrorUtils = {
  /**
   * Check if error is a validation error
   */
  isValidationError(error: any): error is ValidationError | ZodError {
    return error instanceof ValidationError || error instanceof ZodError;
  },
  
  /**
   * Check if error is a server error
   */
  isServerError(error: any): error is ServerError {
    return error instanceof ServerError;
  },
  
  /**
   * Check if error is a network error
   */
  isNetworkError(error: any): error is NetworkError {
    return error instanceof NetworkError;
  },
  
  /**
   * Extract field errors from any error type
   */
  extractFieldErrors(error: any): Record<string, string> {
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};
      error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        fieldErrors[path] = issue.message;
      });
      return fieldErrors;
    }
    
    if (error instanceof ValidationError) {
      return error.errors;
    }
    
    if (error instanceof ServerError && error.errors) {
      return error.errors;
    }
    
    return {};
  },
  
  /**
   * Create user-friendly error message
   */
  createUserMessage(error: any): string {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error instanceof ValidationError) {
      return 'Please correct the validation errors below.';
    }
    
    if (error instanceof ZodError) {
      return 'Please check your input and try again.';
    }
    
    if (error instanceof NetworkError) {
      return 'Network connection error. Please check your internet connection.';
    }
    
    if (error instanceof ServerError) {
      return error.message || 'Server error occurred. Please try again.';
    }
    
    if (error instanceof Error) {
      return error.message || 'An unexpected error occurred.';
    }
    
    return 'An unknown error occurred. Please try again.';
  },
  
  /**
   * Check if error requires immediate user attention
   */
  requiresUserAction(error: any): boolean {
    return FormErrorUtils.isValidationError(error) || 
           (error instanceof ServerError && error.status < 500);
  },
  
  /**
   * Check if error can be retried automatically
   */
  canRetry(error: any): boolean {
    return FormErrorUtils.isNetworkError(error) ||
           (error instanceof ServerError && error.status >= 500);
  }
};

export default FormErrorHandler;
