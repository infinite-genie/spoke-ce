/**
 * Shared stylesheet for ui-web primitives. Component color tokens arrive as inline
 * custom properties (--spk-bg, --spk-fg, ...); these rules map them to real CSS
 * properties and add :hover / :focus-visible / :disabled states. Reference only
 * CSS variables here — never raw hex.
 */
export const primitivesCss = `
.spk-focusable:focus-visible {
  outline: 2px solid var(--color-borderFocus);
  outline-offset: 2px;
}
.spk-box {
  background: var(--spk-bg, transparent);
}
`;
