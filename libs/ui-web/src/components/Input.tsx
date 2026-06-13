import { type ReactNode } from 'react';
import { space, radius, fontSize } from '@spoke/design-tokens';
import { cssVar, type StyleWithVars } from '../theme/themeVars.js';

export interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
  type?: string;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
  className?: string;
  style?: StyleWithVars;
}

export function Input({
  value,
  onChange,
  placeholder,
  error = false,
  prefix,
  suffix,
  type = 'text',
  disabled = false,
  id,
  'aria-label': ariaLabel,
  className,
  style,
}: InputProps) {
  const composed: StyleWithVars = {
    '--spk-bg': cssVar('bgInput'),
    '--spk-fg': cssVar('textPrimary'),
    '--spk-border': cssVar(error ? 'textDanger' : 'border'),
    gap: space[2],
    paddingLeft: space[3],
    paddingRight: space[3],
    minHeight: space[10],
    borderRadius: radius.base,
    fontSize: fontSize.base,
    ...style,
  };

  return (
    <div className={['spk-input', className].filter(Boolean).join(' ')} style={composed}>
      {prefix}
      <input
        id={id}
        aria-label={ariaLabel}
        aria-invalid={error || undefined}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
      {suffix}
    </div>
  );
}
