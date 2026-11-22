import React, { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cx } from '../../utils/classNames';

interface TextFieldProps extends React.ComponentPropsWithoutRef<'input'> {
  label: string;
  error?: string;
  helperText?: string;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  error,
  helperText,
  type = 'text',
  className,
  id: customId,
  ...rest
}) => {
  const generatedId = useId();
  const inputId = customId || generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="w-full flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-ink-secondary">
        {label}
      </label>

      <div className="relative flex items-center">
        <input
          id={inputId}
          type={effectiveType}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={cx(
            'w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-surface-card text-ink-primary border transition-colors',
            'placeholder:text-ink-disabled text-base sm:text-sm',
            'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-brand-500',
            error
              ? 'border-status-danger focus-visible:ring-status-danger'
              : 'border-border-subtle hover:border-border-strong',
            isPassword ? 'pr-11' : '',
            className
          )}
          {...rest}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 p-1 text-ink-muted hover:text-ink-primary rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error ? (
        <span id={errorId} role="alert" className="text-xs text-status-danger font-medium">
          {error}
        </span>
      ) : helperText ? (
        <span id={helperId} className="text-xs text-ink-muted">
          {helperText}
        </span>
      ) : null}
    </div>
  );
};
