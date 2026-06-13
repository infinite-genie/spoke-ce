import { type ComponentPropsWithoutRef, type CSSProperties, type ReactNode } from 'react';
import { space, radius, fontSize, fontWeight } from '@spoke/design-tokens';
import { cssVar, type ColorKey, type StyleWithVars } from '../theme/themeVars.js';
import { Spinner } from './Spinner.js';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT_TOKENS: Record<
  ButtonVariant,
  { bg?: ColorKey; fg: ColorKey; bgHover: ColorKey; border?: ColorKey }
> = {
  primary: { bg: 'primary', fg: 'textOnBrand', bgHover: 'primaryHover' },
  secondary: { bg: 'bgSecondary', fg: 'textPrimary', bgHover: 'bgHover', border: 'borderStrong' },
  ghost: { fg: 'textPrimary', bgHover: 'bgHover' },
  danger: { bg: 'textDanger', fg: 'textOnBrand', bgHover: 'textDanger' },
};

const SIZE_TOKENS: Record<ButtonSize, { minHeight: number; paddingX: number; fontSize: number }> = {
  sm: { minHeight: space[8], paddingX: space[3], fontSize: fontSize.sm },
  md: { minHeight: space[10], paddingX: space[4], fontSize: fontSize.base },
  lg: { minHeight: space[12], paddingX: space[5], fontSize: fontSize.md },
};

export interface ButtonProps extends Omit<
  ComponentPropsWithoutRef<'button'>,
  'style' | 'className'
> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconLeft?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  iconLeft,
  disabled,
  type = 'button',
  children,
  className,
  style,
  ...rest
}: ButtonProps) {
  const v = VARIANT_TOKENS[variant];
  const s = SIZE_TOKENS[size];
  const composed: StyleWithVars = {
    '--spk-fg': cssVar(v.fg),
    '--spk-bg-hover': cssVar(v.bgHover),
    ...(v.bg ? { '--spk-bg': cssVar(v.bg) } : {}),
    ...(v.border ? { '--spk-border': cssVar(v.border) } : {}),
    minHeight: s.minHeight,
    paddingLeft: s.paddingX,
    paddingRight: s.paddingX,
    borderRadius: radius.md,
    fontSize: s.fontSize,
    fontWeight: fontWeight.semibold,
    gap: space[2],
    ...style,
  };

  return (
    <button
      type={type}
      className={['spk-button', 'spk-focusable', className].filter(Boolean).join(' ')}
      style={composed}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner size={size === 'lg' ? 'md' : 'sm'} color={v.fg} /> : iconLeft}
      {children}
    </button>
  );
}
