import React from 'react';
import { extractErrorMessage } from './validationErrorHandler';

/**
 * Safely convert any error type to a React-friendly string
 */
export function formatError(error: unknown): string {
  return extractErrorMessage(error);
}

/**
 * Type guard to check if a value is an Error
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}
