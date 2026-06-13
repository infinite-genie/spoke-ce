import type { Meta, StoryObj } from '@storybook/react';
import { IconButton } from './IconButton.js';

const meta: Meta<typeof IconButton> = { title: 'Primitives/IconButton', component: IconButton };
export default meta;
type Story = StoryObj<typeof IconButton>;

export const Ghost: Story = { args: { icon: 'Search', label: 'Search' } };
export const Primary: Story = { args: { icon: 'Plus', label: 'Add', variant: 'primary' } };
export const Loading: Story = { args: { icon: 'Send', label: 'Send', loading: true } };
