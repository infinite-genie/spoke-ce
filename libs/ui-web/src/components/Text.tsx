import { createElement, type CSSProperties, type ReactNode } from 'react';
import { textStyle } from '@spoke/design-tokens';
import { cssVar, type ColorKey, type StyleWithVars } from '../theme/themeVars.js';

export type TextVariant = keyof typeof textStyle;

export interface TextProps {
  children?: ReactNode;
  variant?: TextVariant;
  color?: ColorKey;
  numberOfLines?: number;
  as?: 'span' | 'p' | 'div' | 'label';
  role?: string;
  className?: string;
  style?: CSSProperties;
  /** test/data hooks and aria pass through */
  [key: `data-${string}`]: string | undefined;
  [key: `aria-${string}`]: string | undefined;
}

export function Text({
  children,
  variant = 'messageBody',
  color = 'textPrimary',
  numberOfLines,
  as = 'span',
  className,
  style,
  ...rest
}: TextProps) {
  const clamp: CSSProperties =
    numberOfLines != null
      ? {
          display: '-webkit-box',
          WebkitLineClamp: numberOfLines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }
      : {};

  const composed: StyleWithVars = {
    ...textStyle[variant],
    '--spk-fg': cssVar(color),
    ...clamp,
    ...style,
  };

  return createElement(
    as,
    { ...rest, className: ['spk-text', className].filter(Boolean).join(' '), style: composed },
    children,
  );
}
