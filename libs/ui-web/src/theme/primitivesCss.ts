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
.spk-iconbutton {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--spk-bg, transparent);
  color: var(--spk-fg);
  border: none;
  cursor: pointer;
}
.spk-iconbutton:hover:not(:disabled) {
  background: var(--spk-bg-hover);
}
.spk-iconbutton:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.spk-avatar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: visible;
  background: var(--spk-bg);
  color: var(--spk-fg);
  user-select: none;
}
.spk-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
}
.spk-presence {
  position: absolute;
  right: 0;
  bottom: 0;
  border-radius: 9999px;
  background: var(--spk-presence);
  box-shadow: 0 0 0 2px var(--color-bgApp);
}
`;
