import { createContext } from 'react';
import type { User } from '../types';
import type { LoginPayload, RegisterPayload } from '../services/authService';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export interface AuthContextType {
  user: User | null;
  status: AuthStatus;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
