export type ComponentVariants = Record<string, Record<string, Record<string, string>>>;

export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
  };
  fonts: {
    primary: string;
    secondary: string;
    mono: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  components: ComponentVariants;
}

export const lightTheme: ThemeConfig = {
  colors: {
    primary: '#3b82f6',
    secondary: '#6b7280',
    accent: '#10b981',
    background: '#ffffff',
    surface: '#f9fafb',
    text: '#111827',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
  },
  fonts: {
    primary: 'var(--font-geist-sans)',
    secondary: 'var(--font-geist-sans)',
    mono: 'var(--font-geist-mono)',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
  components: {
    button: {
      primary: {
        background: '#3b82f6',
        color: '#ffffff',
        hover: '#2563eb',
        disabled: '#bfdbfe',
      },
      outline: {
        background: '#ffffff',
        color: '#374151',
        border: '#d1d5db',
        hover: '#f9fafb',
      },
      ghost: {
        background: 'transparent',
        color: '#374151',
        hover: '#f3f4f6',
      },
    },
    input: {
      default: {
        background: '#ffffff',
        color: '#111827',
        border: '#d1d5db',
        focus: '#3b82f6',
        placeholder: '#9ca3af',
      },
      error: {
        border: '#ef4444',
        focus: '#ef4444',
      },
    },
    card: {
      default: {
        background: '#ffffff',
        border: '#e5e7eb',
        shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06)',
      },
    },
    modal: {
      default: {
        background: '#ffffff',
        overlay: 'rgba(0, 0, 0, 0.5)',
        border: '#e5e7eb',
      },
    },
  },
};

export const darkTheme: ThemeConfig = {
  colors: {
    primary: '#60a5fa',
    secondary: '#9ca3af',
    accent: '#34d399',
    background: '#111827',
    surface: '#1f2937',
    text: '#f9fafb',
    textSecondary: '#d1d5db',
    border: '#374151',
    error: '#f87171',
    success: '#34d399',
    warning: '#fbbf24',
  },
  fonts: {
    primary: 'var(--font-geist-sans)',
    secondary: 'var(--font-geist-sans)',
    mono: 'var(--font-geist-mono)',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
  },
  components: {
    button: {
      primary: {
        background: '#60a5fa',
        color: '#ffffff',
        hover: '#3b82f6',
        disabled: '#1e3a8a',
      },
      outline: {
        background: '#1f2937',
        color: '#f9fafb',
        border: '#374151',
        hover: '#374151',
      },
      ghost: {
        background: 'transparent',
        color: '#f9fafb',
        hover: '#374151',
      },
    },
    input: {
      default: {
        background: '#1f2937',
        color: '#f9fafb',
        border: '#374151',
        focus: '#60a5fa',
        placeholder: '#6b7280',
      },
      error: {
        border: '#f87171',
        focus: '#f87171',
      },
    },
    card: {
      default: {
        background: '#1f2937',
        border: '#374151',
        shadow: '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px 0 rgb(0 0 0 / 0.3)',
      },
    },
    modal: {
      default: {
        background: '#1f2937',
        overlay: 'rgba(0, 0, 0, 0.7)',
        border: '#374151',
      },
    },
  },
};

// Custom theme example - can be easily modified
export const customTheme: ThemeConfig = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    primary: '#8b5cf6', // Purple primary
    accent: '#f59e0b', // Amber accent
  },
  components: {
    ...lightTheme.components,
    button: {
      ...lightTheme.components.button,
      primary: {
        ...lightTheme.components.button.primary,
        background: '#8b5cf6',
        hover: '#7c3aed',
      },
    },
  },
};

// Export default themes
export const themes = {
  light: lightTheme,
  dark: darkTheme,
  custom: customTheme,
};

// Current active theme - change this to switch globally
export const defaultTheme: keyof typeof themes = 'light';