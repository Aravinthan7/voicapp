import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PhoneCall, LogIn, Sparkles, ArrowRight, ShieldCheck, Languages, Plus, BarChart3 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { TextField } from '../components/common/TextField';
import { Select } from '../components/common/Select';
import { InlineAlert } from '../components/common/InlineAlert';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { callService } from '../services/callService';
import { languageService } from '../services/languageService';
import { workspaceService } from '../services/workspaceService';
import { getErrorMessage } from '../utils/errors';
import type { SupportedLanguage, UsageSummary } from '../types';

const INITIAL_LANGUAGES: SupportedLanguage[] = [
  { code: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'en-IN', name: 'English', nativeName: 'English', flag: '🇮🇳' },
];

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [languages, setLanguages] = useState<SupportedLanguage[]>(INITIAL_LANGUAGES);
  const [primaryLang, setPrimaryLang] = useState<string>(user?.speakingLanguage || 'ml-IN');
  const [secondaryLang, setSecondaryLang] = useState<string>(user?.listeningLanguage || 'ta-IN');
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // SaaS Workspace & Usage state
  const [usage, setUsage] = useState<UsageSummary | null>(null);

  // Add Language Modal state
  const [showAddLangModal, setShowAddLangModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newNativeName, setNewNativeName] = useState('');
  const [newFlag, setNewFlag] = useState('🇮🇳');
  const [addingLang, setAddingLang] = useState(false);
  const [addLangError, setAddLangError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    // Load Languages
    languageService
      .getLanguages()
      .then((res) => {
        if (active && res.languages?.length > 0) {
          setLanguages(res.languages);
        }
      })
      .catch(() => {});

    // Load Workspace Usage
    workspaceService
      .getMyUsage()
      .then((res) => {
        if (active) setUsage(res);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const languageOptions = languages.map((lang) => ({
    value: lang.code,
    label: `${lang.nativeName} (${lang.name})`,
    sublabel: lang.flag,
  }));

  const handleStartCall = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleAddNewLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim() || !newNativeName.trim()) {
      setAddLangError('Please fill in language code, English name, and native script.');
      return;
    }

    setAddLangError(null);
    setAddingLang(true);
    try {
      const created = await languageService.addLanguage({
        code: newCode.trim(),
        name: newName.trim(),
        nativeName: newNativeName.trim(),
        flag: newFlag.trim() || '🇮🇳',
        sttSupported: true,
        translationSupported: true,
        ttsSupported: true,
        voiceCloningSupported: false,
      });

      // Enable bidirectional pair with existing primary language
      await languageService.addLanguagePair(primaryLang, created.code).catch(() => {});
      await languageService.addLanguagePair(created.code, primaryLang).catch(() => {});

      setLanguages((prev) => [...prev.filter((l) => l.code !== created.code), created]);
      setSecondaryLang(created.code);
      setShowAddLangModal(false);
      setNewCode('');
      setNewName('');
      setNewNativeName('');
    } catch (err) {
      setAddLangError(getErrorMessage(err));
    } finally {
      setAddingLang(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-brand-600/20 via-surface-card to-surface-card border border-brand-500/30 shadow-lg">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-brand-200 tracking-wider uppercase">
              SaaS Multi-Language Workspace
            </span>
            {usage && (
              <Badge tone="brand">
                {usage.planType.toUpperCase()} PLAN
              </Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink-primary">
            Vanakkam &amp; Namaskaram, {user?.displayName || 'Friend'}!
          </h1>
          <p className="text-sm text-ink-secondary max-w-xl">
            Live one-to-one voice calls between registered users with automated, receiver-directed speech translation.
          </p>
        </div>

        {/* Shortcuts */}
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
          <Link
            to="/profile/voice"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-surface-elevated hover:bg-surface-hover border border-purple-500/30 text-xs text-purple-200 transition-colors shadow-xs"
          >
            <Sparkles className="size-4 text-purple-400" />
            <div className="flex flex-col text-left">
              <span className="font-semibold">Voice Cloning Profile</span>
              <span className="text-[10px] text-ink-muted">Manage consent &amp; audio</span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setShowAddLangModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-surface-elevated hover:bg-surface-hover border border-border-subtle text-xs text-ink-primary transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="size-4 text-brand-500" />
            <div className="flex flex-col text-left">
              <span className="font-semibold">Add Language</span>
              <span className="text-[10px] text-ink-muted">Configure new option</span>
            </div>
          </button>
        </div>
      </div>

      {/* Workspace Usage Quota Banner */}
      {usage && (
        <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2.5">
            <BarChart3 className="size-4 text-brand-500" />
            <span className="text-ink-secondary">
              Workspace Usage: <strong>{usage.totalMinutesUsed} min</strong> used of{' '}
              <strong>{usage.monthlyMinuteLimit} min</strong> monthly limit.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-ink-muted">Remaining:</span>
            <span
              className={`font-semibold ${
                usage.minutesRemaining < 10 ? 'text-status-danger' : 'text-status-success'
              }`}
            >
              {usage.minutesRemaining} min
            </span>
          </div>
        </div>
      )}

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
                <h2 className="text-lg font-bold text-ink-primary">Start a One-to-One Call</h2>
                <p className="text-xs text-ink-muted">
                  Strictly 2 registered users &bull; Receiver decides what they hear
                </p>
              </div>
            </div>

            <form id="start-call-form" onSubmit={handleStartCall} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Your speaking language"
                  options={languageOptions}
                  value={primaryLang}
                  onChange={(e) => setPrimaryLang(e.target.value)}
                />
                <Select
                  label="Peer's expected language"
                  options={languageOptions}
                  value={secondaryLang}
                  onChange={(e) => setSecondaryLang(e.target.value)}
                />
              </div>

              <div className="p-3 rounded-xl bg-surface-elevated/70 border border-border-subtle text-xs text-ink-secondary flex items-center gap-2">
                <Languages className="size-4 text-brand-500 shrink-0" />
                <span>
                  The receiver will hear your speech in their chosen language. If both participants choose the same language, translation is automatically bypassed.
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
                <h2 className="text-lg font-bold text-ink-primary">Join Call with Code</h2>
                <p className="text-xs text-ink-muted">Enter room code or paste invitation link</p>
              </div>
            </div>

            <form id="join-call-form" onSubmit={handleJoinCall} className="flex flex-col gap-4">
              <TextField
                label="Room Code or Link"
                placeholder="e.g. VA-AB12 or paste full invite URL"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                required
              />

              <div className="p-3 rounded-xl bg-surface-elevated/70 border border-border-subtle text-xs text-ink-secondary flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
                <span>
                  Strictly one-to-one calling. Third participants are automatically rejected.
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

      {/* Add New Language Modal */}
      <Modal
        isOpen={showAddLangModal}
        onClose={() => setShowAddLangModal(false)}
        title="Add New Language Option"
        description="Register an additional language into your platform's supported language registry."
      >
        <form onSubmit={handleAddNewLanguage} className="flex flex-col gap-4 text-xs">
          {addLangError && <InlineAlert type="error" message={addLangError} />}

          <TextField
            label="BCP-47 Language Code"
            placeholder="e.g. hi-IN, te-IN, kn-IN, en-IN"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            required
          />

          <TextField
            label="English Language Name"
            placeholder="e.g. Hindi, Telugu, Kannada, English"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />

          <TextField
            label="Native Script Name"
            placeholder="e.g. हिन्दी, తెలుగు, ಕನ್ನಡ, English"
            value={newNativeName}
            onChange={(e) => setNewNativeName(e.target.value)}
            required
          />

          <TextField
            label="Flag Emoji"
            placeholder="🇮🇳"
            value={newFlag}
            onChange={(e) => setNewFlag(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-2 border-t border-border-subtle">
            <Button variant="ghost" onClick={() => setShowAddLangModal(false)} disabled={addingLang}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={addingLang}>
              Register Language
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
