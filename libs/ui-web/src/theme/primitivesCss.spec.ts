import { describe, it, expect } from 'vitest';
import { primitivesCss } from './primitivesCss.js';

describe('primitivesCss', () => {
  it('defines a keyboard focus ring using the borderFocus token', () => {
    expect(primitivesCss).toContain('.spk-focusable:focus-visible');
    expect(primitivesCss).toContain('var(--color-borderFocus)');
  });

  it('contains no raw hex colors', () => {
    expect(primitivesCss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
