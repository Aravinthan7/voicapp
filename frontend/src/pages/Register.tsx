import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Radio, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { TextField } from '../components/common/TextField';
import { Select } from '../components/common/Select';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { InlineAlert } from '../components/common/InlineAlert';
import { getErrorMessage } from '../utils/errors';
import type { LanguageCode } from '../types';
import { SUPPORTED_LANGUAGES } from '../types';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [speakingLanguage, setSpeakingLanguage] = useState<LanguageCode>('ml-IN');
  const [listeningLanguage, setListeningLanguage] = useState<LanguageCode>('ta-IN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const languageOptions = Object.values(SUPPORTED_LANGUAGES).map((lang) => ({
    value: lang.code,
    label: lang.name,
    sublabel: lang.nativeName,
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
            Join VoiceApp to bridge Malayalam and Tamil conversations seamlessly
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border-subtle">
              <Select
                label="I speak"
                options={languageOptions}
                value={speakingLanguage}
                onChange={(e) => setSpeakingLanguage(e.target.value as LanguageCode)}
              />

              <Select
                label="I want to hear"
                options={languageOptions}
                value={listeningLanguage}
                onChange={(e) => setListeningLanguage(e.target.value as LanguageCode)}
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
              Register &amp; Continue
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
