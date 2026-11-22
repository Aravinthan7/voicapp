import React from 'react';
import { cx } from '../../utils/classNames';

interface IconButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  label: string;
  pressed?: boolean;
  activeVariant?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'size-9 text-xs',
  md: 'size-11 text-sm',
  lg: 'size-14 text-base',
} as const;

export const IconButton: React.FC<IconButtonProps> = ({
  children,
  label,
  pressed,
  activeVariant = false,
  size = 'md',
  className,
  disabled,
  type = 'button',
  ...rest
}) => {
  return (
    <button
      type={type}
      aria-label={label}
      aria-pressed={pressed !== undefined ? pressed : undefined}
      disabled={disabled}
      className={cx(
        'inline-flex items-center justify-center rounded-full transition-all duration-150',
        'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-bg',
        'disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none',
        sizeClasses[size],
        activeVariant
          ? 'bg-brand-600 text-white hover:bg-brand-500 focus-visible:ring-brand-500 shadow-md'
          : 'bg-surface-card text-ink-primary border border-border-subtle hover:bg-surface-elevated hover:border-border-strong focus-visible:ring-brand-500',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
};
