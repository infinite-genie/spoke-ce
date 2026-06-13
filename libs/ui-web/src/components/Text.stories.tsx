import type { Meta, StoryObj } from '@storybook/react';
import { Text } from './Text.js';

const meta: Meta<typeof Text> = { title: 'Primitives/Text', component: Text };
export default meta;
type Story = StoryObj<typeof Text>;

export const MessageBody: Story = { args: { children: 'The quick brown fox.' } };
export const SectionHeader: Story = { args: { variant: 'sectionHeader', children: 'Channels' } };
export const Code: Story = { args: { variant: 'code', children: 'npm run test' } };
export const Tertiary: Story = { args: { color: 'textTertiary', children: '12:45 PM' } };
