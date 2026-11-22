import React from 'react';
import { Mic, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';

export type MicPermissionStatus = 'idle' | 'prompting' | 'granted' | 'denied' | 'unavailable';

interface MicPermissionGateProps {
  status: MicPermissionStatus;
  onRequestPermission: () => void;
  onContinueAnyway?: () => void;
}

export const MicPermissionGate: React.FC<MicPermissionGateProps> = ({
  status,
  onRequestPermission,
  onContinueAnyway,
}) => {
  if (status === 'granted') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <Card elevated className="max-w-md w-full flex flex-col items-center text-center p-6 gap-4 border-brand-500/30">
        {status === 'denied' ? (
          <>
            <div className="size-16 rounded-full bg-status-danger/15 flex items-center justify-center text-status-danger mb-1">
              <AlertTriangle className="size-8" />
            </div>
            <h2 className="text-xl font-bold text-ink-primary">Microphone Access Denied</h2>
            <p className="text-sm text-ink-secondary leading-relaxed">
              VoiceApp needs access to your microphone to capture your speech for real-time translation.
            </p>
            <div className="text-left w-full p-4 rounded-xl bg-surface-elevated text-xs text-ink-muted flex flex-col gap-2 border border-border-subtle">
              <span className="font-semibold text-ink-primary">How to enable:</span>
              <ol className="list-decimal list-inside space-y-1">
                <li>Click the camera/lock icon in your browser address bar.</li>
                <li>Change Microphone permission to <strong>Allow</strong>.</li>
                <li>Click the Retry button below or reload the page.</li>
              </ol>
            </div>
            <div className="flex gap-3 w-full mt-2">
              <Button fullWidth variant="primary" onClick={onRequestPermission} leadingIcon={<RefreshCw className="size-4" />}>
                Try Again
              </Button>
            </div>
          </>
        ) : status === 'unavailable' ? (
          <>
            <div className="size-16 rounded-full bg-status-warning/15 flex items-center justify-center text-status-warning mb-1">
              <AlertTriangle className="size-8" />
            </div>
            <h2 className="text-xl font-bold text-ink-primary">No Microphone Detected</h2>
            <p className="text-sm text-ink-secondary leading-relaxed">
              We could not find an available audio input device. Please connect a microphone or headset and try again.
            </p>
            <Button fullWidth variant="secondary" onClick={onRequestPermission} leadingIcon={<RefreshCw className="size-4" />}>
              Check Again
            </Button>
          </>
        ) : (
          <>
            <div className="size-16 rounded-full bg-brand-500/15 flex items-center justify-center text-brand-500 mb-1">
              <Mic className="size-8" />
            </div>
            <h2 className="text-xl font-bold text-ink-primary">Microphone Permission Required</h2>
            <p className="text-sm text-ink-secondary leading-relaxed">
              To join this live translated call, your browser will ask for microphone permission. Audio is streamed solely for live speech translation and is not recorded by default.
            </p>
            <div className="w-full flex items-center gap-2 p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-200">
              <ShieldCheck className="size-5 shrink-0 text-brand-500" />
              <span>We never store or share your call audio without explicit consent.</span>
            </div>
            <div className="flex flex-col gap-2.5 w-full mt-2">
              <Button
                fullWidth
                size="lg"
                variant="primary"
                onClick={onRequestPermission}
                loading={status === 'prompting'}
              >
                Allow Microphone & Join Call
              </Button>
              {onContinueAnyway && (
                <Button fullWidth size="sm" variant="ghost" onClick={onContinueAnyway}>
                  Listen Only (Muted)
                </Button>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
