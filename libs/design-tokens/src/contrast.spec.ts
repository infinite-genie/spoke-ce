import { describe, expect, it } from 'vitest';
import { contrastRatio, lightTheme, darkTheme } from '@spoke/design-tokens';

describe('contrastRatio', () => {
  it('computes 21:1 for black on white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
  });

  it('computes 1:1 for identical colors', () => {
    expect(contrastRatio('#5E4FB8', '#5E4FB8')).toBeCloseTo(1, 5);
  });

  it('pins the sRGB linearization exponent (gray exercises the power branch)', () => {
    // lin(128/255) = ((128/255 + 0.055) / 1.055) ** 2.4 ≈ 0.2158
    // contrast vs black = (0.2158 + 0.05) / 0.05 ≈ 5.32; a 2.2 exponent would give ≈ 5.9
    expect(contrastRatio('#808080', '#000000')).toBeCloseTo(5.32, 1);
  });

  it('composites rgba foregrounds over the background', () => {
    // 50% white over black ≈ #808080-ish, well below white-on-black contrast
    const r = contrastRatio('rgba(255,255,255,0.5)', '#000000');
    expect(r).toBeGreaterThan(3);
    expect(r).toBeLessThan(8);
  });
});

const AA_NORMAL = 4.5;
const AA_LARGE = 3.0;

const pairs45: ReadonlyArray<readonly [string, string]> = [
  ['textPrimary', 'bgApp'],
  ['textPrimary', 'bgSecondary'],
  ['textPrimary', 'bgElevated'],
  ['textSecondary', 'bgApp'],
  ['textOnSidebar', 'bgSidebar'],
  ['textOnSidebarActive', 'bgSidebarActive'],
  ['textLink', 'bgApp'],
] as const;

const pairs30: ReadonlyArray<readonly [string, string]> = [
  ['textTertiary', 'bgApp'],
  ['textOnBrand', 'primary'],
  ['textDanger', 'bgApp'],
] as const;

describe.each([
  ['light', lightTheme],
  ['dark', darkTheme],
] as const)('WCAG AA contrast — %s theme', (_name, theme) => {
  it.each(pairs45)('%s on %s ≥ 4.5:1', (fg, bg) => {
    const c = theme.color as Record<string, string>;
    expect(contrastRatio(c[fg]!, c[bg]!)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it.each(pairs30)('%s on %s ≥ 3.0:1', (fg, bg) => {
    const c = theme.color as Record<string, string>;
    expect(contrastRatio(c[fg]!, c[bg]!)).toBeGreaterThanOrEqual(AA_LARGE);
  });
});
