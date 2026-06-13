import type { Meta, StoryObj } from '@storybook/react';
import { Icon } from './Icon.js';

const meta: Meta<typeof Icon> = { title: 'Primitives/Icon', component: Icon };
export default meta;
type Story = StoryObj<typeof Icon>;

export const Default: Story = { args: { name: 'Hash', label: 'channel' } };
export const Large: Story = {
  args: { name: 'Send', size: 'lg', color: 'actionSend', label: 'send' },
};
