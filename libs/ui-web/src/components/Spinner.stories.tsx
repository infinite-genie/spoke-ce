import type { Meta, StoryObj } from '@storybook/react';
import { Spinner } from './Spinner.js';

const meta: Meta<typeof Spinner> = { title: 'Primitives/Spinner', component: Spinner };
export default meta;
type Story = StoryObj<typeof Spinner>;

export const Default: Story = {};
export const Large: Story = { args: { size: 'lg', color: 'primary' } };
