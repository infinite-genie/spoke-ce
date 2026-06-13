import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input.js';

describe('Input', () => {
  it('renders a textbox reflecting value and accessible name', () => {
    render(<Input value="hello" onChange={() => {}} aria-label="Message" />);
    const input = screen.getByRole('textbox', { name: 'Message' });
    expect(input).toHaveValue('hello');
  });

  it('calls onChange with the new string value', async () => {
    const onChange = vi.fn();
    render(<Input value="" onChange={onChange} aria-label="Message" />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Message' }), 'a');
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('uses the danger border token when error is set', () => {
    const { container } = render(<Input value="" onChange={() => {}} aria-label="Email" error />);
    const wrap = container.querySelector('.spk-input') as HTMLElement;
    expect(wrap.style.getPropertyValue('--spk-border')).toBe('var(--color-textDanger)');
  });

  it('uses the normal border token without error', () => {
    const { container } = render(<Input value="" onChange={() => {}} aria-label="Email" />);
    const wrap = container.querySelector('.spk-input') as HTMLElement;
    expect(wrap.style.getPropertyValue('--spk-border')).toBe('var(--color-border)');
  });

  it('renders prefix and suffix slots', () => {
    render(
      <Input
        value=""
        onChange={() => {}}
        aria-label="Search"
        prefix={<span>P</span>}
        suffix={<span>S</span>}
      />,
    );
    expect(screen.getByText('P')).toBeInTheDocument();
    expect(screen.getByText('S')).toBeInTheDocument();
  });
});
