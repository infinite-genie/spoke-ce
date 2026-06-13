import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar.js';

const meta: Meta<typeof Avatar> = { title: 'Primitives/Avatar', component: Avatar };
export default meta;
type Story = StoryObj<typeof Avatar>;

export const Initials: Story = { args: { name: 'Ada Lovelace' } };
export const Online: Story = { args: { name: 'Grace Hopper', presence: 'online' } };
export const Dnd: Story = { args: { name: 'Alan Turing', presence: 'dnd', size: 'lg' } };
