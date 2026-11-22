import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { authService, type LoginPayload, type RegisterPayload } from '../services/authService';
import { AuthContext, type AuthStatus } from './authContextInstance';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem('voiceapp_user');
    if (cached) {
      try {
        return JSON.parse(cached) as User;
      } catch {
        // Ignore JSON error
      }
    }
    return null;
  });

  const [status, setStatus] = useState<AuthStatus>(() => {
    return localStorage.getItem('voiceapp_token') ? 'authenticated' : 'anonymous';
  });

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('voiceapp_token');
    if (!token) return;

    authService
      .getMe()
      .then((freshUser) => {
        if (!active) return;
        setUser(freshUser);
        localStorage.setItem('voiceapp_user', JSON.stringify(freshUser));
        setStatus('authenticated');
      })
      .catch(() => {
        if (!active) return;
        localStorage.removeItem('voiceapp_token');
        localStorage.removeItem('voiceapp_user');
        setUser(null);
        setStatus('anonymous');
      });

    return () => {
      active = false;
    };
  }, []);

  const login = async (payload: LoginPayload) => {
    const res = await authService.login(payload);
    localStorage.setItem('voiceapp_token', res.accessToken);
    localStorage.setItem('voiceapp_user', JSON.stringify(res.user));
    setUser(res.user);
    setStatus('authenticated');
  };

  const register = async (payload: RegisterPayload) => {
    const res = await authService.register(payload);
    localStorage.setItem('voiceapp_token', res.accessToken);
    localStorage.setItem('voiceapp_user', JSON.stringify(res.user));
    setUser(res.user);
    setStatus('authenticated');
  };

  const logout = () => {
    localStorage.removeItem('voiceapp_token');
    localStorage.removeItem('voiceapp_user');
    setUser(null);
    setStatus('anonymous');
  };

  const refreshUser = async () => {
    try {
      const freshUser = await authService.getMe();
      setUser(freshUser);
      localStorage.setItem('voiceapp_user', JSON.stringify(freshUser));
    } catch {
      // Ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
