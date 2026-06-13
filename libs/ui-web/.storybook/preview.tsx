import type { Preview } from '@storybook/react';
import { ThemeProvider, type ThemeName } from '../src/theme/ThemeProvider.js';

const preview: Preview = {
  decorators: [
    (Story, ctx) => (
      <ThemeProvider defaultTheme={(ctx.globals.theme as ThemeName) ?? 'light'}>
        <Story />
      </ThemeProvider>
    ),
  ],
  globalTypes: {
    theme: {
      description: 'Theme',
      defaultValue: 'light',
      toolbar: { icon: 'circlehollow', items: ['light', 'dark'], dynamicTitle: true },
    },
  },
};

export default preview;
