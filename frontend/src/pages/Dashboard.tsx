import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PhoneCall, LogIn, Sparkles, ArrowRight, ShieldCheck, Languages } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { TextField } from '../components/common/TextField';
import { Select } from '../components/common/Select';
import { InlineAlert } from '../components/common/InlineAlert';
import { callService } from '../services/callService';
import { getErrorMessage } from '../utils/errors';
import type { LanguageCode } from '../types';
import { SUPPORTED_LANGUAGES } from '../types';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [primaryLang, setPrimaryLang] = useState<LanguageCode>(user?.speakingLanguage || 'ml-IN');
  const [secondaryLang, setSecondaryLang] = useState<LanguageCode>(user?.listeningLanguage || 'ta-IN');
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const languageOptions = Object.values(SUPPORTED_LANGUAGES).map((lang) => ({
    value: lang.code,
    label: lang.name,
    sublabel: lang.nativeName,
  }));

  const handleStartCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (primaryLang === secondaryLang) {
      setError('Please choose two distinct languages for a translated call (e.g. Malayalam and Tamil).');
      return;
    }

    setError(null);
    setCreating(true);
    try {
      const room = await callService.createRoom({
        primaryLanguage: primaryLang,
        secondaryLanguage: secondaryLang,
      });
      navigate(`/call/${room.code}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const handleJoinCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setError('Please enter a room code or invite link.');
      return;
    }

    setError(null);
    setJoining(true);
    try {
      // Extract raw code if full URL was pasted
      let code = joinCode.trim();
      if (code.includes('/call/')) {
        code = code.split('/call/')[1].split('?')[0];
      }

      const room = await callService.joinRoom({ codeOrId: code });
      navigate(`/call/${room.code}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 py-4">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-brand-600/20 via-surface-card to-surface-card border border-brand-500/30 shadow-lg">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-brand-200 tracking-wider uppercase">
            Live Audio Translation Workspace
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink-primary">
            Vanakkam &amp; Namaskaram, {user?.displayName || 'Friend'}!
          </h1>
          <p className="text-sm text-ink-secondary max-w-xl">
            Start a two-way live voice call where Malayalam and Tamil speech are automatically translated into each other's language.
          </p>
        </div>

        {/* Voice Profile shortcut badge */}
        <Link
          to="/profile/voice"
          className="self-start sm:self-center shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-surface-elevated hover:bg-surface-hover border border-purple-500/30 text-xs text-purple-200 transition-colors shadow-xs"
        >
          <Sparkles className="size-4 text-purple-400" />
          <div className="flex flex-col text-left">
            <span className="font-semibold">Voice Cloning Profile</span>
            <span className="text-[10px] text-ink-muted">Configure consent &amp; sample</span>
          </div>
        </Link>
      </div>

      {error && <InlineAlert type="error" message={error} />}

      {/* Main Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Start New Call */}
        <Card elevated className="flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-500">
                <PhoneCall className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-ink-primary">Start a New Call</h2>
                <p className="text-xs text-ink-muted">Create a private audio room with real-time translation</p>
              </div>
            </div>

            <form id="start-call-form" onSubmit={handleStartCall} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Your language"
                  options={languageOptions}
                  value={primaryLang}
                  onChange={(e) => setPrimaryLang(e.target.value as LanguageCode)}
                />
                <Select
                  label="Peer language"
                  options={languageOptions}
                  value={secondaryLang}
                  onChange={(e) => setSecondaryLang(e.target.value as LanguageCode)}
                />
              </div>

              <div className="p-3 rounded-xl bg-surface-elevated/70 border border-border-subtle text-xs text-ink-secondary flex items-center gap-2">
                <Languages className="size-4 text-brand-500 shrink-0" />
                <span>
                  Language channel will support simultaneous speech recognition and automatic synthesized playback.
                </span>
              </div>
            </form>
          </div>

          <Button
            type="submit"
            form="start-call-form"
            variant="primary"
            size="lg"
            fullWidth
            loading={creating}
            leadingIcon={<PhoneCall className="size-4" />}
          >
            Create Call Room
          </Button>
        </Card>

        {/* Card 2: Join Existing Call */}
        <Card elevated className="flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <LogIn className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-ink-primary">Join with Code or Link</h2>
                <p className="text-xs text-ink-muted">Enter a room code or paste an invitation link</p>
              </div>
            </div>

            <form id="join-call-form" onSubmit={handleJoinCall} className="flex flex-col gap-4">
              <TextField
                label="Room Code or Link"
                placeholder="e.g. VA-98234 or paste full invite URL"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                required
              />

              <div className="p-3 rounded-xl bg-surface-elevated/70 border border-border-subtle text-xs text-ink-secondary flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
                <span>
                  Calls are strictly limited to two participants. Direct WebRTC audio transport is encrypted end-to-end.
                </span>
              </div>
            </form>
          </div>

          <Button
            type="submit"
            form="join-call-form"
            variant="secondary"
            size="lg"
            fullWidth
            loading={joining}
            leadingIcon={<ArrowRight className="size-4" />}
          >
            Join Call Room
          </Button>
        </Card>
      </div>
    </div>
  );
};
