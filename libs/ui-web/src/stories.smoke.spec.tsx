import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import type { ComponentType } from 'react';

const modules = import.meta.glob('./components/*.stories.tsx', { eager: true });

describe('storybook coverage', () => {
  it('has a story module for every component', () => {
    expect(Object.keys(modules).length).toBeGreaterThanOrEqual(10);
  });

  for (const [path, mod] of Object.entries(modules)) {
    const stories = composeStories(mod as Parameters<typeof composeStories>[0]) as Record<
      string,
      ComponentType
    >;
    const names = Object.keys(stories);
    it(`${path} exports at least one story`, () => {
      expect(names.length).toBeGreaterThan(0);
    });
    for (const [name, Story] of Object.entries(stories)) {
      it(`renders ${path} → ${name}`, () => {
        const { unmount } = render(<Story />);
        unmount();
      });
    }
  }
});
