import { space } from '@spoke/design-tokens';
import { cssVar, type StyleWithVars } from '../theme/themeVars.js';

export type DividerOrientation = 'horizontal' | 'vertical';

export interface DividerProps {
  orientation?: DividerOrientation;
  className?: string;
  style?: StyleWithVars;
}

export function Divider({ orientation = 'horizontal', className, style }: DividerProps) {
  const composed: StyleWithVars = {
    '--spk-bg': cssVar('border'),
    ...(orientation === 'horizontal'
      ? { width: '100%', height: space.px }
      : { width: space.px, alignSelf: 'stretch' }),
    ...style,
  };

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={['spk-divider', className].filter(Boolean).join(' ')}
      style={composed}
    />
  );
}
