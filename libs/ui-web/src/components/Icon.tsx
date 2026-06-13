import { type CSSProperties } from 'react';
import { icons } from 'lucide-react';
import { space } from '@spoke/design-tokens';
import { cssVar, type ColorKey } from '../theme/themeVars.js';

const ICON_SIZE = { sm: space[4], md: space[5], lg: space[6] } as const;

export type IconName = keyof typeof icons;
export type IconSize = keyof typeof ICON_SIZE;

export interface IconProps {
  name: IconName;
  size?: IconSize;
  color?: ColorKey;
  /** When provided, the icon is exposed to assistive tech with this name. */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

export function Icon({ name, size = 'md', color, label, className, style }: IconProps) {
  const Glyph = icons[name];
  return (
    <Glyph
      width={ICON_SIZE[size]}
      height={ICON_SIZE[size]}
      color={color ? cssVar(color) : undefined}
      className={className}
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
