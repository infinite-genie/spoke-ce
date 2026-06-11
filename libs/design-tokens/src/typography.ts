export const fontFamily = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
  mono: '"SF Mono", Menlo, Consolas, "Roboto Mono", monospace',
  sansNative: undefined, // RN default San Francisco / Roboto
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 22,
  '2xl': 28,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const lineHeight = { tight: 1.2, base: 1.46, relaxed: 1.6 } as const;

export const textStyle = {
  messageBody: {
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
    fontWeight: fontWeight.regular,
  },
  senderName: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
  timestamp: { fontSize: fontSize.xs, color: 'textTertiary' },
  channelName: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  sidebarItem: { fontSize: fontSize.base, fontWeight: fontWeight.regular },
  sectionHeader: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
  },
  code: { fontFamily: fontFamily.mono, fontSize: fontSize.sm },
} as const;
