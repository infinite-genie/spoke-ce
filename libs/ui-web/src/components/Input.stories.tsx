import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Input } from './Input.js';

const meta: Meta<typeof Input> = { title: 'Primitives/Input', component: Input };
export default meta;
type Story = StoryObj<typeof Input>;

function Controlled(args: { error?: boolean }) {
  const [value, setValue] = useState('');
  return (
    <Input
      value={value}
      onChange={setValue}
      aria-label="Demo"
      placeholder="Type…"
      error={args.error}
    />
  );
}

export const Default: Story = { render: () => <Controlled /> };
export const Error: Story = { render: () => <Controlled error /> };
