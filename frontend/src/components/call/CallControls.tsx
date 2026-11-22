import React from 'react';
import { Mic, MicOff, PhoneOff } from 'lucide-react';
import { IconButton } from '../common/IconButton';
import { Button } from '../common/Button';
import type { AudioOutputMode } from '../../types';

interface CallControlsProps {
  isMuted: boolean;
  onToggleMute: () => void;
  onEndCall: () => void;
  outputMode: AudioOutputMode;
  onChangeOutputMode: (mode: AudioOutputMode) => void;
  isCallActive: boolean;
}

export const CallControls: React.FC<CallControlsProps> = ({
  isMuted,
  onToggleMute,
  onEndCall,
  outputMode,
  onChangeOutputMode,
  isCallActive,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 p-4 rounded-3xl bg-surface-card/90 backdrop-blur-md border border-border-subtle shadow-lg">
      {/* Microphone Mute Button */}
      <IconButton
        label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        pressed={isMuted}
        onClick={onToggleMute}
        disabled={!isCallActive}
        size="lg"
        className={isMuted ? 'bg-status-danger text-white hover:bg-status-danger/90' : 'bg-surface-elevated text-ink-primary hover:bg-surface-hover'}
      >
        {isMuted ? <MicOff className="size-6" /> : <Mic className="size-6 text-brand-200" />}
      </IconButton>

      {/* Audio Output Mode Switcher */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-surface-elevated border border-border-subtle">
        <button
          type="button"
          onClick={() => onChangeOutputMode('translated')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 ${
            outputMode === 'translated'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'text-ink-muted hover:text-ink-primary'
          }`}
          aria-pressed={outputMode === 'translated'}
        >
          Translated Audio
        </button>

        <button
          type="button"
          onClick={() => onChangeOutputMode('original')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 ${
            outputMode === 'original'
              ? 'bg-surface-card text-ink-primary border border-border-strong shadow-xs'
              : 'text-ink-muted hover:text-ink-primary'
          }`}
          aria-pressed={outputMode === 'original'}
        >
          Original Audio
        </button>

        <button
          type="button"
          onClick={() => onChangeOutputMode('standard_voice')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 ${
            outputMode === 'standard_voice'
              ? 'bg-surface-card text-purple-300 border border-purple-500/40 shadow-xs'
              : 'text-ink-muted hover:text-ink-primary'
          }`}
          aria-pressed={outputMode === 'standard_voice'}
          title="Disable voice cloning and use a standard synthesized voice"
        >
          Standard Voice
        </button>
      </div>

      {/* End Call Button */}
      <Button
        variant="danger"
        size="lg"
        onClick={onEndCall}
        leadingIcon={<PhoneOff className="size-5" />}
        className="rounded-full px-6 font-semibold"
      >
        End Call
      </Button>
    </div>
  );
};
