import React from 'react';
import { MicOff } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { cx } from '../../utils/classNames';

interface ParticipantTileProps {
  name: string;
  isSelf?: boolean;
  speakingLanguage: string;
  listeningLanguage: string;
  isMuted?: boolean;
  isSpeaking?: boolean;
  audioLevel?: number; // 0 to 1
}

const LANGUAGE_LABELS: Record<string, string> = {
  'ml-IN': 'മലയാളം (Malayalam)',
  'ta-IN': 'தமிழ் (Tamil)',
  'hi-IN': 'हिन्दी (Hindi)',
  'te-IN': 'తెలుగు (Telugu)',
  'kn-IN': 'ಕನ್ನಡ (Kannada)',
  'en-IN': 'English',
};

export const ParticipantTile: React.FC<ParticipantTileProps> = ({
  name,
  isSelf = false,
  speakingLanguage,
  listeningLanguage,
  isMuted = false,
  isSpeaking = false,
  audioLevel = 0,
}) => {
  const speakingDisplay = LANGUAGE_LABELS[speakingLanguage] || speakingLanguage;
  const listeningDisplay = LANGUAGE_LABELS[listeningLanguage] || listeningLanguage;

  return (
    <div
      className={cx(
        'relative flex flex-col items-center justify-center p-6 rounded-3xl border transition-all duration-300 w-full min-h-[220px]',
        'bg-surface-card/80 backdrop-blur-md',
        isSpeaking
          ? 'border-brand-500 shadow-xl shadow-brand-500/10'
          : 'border-border-subtle'
      )}
    >
      {/* Speaking pulsating wave effect */}
      {isSpeaking && !isMuted && (
        <div
          className="absolute inset-0 rounded-3xl border-2 border-brand-500/40 animate-ping pointer-events-none"
          style={{ opacity: Math.max(0.3, Math.min(audioLevel * 1.5, 0.9)) }}
        />
      )}

      {/* Top status bar inside tile */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-xs">
        <span className="font-medium text-ink-muted">
          {isSelf ? 'You (Local)' : 'Peer (Remote Registered Caller)'}
        </span>
        {isMuted && (
          <Badge tone="danger" icon={<MicOff className="size-3" />}>
            Muted
          </Badge>
        )}
      </div>

      {/* Center avatar with speech ring */}
      <div className="relative mt-2 mb-4">
        <Avatar name={name} size="xl" />
        {isSpeaking && !isMuted && (
          <div className="absolute -inset-1.5 rounded-full border-2 border-brand-500 animate-pulse" />
        )}
      </div>

      {/* Participant Name */}
      <h3 className="text-base font-semibold text-ink-primary text-center truncate max-w-[200px]">
        {name}
      </h3>

      {/* Sound Wave Equalizer Notation Bars */}
      <div className="mt-2.5 flex items-center gap-1.5 h-6 px-3 py-1 rounded-full bg-surface-elevated/80 border border-border-subtle">
        <div className="flex items-center gap-1 h-3.5">
          {[14, 22, 28, 18, 12].map((maxHeight, i) => {
            const active = isSpeaking && !isMuted;
            const factor = active ? Math.max(0.25, Math.min(audioLevel * 2.2, 1)) : 0.15;
            const barHeight = Math.round(maxHeight * factor);
            return (
              <span
                key={i}
                className={cx(
                  'w-1 rounded-full transition-all duration-100',
                  active ? 'bg-brand-500 animate-pulse' : 'bg-ink-muted/30'
                )}
                style={{
                  height: `${Math.max(3, barHeight)}px`,
                  animationDelay: `${i * 120}ms`,
                }}
              />
            );
          })}
        </div>
        <span className="text-[10px] font-semibold tracking-wider uppercase text-ink-muted">
          {isMuted ? 'Muted' : isSpeaking ? 'Speaking' : 'Listening'}
        </span>
      </div>

      {/* Language Preferences Tags */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-xs">
        <span className="text-ink-muted">Speaks:</span>
        <Badge tone="brand">{speakingDisplay}</Badge>
        <span className="text-ink-muted ml-1">Hears:</span>
        <Badge tone="neutral">{listeningDisplay}</Badge>
      </div>
    </div>
  );
};
