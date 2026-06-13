import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge.js';

const meta: Meta<typeof Badge> = { title: 'Primitives/Badge', component: Badge };
export default meta;
type Story = StoryObj<typeof Badge>;

export const Mention: Story = { args: { count: 3 } };
export const Unread: Story = { args: { count: 12, variant: 'unread' } };
export const Capped: Story = { args: { count: 250 } };
