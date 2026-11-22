import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Radio, Mic, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../common/Avatar';
import { SUPPORTED_LANGUAGES } from '../../types';

export const AppHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const speaking = user ? SUPPORTED_LANGUAGES[user.speakingLanguage] : null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-subtle bg-surface-bg/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 font-bold text-lg text-ink-primary hover:opacity-90 transition-opacity focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg p-1"
        >
          <div className="size-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <Radio className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className="leading-tight tracking-tight">VoiceApp</span>
            <span className="text-[10px] text-ink-muted font-normal">Malayalam &bull; Tamil Live Call</span>
          </div>
        </Link>

        {/* User Navigation */}
        {user ? (
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Voice Profile Setup Shortcut */}
            <Link
              to="/profile/voice"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-surface-card hover:bg-surface-elevated text-ink-secondary hover:text-ink-primary border border-border-subtle transition-colors"
            >
              <Mic className="size-3.5 text-purple-400" />
              <span>Voice Profile</span>
            </Link>

            {/* User Info */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-border-subtle">
              <Avatar name={user.displayName} size="sm" />
              <div className="hidden md:flex flex-col text-xs text-left">
                <span className="font-semibold text-ink-primary leading-tight">
                  {user.displayName}
                </span>
                <span className="text-ink-muted text-[11px]">
                  {speaking?.nativeName || user.speakingLanguage}
                </span>
              </div>
            </div>

            {/* Sign Out */}
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl text-ink-muted hover:text-status-danger hover:bg-surface-card transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="text-xs font-medium px-3.5 py-2 rounded-xl text-ink-secondary hover:text-ink-primary hover:bg-surface-card transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-xs font-medium px-3.5 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-500 transition-colors shadow-xs"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
