import React from 'react';

/**
 * Type-safe error checking utilities
 */

// Type guard for Error objects
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

// Type guard for Promise objects
export function isPromise<T = any>(value: unknown): value is Promise<T> {
  return value !== null && 
         typeof value === 'object' && 
         'then' in value && 
         typeof (value as any).then === 'function';
}

// Type guard for objects with specific properties
export function hasProperty<K extends string>(
  obj: unknown, 
  key: K
): obj is Record<K, unknown> {
  return typeof obj === 'object' && obj !== null && key in obj;
}

// Safe error message extraction
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message || 'An error occurred';
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as any).message);
  }
  
  return 'An unknown error occurred';
}

// Format error for display
export function formatError(error: unknown): string {
  return getErrorMessage(error);
}

// Type-safe async result checking
export async function safeAwait<T>(
  value: T | Promise<T>
): Promise<T> {
  if (isPromise(value)) {
    return await value;
  }
  return value;
}
