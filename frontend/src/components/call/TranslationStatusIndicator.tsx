import React from 'react';
import { Ear, Languages, Volume2, AlertCircle, Clock } from 'lucide-react';
import type { TranslationState } from '../../types';
import { Badge } from '../common/Badge';

interface TranslationStatusIndicatorProps {
  state: TranslationState;
  directionLabel?: string;
}

export const TranslationStatusIndicator: React.FC<TranslationStatusIndicatorProps> = ({
  state,
  directionLabel,
}) => {
  const getBadge = () => {
    switch (state) {
      case 'listening':
        return (
          <Badge tone="brand" icon={<Ear className="size-3.5 animate-pulse" />}>
            Listening...
          </Badge>
        );
      case 'translating':
        return (
          <Badge tone="audioTranslated" icon={<Languages className="size-3.5 animate-spin" />}>
            Translating...
          </Badge>
        );
      case 'speaking':
        return (
          <Badge tone="audioAi" icon={<Volume2 className="size-3.5 animate-bounce" />}>
            Speaking
          </Badge>
        );
      case 'delayed':
        return (
          <Badge tone="warning" icon={<Clock className="size-3.5" />}>
            Processing Latency
          </Badge>
        );
      case 'unavailable':
        return (
          <Badge tone="danger" icon={<AlertCircle className="size-3.5" />}>
            Translation Unavailable
          </Badge>
        );
      case 'idle':
      default:
        return (
          <Badge tone="neutral" icon={<Languages className="size-3.5" />}>
            Ready
          </Badge>
        );
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      {directionLabel && (
        <span className="text-xs text-ink-muted hidden sm:inline">{directionLabel}:</span>
      )}
      {getBadge()}
    </div>
  );
};
