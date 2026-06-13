import type { Meta, StoryObj } from '@storybook/react';
import { Box, Stack } from './Box.js';
import { Text } from './Text.js';

const meta: Meta<typeof Box> = { title: 'Primitives/Box', component: Box };
export default meta;
type Story = StoryObj<typeof Box>;

export const Row: Story = {
  args: { gap: 2, padding: 4, background: 'bgSecondary', children: <Text>Row layout</Text> },
};
export const Column: StoryObj<typeof Stack> = {
  render: () => (
    <Stack gap={2} padding={4}>
      <Text>One</Text>
      <Text>Two</Text>
    </Stack>
  ),
};
