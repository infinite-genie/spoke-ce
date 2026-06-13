import { type CSSProperties } from 'react';
import { space } from '@spoke/design-tokens';
import { cssVar, type ColorKey, type StyleWithVars } from '../theme/themeVars.js';

const SPINNER_SIZE = { sm: space[4], md: space[5], lg: space[6] } as const;

export interface SpinnerProps {
  size?: keyof typeof SPINNER_SIZE;
  color?: ColorKey;
  label?: string;
  className?: string;
  style?: CSSProperties;
}

export function Spinner({
  size = 'md',
  color = 'textSecondary',
  label = 'Loading',
  className,
  style,
}: SpinnerProps) {
  const px = SPINNER_SIZE[size];
  const composed: StyleWithVars = { '--spk-fg': cssVar(color), ...style };
  return (
    <span
      role="status"
      aria-label={label}
      className={['spk-spinner', className].filter(Boolean).join(' ')}
      style={composed}
    >
      <svg className="spk-spin" width={px} height={px} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  );
}
