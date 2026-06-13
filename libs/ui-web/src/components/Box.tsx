import { type CSSProperties, type ReactNode } from 'react';
import { space } from '@spoke/design-tokens';
import { cssVar, type ColorKey, type StyleWithVars } from '../theme/themeVars.js';

type SpaceKey = keyof typeof space;

export interface BoxProps {
  children?: ReactNode;
  padding?: SpaceKey;
  gap?: SpaceKey;
  direction?: CSSProperties['flexDirection'];
  align?: CSSProperties['alignItems'];
  justify?: CSSProperties['justifyContent'];
  background?: ColorKey;
  role?: string;
  className?: string;
  style?: CSSProperties;
  /** test/data hooks and aria pass through */
  [key: `data-${string}`]: string | undefined;
  [key: `aria-${string}`]: string | undefined;
}

/** Flex primitive: always renders a `display:flex` container (not a plain block div). */
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
  const composed: StyleWithVars = {
    display: 'flex',
    flexDirection: direction,
    alignItems: align,
    justifyContent: justify,
    padding: padding === undefined ? undefined : space[padding],
    gap: gap === undefined ? undefined : space[gap],
    ...(background ? { '--spk-bg': cssVar(background) } : {}),
    ...style,
  };

  return (
    <div className={['spk-box', className].filter(Boolean).join(' ')} style={composed} {...rest}>
      {children}
    </div>
  );
}

export function Stack(props: Omit<BoxProps, 'direction'>) {
  return <Box direction="column" {...props} />;
}
