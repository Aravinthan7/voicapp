import React from 'react';
import { AppHeader } from './AppHeader';
import { ShieldAlert } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  showAiDisclosure?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  showAiDisclosure = true,
}) => {
  return (
    <div className="min-h-dvh flex flex-col bg-surface-bg text-ink-primary">
      <AppHeader />

      {/* Third-party AI & Privacy Ambient Disclosure */}
      {showAiDisclosure && (
        <aside
          aria-label="AI and Privacy Disclosure"
          className="bg-surface-card/60 border-b border-border-subtle/60 py-2 px-4 text-center text-[11px] text-ink-muted flex items-center justify-center gap-2"
        >
          <ShieldAlert className="size-3.5 text-brand-500 shrink-0" />
          <span>
            Speech recognition & translation powered by streaming AI models. Calls are never recorded by default.
          </span>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col">
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border-subtle/40 py-4 px-6 text-center text-xs text-ink-disabled">
        <span>VoiceApp &copy; 2026 &bull; Malayalam &harr; Tamil Real-Time Audio Communication</span>
      </footer>
    </div>
  );
};
