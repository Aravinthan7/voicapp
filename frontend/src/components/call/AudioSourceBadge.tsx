import React from 'react';
import { Sparkles, Mic, Volume2 } from 'lucide-react';
import { Badge } from '../common/Badge';
import type { AudioOutputMode } from '../../types';

interface AudioSourceBadgeProps {
  mode: AudioOutputMode;
  hasVoiceProfile?: boolean;
}

export const AudioSourceBadge: React.FC<AudioSourceBadgeProps> = ({
  mode,
  hasVoiceProfile = false,
}) => {
  if (mode === 'original') {
    return (
      <Badge tone="audioOriginal" icon={<Mic className="size-3.5" />}>
        Original Audio (Unmodified)
      </Badge>
    );
  }

  if (mode === 'standard_voice') {
    return (
      <Badge tone="audioAi" icon={<Volume2 className="size-3.5" />}>
        Standard AI Voice
      </Badge>
    );
  }

  // mode === 'translated'
  return hasVoiceProfile ? (
    <Badge tone="audioAi" icon={<Sparkles className="size-3.5" />}>
      Translated (Cloned Voice)
    </Badge>
  ) : (
    <Badge tone="audioTranslated" icon={<Sparkles className="size-3.5" />}>
      Translated (Standard Voice)
    </Badge>
  );
};
