import { space, fontSize, fontWeight } from '@spoke/design-tokens';
import { cssVar, type ColorKey, type StyleWithVars } from '../theme/themeVars.js';

export type Presence = 'online' | 'away' | 'dnd' | 'offline';
export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const AVATAR_SIZE: Record<AvatarSize, number> = {
  sm: space[6],
  md: space[8],
  lg: space[10],
  xl: space[12],
};
const AVATAR_FONT: Record<AvatarSize, number> = {
  sm: fontSize.xs,
  md: fontSize.sm,
  lg: fontSize.base,
  xl: fontSize.md,
};
const DOT_SIZE: Record<AvatarSize, number> = {
  sm: space[2],
  md: space[2],
  lg: space[3],
  xl: space[3],
};
const PRESENCE_TOKEN: Record<Presence, ColorKey> = {
  online: 'online',
  away: 'away',
  dnd: 'dnd',
  offline: 'offline',
};

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

export interface AvatarProps {
  name: string;
  src?: string;
  size?: AvatarSize;
  presence?: Presence;
  className?: string;
  style?: StyleWithVars;
}

export function Avatar({ name, src, size = 'md', presence, className, style }: AvatarProps) {
  const dim = AVATAR_SIZE[size];
  const composed: StyleWithVars = {
    '--spk-bg': cssVar('bgSecondary'),
    '--spk-fg': cssVar('textSecondary'),
    width: dim,
    height: dim,
    borderRadius: space[2],
    fontSize: AVATAR_FONT[size],
    fontWeight: fontWeight.semibold,
    ...style,
  };

  const dotStyle: StyleWithVars = {
    '--spk-presence': cssVar(PRESENCE_TOKEN[presence ?? 'offline']),
    width: DOT_SIZE[size],
    height: DOT_SIZE[size],
  };

  // The accessible image role lives on the <img> when there's a src, otherwise on the
  // initials wrapper — never both (a nested role="img" would make getByRole ambiguous).
  const labelProps = src ? {} : { role: 'img', 'aria-label': name };

  return (
    <span
      className={['spk-avatar', className].filter(Boolean).join(' ')}
      style={composed}
      {...labelProps}
    >
      {src ? <img src={src} alt={name} /> : initials(name)}
      {presence ? <span className="spk-presence" style={dotStyle} aria-hidden="true" /> : null}
    </span>
  );
}
