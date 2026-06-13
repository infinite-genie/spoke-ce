import { space, fontSize, fontWeight } from '@spoke/design-tokens';
import { cssVar, type ColorKey, type StyleWithVars } from '../theme/themeVars.js';

export type BadgeVariant = 'mention' | 'unread';

const VARIANT_TOKENS: Record<BadgeVariant, { bg: ColorKey; fg: ColorKey }> = {
  mention: { bg: 'mentionBadge', fg: 'textOnBrand' },
  unread: { bg: 'unreadBadge', fg: 'textPrimary' },
};

export interface BadgeProps {
  count: number;
  variant?: BadgeVariant;
  /** Display cap; counts above show "<max>+". */
  max?: number;
  className?: string;
  style?: StyleWithVars;
}

export function Badge({ count, variant = 'mention', max = 99, className, style }: BadgeProps) {
  if (count <= 0) return null;
  const v = VARIANT_TOKENS[variant];
  const label = count > max ? `${max}+` : `${count}`;
  const noun = variant === 'mention' ? (count === 1 ? 'mention' : 'mentions') : 'unread';
  const composed: StyleWithVars = {
    '--spk-bg': cssVar(v.bg),
    '--spk-fg': cssVar(v.fg),
    minWidth: space[4],
    height: space[4],
    paddingLeft: space[1],
    paddingRight: space[1],
    borderRadius: space[4],
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    ...style,
  };

  return (
    <span
      className={['spk-badge', className].filter(Boolean).join(' ')}
      style={composed}
      aria-label={`${count} ${noun}`}
    >
      {label}
    </span>
  );
}
