"use client";

import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import Button from './ui/button/Button';
import { getCardStyles, getInputStyles, colors, spacing } from '../utils/themeStyles';

const ThemeDemo: React.FC = () => {
  const { theme, themeConfig, setTheme, toggleTheme, customizer } = useTheme();
  const [customColor, setCustomColor] = useState('#ff6b6b');

  const handleCustomColorChange = () => {
    customizer.updateColors({
      primary: customColor,
    });
  };

  const handleResetTheme = () => {
    customizer.reset(themeConfig);
  };

  return (
    <div style={{
      padding: spacing.lg(),
      backgroundColor: colors.background(),
      color: colors.text(),
      minHeight: '100vh',
    }}>
      <div style={{
        ...getCardStyles(),
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          marginBottom: spacing.lg(),
          color: colors.text(),
        }}>
          Theme System Demo
        </h1>

        <div style={{ marginBottom: spacing.lg() }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: spacing.md(),
            color: colors.text(),
          }}>
            Current Theme: {theme}
          </h2>

          <div style={{ display: 'flex', gap: spacing.sm(), flexWrap: 'wrap' }}>
            <Button onClick={() => setTheme('light')} variant="outline">
              Light Theme
            </Button>
            <Button onClick={() => setTheme('dark')} variant="outline">
              Dark Theme
            </Button>
            <Button onClick={() => setTheme('custom')} variant="outline">
              Custom Theme
            </Button>
            <Button onClick={toggleTheme} variant="primary">
              Toggle Theme
            </Button>
          </div>
        </div>

        <div style={{ marginBottom: spacing.lg() }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: spacing.md(),
            color: colors.text(),
          }}>
            Runtime Customization
          </h2>

          <div style={{ display: 'flex', gap: spacing.sm(), alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              style={getInputStyles()}
            />
            <Button onClick={handleCustomColorChange} variant="primary">
              Apply Custom Primary Color
            </Button>
            <Button onClick={handleResetTheme} variant="outline">
              Reset to Original
            </Button>
          </div>
        </div>

        <div style={{ marginBottom: spacing.lg() }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: spacing.md(),
            color: colors.text(),
          }}>
            Button Variants
          </h2>

          <div style={{ display: 'flex', gap: spacing.sm(), flexWrap: 'wrap' }}>
            <Button variant="primary">Primary Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="outline">Ghost Button</Button>
            <Button disabled variant="primary">Disabled Button</Button>
          </div>
        </div>

        <div style={{ marginBottom: spacing.lg() }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: spacing.md(),
            color: colors.text(),
          }}>
            Theme Colors
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: spacing.sm(),
          }}>
            {Object.entries(themeConfig.colors).map(([key, value]) => (
              <div
                key={key}
                style={{
                  padding: spacing.sm(),
                  backgroundColor: value,
                  borderRadius: '4px',
                  color: key.includes('text') ? colors.background() : colors.text(),
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  textAlign: 'center',
                  border: `1px solid ${colors.border()}`,
                }}
              >
                {key}
                <br />
                {value}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: spacing.md(),
            color: colors.text(),
          }}>
            Component Variants
          </h2>

          <div style={{ display: 'grid', gap: spacing.md() }}>
            {Object.entries(themeConfig.components).map(([componentName, variants]) => (
              <div key={componentName} style={{
                padding: spacing.md(),
                backgroundColor: colors.surface(),
                borderRadius: '8px',
                border: `1px solid ${colors.border()}`,
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  marginBottom: spacing.sm(),
                  color: colors.text(),
                  textTransform: 'capitalize',
                }}>
                  {componentName} Variants
                </h3>

                <div style={{ display: 'grid', gap: spacing.sm() }}>
                  {Object.entries(variants).map(([variantName, styles]) => (
                    <div key={variantName} style={{
                      padding: spacing.sm(),
                      backgroundColor: colors.background(),
                      borderRadius: '4px',
                      border: `1px solid ${colors.border()}`,
                    }}>
                      <strong style={{ color: colors.text() }}>
                        {variantName}:
                      </strong>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: spacing.xs(),
                        marginTop: spacing.xs(),
                        fontSize: '0.75rem',
                      }}>
                        {Object.entries(styles as Record<string, unknown>).map(([prop, value]) => (
                          <div key={prop} style={{ color: colors.textSecondary() }}>
                            {prop}: {String(value)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeDemo;