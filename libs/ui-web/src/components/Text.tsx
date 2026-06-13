import { createElement, type CSSProperties, type ReactNode } from 'react';
import { textStyle } from '@spoke/design-tokens';
import { cssVar, type ColorKey } from '../theme/themeVars.js';

export type TextVariant = keyof typeof textStyle;

export interface TextProps {
  children?: ReactNode;
  variant?: TextVariant;
  color?: ColorKey;
  numberOfLines?: number;
  as?: 'span' | 'p' | 'div' | 'label';
  className?: string;
  style?: CSSProperties;
}

export function Text({
  children,
  variant = 'messageBody',
  color = 'textPrimary',
  numberOfLines,
  as = 'span',
  className,
  style,
}: TextProps) {
  const clamp: CSSProperties = numberOfLines
    ? {
        display: '-webkit-box',
        WebkitLineClamp: numberOfLines,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }
    : {};

  const composed = {
    ...textStyle[variant],
    ...({ '--spk-fg': cssVar(color) } as CSSProperties),
    ...clamp,
    ...style,
  } as CSSProperties;

  return createElement(
    as,
    { className: ['spk-text', className].filter(Boolean).join(' '), style: composed },
    children,
  );
}
