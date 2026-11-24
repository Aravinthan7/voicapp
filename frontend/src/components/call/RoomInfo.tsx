import React, { useState } from 'react';
import { Copy, Check, Hash, Globe, Users } from 'lucide-react';
import type { CallRoom } from '../../types';
import { Badge } from '../common/Badge';

interface RoomInfoProps {
  room: CallRoom;
}

const LANGUAGE_LABELS: Record<string, string> = {
  'ml-IN': 'മലയാളം (Malayalam)',
  'ta-IN': 'தமிழ் (Tamil)',
  'hi-IN': 'हिन्दी (Hindi)',
  'te-IN': 'తెలుగు (Telugu)',
  'kn-IN': 'ಕನ್ನಡ (Kannada)',
  'en-IN': 'English',
};

export const RoomInfo: React.FC<RoomInfoProps> = ({ room }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const inviteUrl = `${window.location.origin}/call/${room.code}`;
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback
    }
  };

  const primaryLabel = LANGUAGE_LABELS[room.primaryLanguage] || room.primaryLanguage;
  const secondaryLabel = LANGUAGE_LABELS[room.secondaryLanguage] || room.secondaryLanguage;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-surface-card/60 border border-border-subtle w-full text-xs">
      <div className="flex items-center gap-3">
        {/* Room Code */}
        <div className="flex items-center gap-1.5 font-mono bg-surface-elevated px-2.5 py-1 rounded-xl border border-border-subtle">
          <Hash className="size-3.5 text-brand-500" />
          <span className="font-semibold text-ink-primary tracking-wider">{room.code}</span>
        </div>

        {/* Copy Invite Link */}
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-surface-elevated hover:bg-surface-hover text-ink-secondary hover:text-ink-primary border border-border-subtle transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
          title="Copy invite link to clipboard"
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-status-success" />
              <span className="text-status-success font-medium">Link Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              <span>Copy Invite</span>
            </>
          )}
        </button>

        {/* 1-to-1 strict indicator */}
        <div className="hidden sm:flex items-center gap-1 text-ink-muted text-[11px] bg-surface-elevated/40 px-2 py-0.5 rounded-lg border border-border-subtle">
          <Users className="size-3 text-brand-400" />
          <span>One-to-One (Max 2 Users)</span>
        </div>
      </div>

      {/* Language Pair */}
      <div className="flex items-center gap-2">
        <Globe className="size-3.5 text-ink-muted" />
        <span className="text-ink-muted">Channel:</span>
        <Badge tone="brand">
          {primaryLabel} &harr; {secondaryLabel}
        </Badge>
      </div>
    </div>
  );
};
