import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Radio, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { TextField } from '../components/common/TextField';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { InlineAlert } from '../components/common/InlineAlert';
import { getErrorMessage } from '../utils/errors';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please provide both your email and password.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Demo user helper to quickly test Malayalam or Tamil participant
  const handleQuickDemo = async (demoEmail: string, demoPass: string) => {
    setError(null);
    setLoading(true);
    try {
      await login({ email: demoEmail, password: demoPass });
      navigate(from, { replace: true });
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
          <h1 className="text-2xl font-bold text-ink-primary">Welcome to VoiceApp</h1>
          <p className="text-sm text-ink-secondary">
            Sign in to start live translated voice calls in Malayalam &amp; Tamil
          </p>
        </div>

        <Card elevated className="flex flex-col gap-5">
          {error && <InlineAlert type="error" message={error} />}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              leadingIcon={<ArrowRight className="size-4" />}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Logins for Instant Testing */}
          <div className="pt-4 border-t border-border-subtle flex flex-col gap-2.5">
            <span className="text-xs font-medium text-ink-muted text-center">
              Quick Test Accounts (Malayalam &amp; Tamil pair):
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('malayalam.speaker@test.com', 'testpass123')}
                disabled={loading}
                className="p-2.5 rounded-xl bg-surface-card hover:bg-surface-elevated border border-border-subtle text-left text-xs text-ink-secondary hover:text-ink-primary transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5 font-semibold text-brand-200">
                  <UserCheck className="size-3.5" />
                  <span>Rahul (മലയാളം)</span>
                </div>
                <div className="text-[11px] text-ink-muted">Speaks Malayalam</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('tamil.speaker@test.com', 'testpass123')}
                disabled={loading}
                className="p-2.5 rounded-xl bg-surface-card hover:bg-surface-elevated border border-border-subtle text-left text-xs text-ink-secondary hover:text-ink-primary transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
                  <UserCheck className="size-3.5" />
                  <span>Karthik (தமிழ்)</span>
                </div>
                <div className="text-[11px] text-ink-muted">Speaks Tamil</div>
              </button>
            </div>
          </div>
        </Card>

        <p className="text-center text-xs text-ink-muted">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-500 font-medium hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};
