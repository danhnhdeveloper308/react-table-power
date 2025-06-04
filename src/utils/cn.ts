import { clsx, type ClassValue } from 'clsx';

/**
 * Utility to conditionally combine class names
 * Uses clsx for efficient class name combination
 * 
 * @example
 * cn('base-class', isActive && 'active', isBold ? 'font-bold' : 'font-normal')
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}