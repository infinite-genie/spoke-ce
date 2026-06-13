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
.spk-text {
  color: var(--spk-fg, var(--color-textPrimary));
}
.spk-spinner {
  display: inline-flex;
  color: var(--spk-fg, var(--color-textSecondary));
}
@keyframes spk-spin {
  to { transform: rotate(360deg); }
}
.spk-spin {
  animation: spk-spin 0.7s linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  .spk-spin { animation-duration: 2s; }
}
.spk-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--spk-bg, transparent);
  color: var(--spk-fg);
  border: 1px solid var(--spk-border, transparent);
  font-family: inherit;
  cursor: pointer;
}
.spk-button:hover:not(:disabled) {
  background: var(--spk-bg-hover);
}
.spk-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
`;
