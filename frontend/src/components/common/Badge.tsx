import React from 'react';
import { cx } from '../../utils/classNames';

const tones = {
  neutral: 'bg-surface-elevated text-ink-secondary border-border-subtle',
  brand: 'bg-brand-500/15 text-brand-200 border-brand-500/30',
  success: 'bg-status-success/15 text-status-success border-status-success/30',
  warning: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  danger: 'bg-status-danger/15 text-status-danger border-status-danger/30',
  audioOriginal: 'bg-audio-original/15 text-ink-primary border-audio-original/30',
  audioTranslated: 'bg-audio-translated/20 text-emerald-300 border-audio-translated/40',
  audioAi: 'bg-audio-ai/20 text-purple-300 border-audio-ai/40',
} as const;

export interface BadgeProps extends React.ComponentPropsWithoutRef<'span'> {
  tone?: keyof typeof tones;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  tone = 'neutral',
  icon,
  className,
  ...rest
}) => {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border select-none',
        tones[tone],
        className
      )}
      {...rest}
    >
      {icon && <span className="inline-flex items-center size-3.5" aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
