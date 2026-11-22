import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cx } from '../../utils/classNames';

interface InlineAlertProps {
  type?: 'error' | 'warning' | 'success' | 'info';
  title?: string;
  message: string;
  action?: React.ReactNode;
  className?: string;
}

const icons = {
  error: <AlertCircle className="size-5 text-status-danger shrink-0" />,
  warning: <AlertTriangle className="size-5 text-status-warning shrink-0" />,
  success: <CheckCircle2 className="size-5 text-status-success shrink-0" />,
  info: <Info className="size-5 text-status-info shrink-0" />,
};

const styles = {
  error: 'bg-status-danger/10 border-status-danger/30 text-ink-primary',
  warning: 'bg-status-warning/10 border-status-warning/30 text-ink-primary',
  success: 'bg-status-success/10 border-status-success/30 text-ink-primary',
  info: 'bg-status-info/10 border-status-info/30 text-ink-primary',
};

export const InlineAlert: React.FC<InlineAlertProps> = ({
  type = 'info',
  title,
  message,
  action,
  className,
}) => {
  const isAlert = type === 'error' || type === 'warning';

  return (
    <div
      role={isAlert ? 'alert' : 'status'}
      aria-live="polite"
      className={cx(
        'flex items-start gap-3 p-3.5 rounded-xl border text-sm',
        styles[type],
        className
      )}
    >
      <span aria-hidden="true" className="mt-0.5">{icons[type]}</span>
      <div className="flex-1 flex flex-col gap-0.5">
        {title && <span className="font-semibold">{title}</span>}
        <span className="text-ink-secondary">{message}</span>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
