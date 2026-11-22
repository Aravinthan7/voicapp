import { apiClient } from './api';
import type { CallRoom, LanguageCode } from '../types';

export interface CreateCallPayload {
  primaryLanguage: LanguageCode;
  secondaryLanguage: LanguageCode;
}

export interface JoinCallPayload {
  codeOrId: string;
}

export const callService = {
  async createRoom(payload: CreateCallPayload): Promise<CallRoom> {
    const response = await apiClient.post<CallRoom>('/calls', payload);
    return response.data;
  },

  async joinRoom(payload: JoinCallPayload): Promise<CallRoom> {
    const response = await apiClient.post<CallRoom>('/calls/join', payload);
    return response.data;
  },

  async getRoom(roomId: string): Promise<CallRoom> {
    const response = await apiClient.get<CallRoom>(`/calls/${roomId}`);
    return response.data;
  },

  async endCall(roomId: string): Promise<{ success: boolean }> {
    const response = await apiClient.post<{ success: boolean }>(`/calls/${roomId}/end`);
    return response.data;
  },
};
