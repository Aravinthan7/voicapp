import { apiClient } from './api';
import type { AuthResponse, User, LanguageCode } from '../types';

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface RegisterPayload {
  email: string;
  password?: string;
  displayName: string;
  speakingLanguage: LanguageCode;
  listeningLanguage: LanguageCode;
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', payload);
    return response.data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', payload);
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await apiClient.get<User>('/users/me');
    return response.data;
  },

  async updatePreferences(payload: {
    displayName?: string;
    speakingLanguage?: LanguageCode;
    listeningLanguage?: LanguageCode;
  }): Promise<User> {
    const response = await apiClient.patch<User>('/users/me', payload);
    return response.data;
  },
};
