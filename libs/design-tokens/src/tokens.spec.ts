import { describe, expect, it } from 'vitest';
import { lightTheme, darkTheme, tokens } from '@spoke/design-tokens';

const sortedKeys = (o: Record<string, unknown>) => Object.keys(o).sort();

describe('theme key parity (DESIGN_SYSTEM.md §1.3: both themes expose identical keys)', () => {
  it('light and dark expose the same semantic color keys', () => {
    expect(sortedKeys(darkTheme.color)).toEqual(sortedKeys(lightTheme.color));
  });

  it('every semantic color value is a non-empty string', () => {
    for (const theme of [lightTheme, darkTheme]) {
      for (const [key, value] of Object.entries(theme.color)) {
        expect(typeof value, `${key}`).toBe('string');
        expect((value as string).length).toBeGreaterThan(0);
      }
    }
  });
});

describe('token object shape', () => {
  it('exposes the platform-agnostic token groups', () => {
    expect(sortedKeys(tokens)).toEqual(
      [
        'fontFamily',
        'fontSize',
        'fontWeight',
        'layout',
        'lineHeight',
        'motion',
        'radius',
        'shadow',
        'space',
        'textStyle',
        'zIndex',
      ].sort(),
    );
  });

  it('spot-checks values against DESIGN_SYSTEM.md', () => {
    expect(tokens.space[4]).toBe(16);
    expect(tokens.layout.workspaceRailWidth).toBe(68);
    expect(tokens.layout.sidebarWidth).toBe(260);
    expect(tokens.fontSize.base).toBe(15);
    expect(tokens.radius.full).toBe(9999);
    expect(tokens.zIndex.tooltip).toBe(1500);
    expect(tokens.motion.duration.base).toBe(160);
    expect(lightTheme.color.bgSidebar).toBe('#1E1A3C');
    expect(darkTheme.color.bgSidebar).toBe('#16122B');
  });

  it('reflects the 2026-06-12 amendments', () => {
    expect(Object.keys(tokens.fontFamily).sort()).toEqual(['mono', 'sans']);
    expect(tokens.textStyle.timestamp).not.toHaveProperty('color');
    expect(tokens.motion.easing.emphasized).toBe('cubic-bezier(0.05, 0.7, 0.1, 1.0)');
    expect(tokens.motion.easing.emphasized).not.toBe(tokens.motion.easing.standard);
  });
});
