/**
 * Utility functions for common CSS class patterns
 * Provides consistent class combinations across components
 */

/**
 * Common text color classes with dark mode support
 */
export const textClasses = {
  primary: 'text-brand-navy dark:text-white',
  secondary: 'text-neutral-700 dark:text-neutral-200',
  muted: 'text-neutral-500 dark:text-neutral-400',
  link: 'text-brand-navy dark:text-white hover:text-brand-cyan-darker dark:hover:text-brand-cyan',
  error: 'text-feedback-error',
} as const;

/**
 * Common background classes with dark mode support
 */
export const backgroundClasses = {
  white: 'bg-white dark:bg-neutral-900',
  neutral: 'bg-neutral-50 dark:bg-neutral-800',
  navy: 'bg-brand-navy text-white',
  gradient: 'bg-gradient-to-br from-neutral-50 via-white to-neutral-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900',
} as const;

/**
 * Common spacing classes
 */
export const spacingClasses = {
  sectionNormal: 'py-24 md:py-32',
  sectionLarge: 'py-32 md:py-40',
  container: 'container mx-auto px-4',
} as const;

/**
 * Common transition classes
 */
export const transitionClasses = {
  fast: 'transition-colors duration-fast',
  normal: 'transition-all duration-normal',
  colors: 'transition-colors duration-fast',
} as const;

/**
 * Common focus ring classes for accessibility
 */
export const focusClasses = {
  default: 'focus-visible:ring-2 focus-visible:ring-brand-cyan-darker focus-visible:ring-offset-2 rounded-md',
  button: 'focus-visible:ring-2 focus-visible:ring-brand-cyan-darker focus-visible:ring-offset-2',
} as const;

/**
 * Common button size and style classes
 */
export const buttonClasses = {
  base: 'btn',
  primary: 'btn btn-primary',
  secondary: 'btn btn-secondary',
  outline: 'btn btn-outline',
  large: 'text-lg px-10 py-4',
  medium: 'text-base md:text-lg px-6 md:px-8',
  small: 'text-base px-8',
  withShadow: 'shadow-lg hover:shadow-xl',
  withShadowXL: 'shadow-xl hover:shadow-2xl hover:scale-105',
  fullWidth: 'w-full sm:w-auto',
} as const;

/**
 * Combine multiple class strings, filtering out empty values
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

