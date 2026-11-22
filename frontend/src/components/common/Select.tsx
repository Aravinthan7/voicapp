import React, { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cx } from '../../utils/classNames';

interface Option {
  value: string;
  label: string;
  sublabel?: string;
}

interface SelectProps extends React.ComponentPropsWithoutRef<'select'> {
  label: string;
  options: Option[];
  error?: string;
  helperText?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  helperText,
  className,
  id: customId,
  ...rest
}) => {
  const generatedId = useId();
  const selectId = customId || generatedId;
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;

  return (
    <div className="w-full flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-medium text-ink-secondary">
        {label}
      </label>

      <div className="relative flex items-center">
        <select
          id={selectId}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={cx(
            'w-full min-h-[44px] appearance-none pl-3.5 pr-10 py-2.5 rounded-xl bg-surface-card text-ink-primary border transition-colors',
            'text-base sm:text-sm cursor-pointer',
            'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-brand-500',
            error
              ? 'border-status-danger focus-visible:ring-status-danger'
              : 'border-border-subtle hover:border-border-strong',
            className
          )}
          {...rest}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-surface-card text-ink-primary">
              {opt.label} {opt.sublabel ? `(${opt.sublabel})` : ''}
            </option>
          ))}
        </select>

        <span className="pointer-events-none absolute right-3 text-ink-muted">
          <ChevronDown size={18} />
        </span>
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
