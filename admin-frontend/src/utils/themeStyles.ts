/**
 * Theme-aware utility functions for consistent styling
 */

import { getCSSVariable } from './themeUtils';

/**
 * Gets theme-aware styles for buttons
 */
export const getButtonStyles = (variant: 'primary' | 'outline' | 'ghost' = 'primary') => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '500',
    gap: '0.5rem',
    borderRadius: getCSSVariable('--border-radius-md'),
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    padding: '0.625rem 1rem',
  };

  switch (variant) {
    case 'primary':
      return {
        ...baseStyles,
        backgroundColor: getCSSVariable('--button-primary-background'),
        color: getCSSVariable('--button-primary-color'),
        border: 'none',
        boxShadow: getCSSVariable('--shadow-sm'),
      };
    case 'outline':
      return {
        ...baseStyles,
        backgroundColor: getCSSVariable('--button-outline-background'),
        color: getCSSVariable('--button-outline-color'),
        border: `1px solid ${getCSSVariable('--button-outline-border')}`,
      };
    case 'ghost':
      return {
        ...baseStyles,
        backgroundColor: getCSSVariable('--button-ghost-background'),
        color: getCSSVariable('--button-ghost-color'),
        border: 'none',
      };
    default:
      return baseStyles;
  }
};

/**
 * Gets theme-aware styles for inputs
 */
export const getInputStyles = (error = false) => {
  const baseStyles = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    borderRadius: getCSSVariable('--border-radius-md'),
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    outline: 'none',
  };

  if (error) {
    return {
      ...baseStyles,
      backgroundColor: getCSSVariable('--input-default-background'),
      color: getCSSVariable('--input-default-color'),
      border: `1px solid ${getCSSVariable('--input-error-border')}`,
    };
  }

  return {
    ...baseStyles,
    backgroundColor: getCSSVariable('--input-default-background'),
    color: getCSSVariable('--input-default-color'),
    border: `1px solid ${getCSSVariable('--input-default-border')}`,
  };
};

/**
 * Gets theme-aware styles for cards
 */
export const getCardStyles = () => ({
  backgroundColor: getCSSVariable('--card-background'),
  border: `1px solid ${getCSSVariable('--card-border')}`,
  borderRadius: getCSSVariable('--border-radius-lg'),
  boxShadow: getCSSVariable('--card-shadow'),
  padding: getCSSVariable('--spacing-lg'),
});

/**
 * Gets theme-aware styles for modals
 */
export const getModalStyles = () => ({
  backgroundColor: getCSSVariable('--modal-background'),
  border: `1px solid ${getCSSVariable('--modal-border')}`,
  borderRadius: getCSSVariable('--border-radius-xl'),
  boxShadow: getCSSVariable('--shadow-lg'),
});

/**
 * Gets theme-aware overlay styles
 */
export const getOverlayStyles = () => ({
  backgroundColor: getCSSVariable('--modal-overlay'),
  position: 'fixed' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
});

/**
 * Utility function to create theme-aware class names
 */
export const createThemeClass = (component: string, variant?: string, state?: string): string => {
  const parts = ['theme', component];
  if (variant) parts.push(variant);
  if (state) parts.push(state);
  return parts.join('-');
};

/**
 * Theme-aware spacing utilities
 */
export const spacing = {
  xs: () => getCSSVariable('--spacing-xs'),
  sm: () => getCSSVariable('--spacing-sm'),
  md: () => getCSSVariable('--spacing-md'),
  lg: () => getCSSVariable('--spacing-lg'),
  xl: () => getCSSVariable('--spacing-xl'),
  xxl: () => getCSSVariable('--spacing-xxl'),
};

/**
 * Theme-aware color utilities
 */
export const colors = {
  primary: () => getCSSVariable('--color-primary'),
  secondary: () => getCSSVariable('--color-secondary'),
  accent: () => getCSSVariable('--color-accent'),
  background: () => getCSSVariable('--color-background'),
  surface: () => getCSSVariable('--color-surface'),
  text: () => getCSSVariable('--color-text'),
  textSecondary: () => getCSSVariable('--color-text-secondary'),
  border: () => getCSSVariable('--color-border'),
  error: () => getCSSVariable('--color-error'),
  success: () => getCSSVariable('--color-success'),
  warning: () => getCSSVariable('--color-warning'),
};

/**
 * Theme-aware shadow utilities
 */
export const shadows = {
  sm: () => getCSSVariable('--shadow-sm'),
  md: () => getCSSVariable('--shadow-md'),
  lg: () => getCSSVariable('--shadow-lg'),
};

/**
 * Theme-aware border radius utilities
 */
export const borderRadius = {
  sm: () => getCSSVariable('--border-radius-sm'),
  md: () => getCSSVariable('--border-radius-md'),
  lg: () => getCSSVariable('--border-radius-lg'),
  xl: () => getCSSVariable('--border-radius-xl'),
};

/**
 * Combines multiple style objects
 */
export const combineStyles = (...styles: (Record<string, unknown> | undefined)[]): Record<string, unknown> => {
  return (styles.filter(s => s) as Record<string, unknown>[]).reduce((acc: Record<string, unknown>, style: Record<string, unknown>) => ({ ...acc, ...style }), {} as Record<string, unknown>);
};

/**
 * Creates responsive styles based on theme breakpoints
 */
export const responsiveStyles = (styles: Record<string, unknown>) => {
  // This would be expanded to handle responsive design
  return styles;
};