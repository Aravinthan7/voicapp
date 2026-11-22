import React from 'react';
import { cx } from '../../utils/classNames';
import { Spinner } from './Spinner';

const variants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-500 active:bg-brand-700 focus-visible:ring-brand-500 shadow-sm',
  secondary: 'bg-surface-card text-ink-primary border border-border-subtle hover:bg-surface-elevated hover:border-border-strong active:bg-surface-hover focus-visible:ring-brand-500',
  danger: 'bg-status-danger text-white hover:bg-status-danger/90 active:bg-status-danger/80 focus-visible:ring-status-danger shadow-sm',
  ghost: 'text-ink-secondary hover:text-ink-primary hover:bg-surface-card active:bg-surface-elevated focus-visible:ring-brand-500',
} as const;

const sizes = {
  sm: 'text-xs px-3 py-1.5 min-h-[36px]',
  md: 'text-sm px-4 py-2 min-h-[44px]',
  lg: 'text-base px-6 py-3 min-h-[48px]',
} as const;

export interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  leadingIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  leadingIcon,
  fullWidth = false,
  className,
  disabled,
  type = 'button',
  ...rest
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading ? 'true' : undefined}
      className={cx(
        'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150',
        'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-bg',
        'disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer',
        variants[variant],
        sizes[size],
        fullWidth ? 'w-full' : '',
        className
      )}
      {...rest}
    >
      {loading ? (
        <Spinner size={size === 'lg' ? 'md' : 'sm'} />
      ) : leadingIcon ? (
        <span className="mr-2 inline-flex items-center" aria-hidden="true">
          {leadingIcon}
        </span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};
