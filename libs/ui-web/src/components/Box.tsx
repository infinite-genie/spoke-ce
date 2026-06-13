import { type CSSProperties, type ReactNode } from 'react';
import { space } from '@spoke/design-tokens';
import { cssVar, type ColorKey } from '../theme/themeVars.js';

type SpaceKey = keyof typeof space;

export interface BoxProps {
  children?: ReactNode;
  padding?: SpaceKey;
  gap?: SpaceKey;
  direction?: CSSProperties['flexDirection'];
  align?: CSSProperties['alignItems'];
  justify?: CSSProperties['justifyContent'];
  background?: ColorKey;
  className?: string;
  style?: CSSProperties;
  /** test/data hooks and aria pass through */
  [key: `data-${string}`]: string | undefined;
}

export function Box({
  children,
  padding,
  gap,
  direction = 'row',
  align,
  justify,
  background,
  className,
  style,
  ...rest
}: BoxProps) {
  const composed = {
    display: 'flex',
    flexDirection: direction,
    alignItems: align,
    justifyContent: justify,
    padding: padding === undefined ? undefined : space[padding],
    gap: gap === undefined ? undefined : space[gap],
    ...(background ? { '--spk-bg': cssVar(background) } : {}),
    ...style,
  } as CSSProperties;

  return (
    <div className={['spk-box', className].filter(Boolean).join(' ')} style={composed} {...rest}>
      {children}
    </div>
  );
}

export function Stack(props: BoxProps) {
  return <Box direction="column" {...props} />;
}
