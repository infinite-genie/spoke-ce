import type { Meta, StoryObj } from '@storybook/react';
import { Divider } from './Divider.js';

const meta: Meta<typeof Divider> = { title: 'Primitives/Divider', component: Divider };
export default meta;
type Story = StoryObj<typeof Divider>;

export const Horizontal: Story = {};
export const Vertical: Story = {
  render: () => (
    <div style={{ display: 'flex', height: 24 }}>
      <Divider orientation="vertical" />
    </div>
  ),
};
