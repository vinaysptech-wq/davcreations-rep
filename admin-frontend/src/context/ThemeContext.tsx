"use client";

import type React from "react";
import { createContext, useState, useContext, useEffect } from "react";
import { themes, defaultTheme, ThemeConfig } from "../config/themeConfig";
import logger from "../utils/logger";
import { ThemeCustomizer } from "../utils/themeUtils";

type Theme = keyof typeof themes;

type ThemeContextType = {
  theme: Theme;
  themeConfig: ThemeConfig;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  customizer: ThemeCustomizer;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const applyThemeVariables = (themeConfig: ThemeConfig) => {
  try {
    const root = document.documentElement;
    if (!root) {
      throw new Error('Document root element not found');
    }

    const { colors, fonts, spacing, borderRadius, shadows, components } = themeConfig;

    // Validate theme config structure
    if (!colors || !fonts || !spacing || !borderRadius || !shadows || !components) {
      throw new Error('Invalid theme configuration: missing required properties');
    }

    // Colors
    Object.entries(colors).forEach(([key, value]) => {
      if (typeof value !== 'string') {
        logger.warn(`Invalid color value for ${key}: ${value}`);
        return;
      }
      root.style.setProperty(`--color-${key}`, value);
    });

    // Fonts
    Object.entries(fonts).forEach(([key, value]) => {
      if (typeof value !== 'string') {
        logger.warn(`Invalid font value for ${key}: ${value}`);
        return;
      }
      root.style.setProperty(`--font-${key}`, value);
    });

    // Spacing
    Object.entries(spacing).forEach(([key, value]) => {
      if (typeof value !== 'string') {
        logger.warn(`Invalid spacing value for ${key}: ${value}`);
        return;
      }
      root.style.setProperty(`--spacing-${key}`, value);
    });

    // Border radius
    Object.entries(borderRadius).forEach(([key, value]) => {
      if (typeof value !== 'string') {
        logger.warn(`Invalid border radius value for ${key}: ${value}`);
        return;
      }
      root.style.setProperty(`--border-radius-${key}`, value);
    });

    // Shadows
    Object.entries(shadows).forEach(([key, value]) => {
      if (typeof value !== 'string') {
        logger.warn(`Invalid shadow value for ${key}: ${value}`);
        return;
      }
      root.style.setProperty(`--shadow-${key}`, value);
    });

    // Component variants
    Object.entries(components).forEach(([componentName, componentVariants]) => {
      Object.entries(componentVariants).forEach(([variantName, variantStyles]) => {
        Object.entries(variantStyles as Record<string, unknown>).forEach(([styleProp, value]) => {
          if (typeof value !== 'string') {
            logger.warn(`Invalid component style value for ${componentName}.${variantName}.${styleProp}: ${value}`);
            return;
          }
          root.style.setProperty(`--${componentName}-${variantName}-${styleProp}`, value);
        });
      });
    });

    logger.info('Theme variables applied successfully');
  } catch (error) {
    logger.error('Failed to apply theme variables', error as Error);
    // Apply fallback theme
    applyFallbackTheme();
  }
};

const applyFallbackTheme = () => {
  try {
    const root = document.documentElement;
    // Apply basic fallback values
    root.style.setProperty('--color-primary', '#3b82f6');
    root.style.setProperty('--color-background', '#ffffff');
    root.style.setProperty('--color-text', '#000000');
    logger.warn('Applied fallback theme due to theme application error');
  } catch (error) {
    logger.error('Failed to apply fallback theme', error as Error);
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [isInitialized, setIsInitialized] = useState(false);
  const [customizer] = useState(() => new ThemeCustomizer(themes[defaultTheme]));

  useEffect(() => {
    try {
      // This code will only run on the client side
      const savedTheme = localStorage.getItem("theme") as Theme | null;
      const initialTheme = savedTheme && savedTheme in themes ? savedTheme : defaultTheme;

      setThemeState(initialTheme);
      setIsInitialized(true);
      logger.info(`Theme initialized: ${initialTheme}`);
    } catch (error) {
      logger.error('Failed to initialize theme from localStorage', error as Error);
      setThemeState(defaultTheme);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem("theme", theme);
        applyThemeVariables(themes[theme]);
        logger.info(`Theme changed to: ${theme}`);
      } catch (error) {
        logger.error(`Failed to apply theme: ${theme}`, error as Error);
      }
    }
  }, [theme, isInitialized]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const themeConfig = themes[theme];

  return (
    <ThemeContext.Provider value={{ theme, themeConfig, setTheme, toggleTheme, customizer }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
