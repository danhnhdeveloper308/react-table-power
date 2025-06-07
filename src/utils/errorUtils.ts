import React from 'react';

/**
 * Safely converts any error type to a React-friendly node for rendering
 * @param error Error object, string, or any other error representation
 * @returns ReactNode that can be safely rendered
 */
export function formatError(error: unknown): React.ReactNode {
  if (!error) return null;
  
  // For string errors, return directly
  if (typeof error === 'string') {
    return error;
  }
  
  // For Error objects, extract the message
  if (error instanceof Error) {
    return error.message || 'An error occurred';
  }
  
  // For objects with a message property
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const errorWithMessage = error as { message: unknown };
    if (typeof errorWithMessage.message === 'string') {
      return errorWithMessage.message;
    }
  }
  
  // For other objects, try to stringify
  if (typeof error === 'object') {
    try {
      return JSON.stringify(error);
    } catch {
      // If JSON stringify fails
      return 'An error occurred';
    }
  }
  
  // For any other type, convert to string
  return String(error);
}

/**
 * Check if a value is an Error instance
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Extract message from various error formats
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const errorWithMessage = error as { message: unknown };
    if (typeof errorWithMessage.message === 'string') {
      return errorWithMessage.message;
    }
  }
  
  return 'An error occurred';
}
