import { type ComponentPropsWithoutRef, type CSSProperties } from 'react';
import { space, radius, layout } from '@spoke/design-tokens';
import { cssVar, type ColorKey, type StyleWithVars } from '../theme/themeVars.js';
import { Icon, type IconName, type IconSize } from './Icon.js';
import { Spinner } from './Spinner.js';

export type IconButtonVariant = 'ghost' | 'primary' | 'danger';
export type IconButtonSize = 'sm' | 'md' | 'lg';

const BTN_SIZE: Record<IconButtonSize, number> = {
  sm: space[8],
  md: space[10],
  lg: layout.touchTarget,
};
const ICON_FOR: Record<IconButtonSize, IconSize> = { sm: 'sm', md: 'md', lg: 'md' };

const VARIANT_TOKENS: Record<
  IconButtonVariant,
  { bg?: ColorKey; fg: ColorKey; bgHover: ColorKey }
> = {
  ghost: { fg: 'textSecondary', bgHover: 'bgHover' },
  primary: { bg: 'primary', fg: 'textOnBrand', bgHover: 'primaryHover' },
  danger: { fg: 'textDanger', bgHover: 'bgHover' },
};

export interface IconButtonProps extends Omit<
  ComponentPropsWithoutRef<'button'>,
  'style' | 'className'
> {
  icon: IconName;
  /** Required accessible name. */
  label: string;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  loading?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function IconButton({
  icon,
  label,
  size = 'md',
  variant = 'ghost',
  loading = false,
  disabled,
  type = 'button',
  className,
  style,
  ...rest
}: IconButtonProps) {
  const dim = BTN_SIZE[size];
  const v = VARIANT_TOKENS[variant];
  const composed: StyleWithVars = {
    '--spk-fg': cssVar(v.fg),
    '--spk-bg-hover': cssVar(v.bgHover),
    ...(v.bg ? { '--spk-bg': cssVar(v.bg) } : {}),
    width: dim,
    height: dim,
    borderRadius: radius.base,
    ...style,
  };

  return (
    <button
      type={type}
      aria-label={label}
      className={['spk-iconbutton', 'spk-focusable', className].filter(Boolean).join(' ')}
      style={composed}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <Spinner size="sm" color={v.fg} />
      ) : (
        <Icon name={icon} size={ICON_FOR[size]} color={v.fg} />
      )}
    </button>
  );
}
