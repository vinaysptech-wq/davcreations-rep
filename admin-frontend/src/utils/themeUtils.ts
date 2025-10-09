import { ThemeConfig, ComponentVariants, themes } from '../config/themeConfig';
import logger from './logger';

/**
 * Validates a theme configuration object
 */
export const validateTheme = (theme: Partial<ThemeConfig>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check required color properties
  const requiredColors = ['primary', 'secondary', 'background', 'text', 'border'];
  if (!theme.colors) {
    errors.push('Theme must have a colors object');
  } else {
    requiredColors.forEach(color => {
      if (!theme.colors![color as keyof typeof theme.colors]) {
        errors.push(`Missing required color: ${color}`);
      }
    });
  }

  // Check required font properties
  const requiredFonts = ['primary'];
  if (!theme.fonts) {
    errors.push('Theme must have a fonts object');
  } else {
    requiredFonts.forEach(font => {
      if (!theme.fonts![font as keyof typeof theme.fonts]) {
        errors.push(`Missing required font: ${font}`);
      }
    });
  }

  // Check required spacing properties
  const requiredSpacing = ['sm', 'md', 'lg'];
  if (!theme.spacing) {
    errors.push('Theme must have a spacing object');
  } else {
    requiredSpacing.forEach(space => {
      if (!theme.spacing![space as keyof typeof theme.spacing]) {
        errors.push(`Missing required spacing: ${space}`);
      }
    });
  }

  // Check component variants
  if (!theme.components) {
    errors.push('Theme must have a components object');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Merges a custom theme with a base theme
 */
export const mergeThemes = (baseTheme: ThemeConfig, customTheme: Partial<ThemeConfig>): ThemeConfig => {
  try {
    const merged: ThemeConfig = {
      colors: { ...baseTheme.colors, ...customTheme.colors },
      fonts: { ...baseTheme.fonts, ...customTheme.fonts },
      spacing: { ...baseTheme.spacing, ...customTheme.spacing },
      borderRadius: { ...baseTheme.borderRadius, ...customTheme.borderRadius },
      shadows: { ...baseTheme.shadows, ...customTheme.shadows },
      components: mergeComponentVariants(baseTheme.components, customTheme.components || {}),
    };

    const validation = validateTheme(merged);
    if (!validation.isValid) {
      logger.warn(`Merged theme has validation errors: ${JSON.stringify(validation.errors)}`);
    }

    return merged;
  } catch (error) {
    logger.error(`Failed to merge themes: ${(error as Error).message}`);
    return baseTheme;
  }
};

/**
 * Merges component variants
 */
const mergeComponentVariants = (
  baseComponents: ComponentVariants,
  customComponents: Partial<ComponentVariants>
): ComponentVariants => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const merged = { ...baseComponents } as Record<string, any>;

  Object.entries(customComponents).forEach(([componentName, componentVariants]) => {
    if (componentVariants) {
      merged[componentName] = {
        ...merged[componentName],
        ...componentVariants,
      };
    }
  });

  return merged as ComponentVariants;
};

/**
 * Creates a custom theme from overrides
 */
export const createCustomTheme = (
  baseThemeName: 'light' | 'dark',
  overrides: Partial<ThemeConfig>
): ThemeConfig => {
  // This would be imported dynamically to avoid circular dependencies
  const baseTheme = themes[baseThemeName];

  if (!baseTheme) {
    logger.error(`Base theme '${baseThemeName}' not found`);
    return themes.light;
  }

  return mergeThemes(baseTheme, overrides);
};

/**
 * Sanitizes a color value to ensure it's a valid CSS color
 */
export const sanitizeColor = (color: string): string => {
  // Basic validation - in a real app you might want more sophisticated validation
  if (typeof color !== 'string') {
    logger.warn(`Invalid color type: ${typeof color}, expected string`);
    return '#000000';
  }

  // Check if it's a hex color
  if (color.startsWith('#') && (color.length === 4 || color.length === 7)) {
    return color;
  }

  // Check if it's a named color or other valid CSS color
  // For now, we'll allow it but log a warning
  if (!color.startsWith('#') && !color.startsWith('rgb') && !color.startsWith('hsl')) {
    logger.warn(`Potentially invalid color format: ${color}`);
  }

  return color;
};

/**
 * Gets a CSS custom property value
 */
export const getCSSVariable = (variableName: string): string => {
  if (typeof document === 'undefined') return '';

  const root = document.documentElement;
  const value = getComputedStyle(root).getPropertyValue(variableName).trim();

  return value || '';
};

/**
 * Sets a CSS custom property value
 */
export const setCSSVariable = (variableName: string, value: string): void => {
  if (typeof document === 'undefined') return;

  try {
    const root = document.documentElement;
    root.style.setProperty(variableName, value);
  } catch (error) {
    logger.error(`Failed to set CSS variable ${variableName}: ${(error as Error).message}`);
  }
};

/**
 * Theme customization API
 */
export class ThemeCustomizer {
  private currentTheme: ThemeConfig;

  constructor(initialTheme: ThemeConfig) {
    this.currentTheme = { ...initialTheme };
  }

  /**
   * Updates theme colors
   */
  updateColors(colors: Partial<ThemeConfig['colors']>): void {
    try {
      this.currentTheme.colors = { ...this.currentTheme.colors, ...colors };

      // Apply changes immediately
      Object.entries(colors).forEach(([key, value]) => {
        if (value) {
          setCSSVariable(`--color-${key}`, value);
        }
      });

      logger.info(`Theme colors updated: ${JSON.stringify(colors)}`);
    } catch (error) {
      logger.error(`Failed to update theme colors: ${(error as Error).message}`);
    }
  }

  /**
   * Updates component variant styles
   */
  updateComponentVariant(
    component: string,
    variant: string,
    styles: Record<string, string>
  ): void {
    try {
      if (!this.currentTheme.components[component]) {
        this.currentTheme.components[component] = {};
      }

      this.currentTheme.components[component][variant] = {
        ...(this.currentTheme.components[component][variant] || {}),
        ...styles,
      };

      // Apply changes immediately
      Object.entries(styles).forEach(([styleProp, value]) => {
        setCSSVariable(`--${component}-${variant}-${styleProp}`, value);
      });

      logger.info(`Component variant updated: ${component}.${variant} with ${JSON.stringify(styles)}`);
    } catch (error) {
      logger.error(`Failed to update component variant ${component}.${variant}: ${(error as Error).message}`);
    }
  }

  /**
   * Gets the current theme configuration
   */
  getTheme(): ThemeConfig {
    return { ...this.currentTheme };
  }

  /**
   * Resets to original theme
   */
  reset(originalTheme: ThemeConfig): void {
    this.currentTheme = { ...originalTheme };
    logger.info('Theme reset to original');
  }
}