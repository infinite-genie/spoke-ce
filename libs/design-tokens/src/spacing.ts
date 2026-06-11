export const space = {
  0: 0,
  px: 1,
  0.5: 2,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

export const layout = {
  sidebarWidth: 260,
  workspaceRailWidth: 68, // thin left rail with workspace (tenant) icons
  threadPanelWidth: 380,
  messageGutter: space[4],
  messageRowPaddingY: space[2],
  inputBarMinHeight: 44,
  headerHeight: 49,
  touchTarget: 44, // min tap size on mobile
} as const;
