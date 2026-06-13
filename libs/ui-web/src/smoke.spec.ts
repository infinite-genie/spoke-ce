import { describe, it, expect } from 'vitest';
import { UI_WEB_PACKAGE } from './index.js';

describe('@spoke/ui-web', () => {
  it('exposes its package name', () => {
    expect(UI_WEB_PACKAGE).toBe('@spoke/ui-web');
  });
});
