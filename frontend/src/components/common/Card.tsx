import React from 'react';
import { cx } from '../../utils/classNames';

interface CardProps extends React.ComponentPropsWithoutRef<'div'> {
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  elevated = false,
  className,
  ...rest
}) => {
  return (
    <div
      className={cx(
        'rounded-2xl border transition-colors',
        elevated
          ? 'bg-surface-elevated border-border-strong shadow-lg'
          : 'bg-surface-card border-border-subtle shadow-xs',
        'p-5 sm:p-6',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
};
