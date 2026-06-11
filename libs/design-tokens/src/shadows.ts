export const shadow = {
  sm: '0 1px 2px rgba(0,0,0,0.08)',
  base: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
  md: '0 4px 12px rgba(0,0,0,0.15)',
  lg: '0 8px 24px rgba(0,0,0,0.18)',
  popover: '0 6px 18px rgba(0,0,0,0.22)',
} as const;

/** RN elevation map per DESIGN_SYSTEM.md §4 */
export const shadowElevation = { sm: 2, base: 3, md: 6, lg: 12, popover: 10 } as const;
