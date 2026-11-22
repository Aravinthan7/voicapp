import React from 'react';
import { cx } from '../../utils/classNames';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-14 text-lg font-semibold',
  xl: 'size-20 text-2xl font-bold',
} as const;

function getInitials(name: string): string {
  if (!name.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColorIndex(name: string): string {
  const colors = [
    'bg-indigo-600 text-white',
    'bg-teal-600 text-white',
    'bg-amber-600 text-white',
    'bg-rose-600 text-white',
    'bg-sky-600 text-white',
    'bg-emerald-600 text-white',
    'bg-purple-600 text-white',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  size = 'md',
  className,
}) => {
  const initials = getInitials(name);
  const colorClass = getColorIndex(name);

  return (
    <div
      className={cx(
        'rounded-full inline-flex items-center justify-center shrink-0 select-none shadow-xs',
        colorClass,
        sizeClasses[size],
        className
      )}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
};
