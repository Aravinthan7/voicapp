import { apiClient } from './api';
import type { SupportedLanguagesResponse, SupportedLanguage, LanguagePair } from '../types';

export interface CreateLanguagePayload {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
  sttSupported?: boolean;
  translationSupported?: boolean;
  ttsSupported?: boolean;
  voiceCloningSupported?: boolean;
}

export const languageService = {
  async getLanguages(): Promise<SupportedLanguagesResponse> {
    const response = await apiClient.get<SupportedLanguagesResponse>('/languages');
    return response.data;
  },

  async addLanguage(payload: CreateLanguagePayload): Promise<SupportedLanguage> {
    const response = await apiClient.post<SupportedLanguage>('/languages', payload);
    return response.data;
  },

  async addLanguagePair(sourceLanguage: string, targetLanguage: string): Promise<LanguagePair> {
    const response = await apiClient.post<LanguagePair>('/languages/pairs', {
      sourceLanguage,
      targetLanguage,
    });
    return response.data;
  },

  async validatePair(source: string, target: string): Promise<{ isValid: boolean }> {
    const response = await apiClient.get<{ source: string; target: string; isValid: boolean }>(
      '/languages/validate-pair',
      {
        params: { source, target },
      }
    );
    return response.data;
  },
};
