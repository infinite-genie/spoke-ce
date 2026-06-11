export const palette = {
  // Indigo (hub sidebar / brand) — Spoke's signature
  indigo950: '#16122B',
  indigo900: '#1E1A3C', // sidebar base
  indigo800: '#2A2456', // brand primary deep
  indigo700: '#372E70',
  indigo600: '#4A3E96',
  indigo500: '#5E4FB8', // brand primary
  indigo400: '#7E70D6',

  // Neutrals
  white: '#FFFFFF',
  gray50: '#F8F8FA',
  gray100: '#F3F3F6',
  gray200: '#E7E7EC',
  gray300: '#DADAE1',
  gray400: '#BCBCC6',
  gray500: '#85858F',
  gray600: '#5F5F69',
  gray700: '#454550',
  gray800: '#2C2C34',
  gray900: '#1C1C22', // primary text

  // Accents
  blue500: '#1F6FEB', // links, primary action
  blue600: '#1657C2',
  green500: '#1A8A5A', // success / online / send
  green400: '#27B377',
  red500: '#E0335E', // destructive / mention badge
  red600: '#C01F46',
  amber400: '#ECA72E', // warning / away
  cyan400: '#36BCF0', // info accent
} as const;

export const lightTheme = {
  color: {
    // Surfaces
    bgApp: palette.white,
    bgSidebar: palette.indigo900,
    bgSidebarHover: palette.indigo700,
    bgSidebarActive: palette.blue500,
    bgSecondary: palette.gray50,
    bgHover: palette.gray100,
    bgSelected: '#EAF1FD',
    bgOverlay: 'rgba(0,0,0,0.45)',
    bgInput: palette.white,
    bgElevated: palette.white,

    // Text
    textPrimary: palette.gray900,
    textSecondary: palette.gray600,
    textTertiary: palette.gray500,
    textOnBrand: palette.white,
    textOnSidebar: 'rgba(255,255,255,0.72)',
    textOnSidebarActive: palette.white,
    textLink: palette.blue500,
    textDanger: palette.red500,
    textSuccess: palette.green500,

    // Border
    border: palette.gray200,
    borderStrong: palette.gray300,
    borderFocus: palette.blue500,

    // Interactive
    primary: palette.indigo500,
    primaryHover: palette.indigo600,
    actionSend: palette.green500,
    actionSendHover: palette.green400,

    // Status (presence)
    online: palette.green500,
    away: palette.amber400,
    dnd: palette.red500,
    offline: palette.gray400,

    // Badges
    mentionBadge: palette.red500,
    unreadBadge: palette.white,
  },
} as const;

export const darkTheme = {
  color: {
    bgApp: palette.gray900,
    bgSidebar: palette.indigo950,
    bgSidebarHover: '#241F45',
    bgSidebarActive: palette.blue500,
    bgSecondary: '#222228',
    bgHover: '#27272E',
    bgSelected: '#1B2D4A',
    bgOverlay: 'rgba(0,0,0,0.65)',
    bgInput: '#222228',
    bgElevated: '#26262D',

    textPrimary: '#D2D2D6',
    textSecondary: '#ABABB2',
    textTertiary: palette.gray500,
    textOnBrand: palette.white,
    textOnSidebar: 'rgba(255,255,255,0.62)',
    textOnSidebarActive: palette.white,
    textLink: '#5AA0F2',
    textDanger: '#E0335E',
    textSuccess: '#27B377',

    border: '#34343B',
    borderStrong: '#44444B',
    borderFocus: '#5AA0F2',

    primary: palette.indigo400,
    primaryHover: palette.indigo500,
    actionSend: palette.green400,
    actionSendHover: palette.green500,

    online: palette.green400,
    away: palette.amber400,
    dnd: palette.red500,
    offline: palette.gray600,

    mentionBadge: palette.red500,
    unreadBadge: palette.gray900,
  },
} as const;

export type Theme = { color: Record<keyof typeof lightTheme.color, string> };
