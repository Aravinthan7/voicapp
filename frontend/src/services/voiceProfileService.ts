import { apiClient } from './api';
import type { VoiceProfile, VoiceConsentRecord } from '../types';

export const voiceProfileService = {
  async getProfile(): Promise<VoiceProfile> {
    const response = await apiClient.get<VoiceProfile>('/voice-profiles/me');
    return response.data;
  },

  async recordConsent(consentTextVersion: string): Promise<VoiceConsentRecord> {
    const response = await apiClient.post<VoiceConsentRecord>('/voice-profiles/consent', {
      consentTextVersion,
    });
    return response.data;
  },

  async uploadVoiceSample(formData: FormData): Promise<VoiceProfile> {
    const response = await apiClient.post<VoiceProfile>('/voice-profiles/sample', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async testVoicePlayback(text: string, targetLanguage: string): Promise<{ audioUrl: string }> {
    const response = await apiClient.post<{ audioUrl: string }>('/voice-profiles/test-playback', {
      text,
      targetLanguage,
    });
    return response.data;
  },

  async deleteProfile(): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      '/voice-profiles/me'
    );
    return response.data;
  },
};
