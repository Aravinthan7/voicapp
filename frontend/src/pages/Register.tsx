import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Radio, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { TextField } from '../components/common/TextField';
import { Select } from '../components/common/Select';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { InlineAlert } from '../components/common/InlineAlert';
import { languageService } from '../services/languageService';
import { getErrorMessage } from '../utils/errors';
import type { SupportedLanguage } from '../types';

const DEFAULT_LANGUAGES: SupportedLanguage[] = [
  { code: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'en-IN', name: 'English', nativeName: 'English', flag: '🇮🇳' },
];

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [speakingLanguage, setSpeakingLanguage] = useState<string>('ml-IN');
  const [listeningLanguage, setListeningLanguage] = useState<string>('ta-IN');
  const [languages, setLanguages] = useState<SupportedLanguage[]>(DEFAULT_LANGUAGES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    languageService
      .getLanguages()
      .then((res) => {
        if (active && res.languages?.length > 0) {
          setLanguages(res.languages);
        }
      })
      .catch(() => {
        // Fall back gracefully to default languages
      });
    return () => {
      active = false;
    };
  }, []);

  const languageOptions = languages.map((lang) => ({
    value: lang.code,
    label: `${lang.nativeName} — ${lang.name}`,
    sublabel: lang.flag,
  }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!displayName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password should be at least 6 characters long.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await register({
        displayName: displayName.trim(),
        email: email.trim(),
        password,
        speakingLanguage,
        listeningLanguage,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center py-8">
      <div className="w-full max-w-md flex flex-col gap-6">
        <div className="text-center flex flex-col items-center gap-2">
          <div className="size-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
            <Radio className="size-6" />
          </div>
          <h1 className="text-2xl font-bold text-ink-primary">Create Your Account</h1>
          <p className="text-sm text-ink-secondary">
            Join VoiceApp to bridge live cross-lingual conversations seamlessly
          </p>
        </div>

        <Card elevated className="flex flex-col gap-5">
          {error && <InlineAlert type="error" message={error} />}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <TextField
              label="Your Name or Display Name"
              placeholder="e.g. Rahul Nair or Karthik Raman"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />

            <TextField
              label="Email Address"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <TextField
              label="Create Password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 gap-3 pt-2 border-t border-border-subtle">
              <Select
                label="I speak (My speaking language)"
                options={languageOptions}
                value={speakingLanguage}
                onChange={(e) => setSpeakingLanguage(e.target.value)}
              />

              <Select
                label="I want to hear (My listening language)"
                options={languageOptions}
                value={listeningLanguage}
                onChange={(e) => setListeningLanguage(e.target.value)}
                helperText="You will hear the other person translated into this language."
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              leadingIcon={<ArrowRight className="size-4" />}
              className="mt-2"
            >
              Register &amp; Create Workspace
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-ink-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-500 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
