import { space, layout } from './spacing.js';
import { fontFamily, fontSize, fontWeight, lineHeight, textStyle } from './typography.js';
import { radius } from './radii.js';
import { shadow, shadowElevation } from './shadows.js';
import { motion } from './motion.js';
import { zIndex } from './z-index.js';

export { palette, lightTheme, darkTheme, type Theme } from './colors.js';
export { contrastRatio } from './contrast.js';
export {
  space,
  layout,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  textStyle,
  radius,
  shadow,
  shadowElevation,
  motion,
  zIndex,
};

/** Platform-agnostic tokens (theme-independent). Themes carry `color`. */
export const tokens = {
  space,
  layout,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  textStyle,
  radius,
  shadow,
  motion,
  zIndex,
} as const;
