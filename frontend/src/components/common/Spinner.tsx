import React from 'react';
import { Loader2 } from 'lucide-react';
import { cx } from '../../utils/classNames';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizeClasses = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-8',
} as const;

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className,
  label = 'Loading...',
}) => {
  return (
    <span className="inline-flex items-center gap-2" role="status" aria-busy="true">
      <Loader2 className={cx('animate-spin text-current', sizeClasses[size], className)} />
      <span className="sr-only">{label}</span>
    </span>
  );
};
