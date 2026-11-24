import React, { useRef, useEffect } from 'react';
import { Subtitles, Trash2 } from 'lucide-react';
import type { CaptionItem } from '../../types';

interface CaptionsPanelProps {
  captions: CaptionItem[];
  onClearCaptions?: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

const LANGUAGE_NAMES: Record<string, string> = {
  'ml-IN': 'Malayalam',
  'ta-IN': 'Tamil',
  'hi-IN': 'Hindi',
  'te-IN': 'Telugu',
  'kn-IN': 'Kannada',
  'en-IN': 'English',
};

export const CaptionsPanel: React.FC<CaptionsPanelProps> = ({
  captions,
  onClearCaptions,
  isOpen,
  onToggleOpen,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [captions, isOpen]);

  return (
    <div className="w-full rounded-2xl bg-surface-card/90 border border-border-subtle overflow-hidden transition-all duration-200">
      <div className="flex items-center justify-between px-4 py-3 bg-surface-elevated/60 border-b border-border-subtle">
        <button
          type="button"
          onClick={onToggleOpen}
          className="inline-flex items-center gap-2 text-sm font-medium text-ink-primary hover:text-brand-200 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg px-1.5 py-0.5"
          aria-expanded={isOpen}
        >
          <Subtitles className="size-4 text-brand-500" />
          <span>Live Audio Captions (Multilingual)</span>
          <span className="text-xs text-ink-muted">({captions.length})</span>
        </button>

        {isOpen && onClearCaptions && captions.length > 0 && (
          <button
            type="button"
            onClick={onClearCaptions}
            className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-status-danger cursor-pointer p-1 rounded-md"
            title="Clear captions window"
          >
            <Trash2 className="size-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {isOpen && (
        <div
          ref={scrollRef}
          role="region"
          aria-label="Real-time translation captions"
          aria-live="polite"
          className="max-h-56 overflow-y-auto p-4 flex flex-col gap-3 text-sm"
        >
          {captions.length === 0 ? (
            <p className="text-xs text-ink-muted text-center py-4 italic">
              Spoken dialogue and real-time receiver-directed translations will appear here...
            </p>
          ) : (
            captions.map((item) => {
              const origName = LANGUAGE_NAMES[item.originalLanguage] || item.originalLanguage;
              const targetName = LANGUAGE_NAMES[item.targetLanguage] || item.targetLanguage;

              return (
                <div
                  key={item.id}
                  className={`flex flex-col gap-1 p-2.5 rounded-xl border transition-opacity ${
                    item.isFinal
                      ? 'bg-surface-elevated/40 border-border-subtle'
                      : 'bg-surface-elevated/20 border-dashed border-border-subtle opacity-70 italic'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-ink-muted">
                    <span className="font-semibold text-ink-primary">
                      {item.speakerName}
                    </span>
                    <span>
                      {origName} &rarr; {targetName}
                    </span>
                  </div>

                  {/* Original Spoken Text */}
                  <div className="text-ink-secondary text-sm font-normal">
                    <span className="text-xs text-ink-muted mr-1.5 font-medium">Original:</span>
                    <span>{item.originalText}</span>
                  </div>

                  {/* Translated Text (or Passthrough notice) */}
                  {item.isPassthrough ? (
                    <div className="text-ink-muted text-xs italic">
                      (Same listening language — original audio delivered directly)
                    </div>
                  ) : (
                    <div className="text-emerald-300 font-medium text-sm">
                      <span className="text-xs text-emerald-400/80 mr-1.5 font-medium">Translated:</span>
                      <span>{item.translatedText}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
