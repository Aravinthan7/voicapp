import { apiClient } from './api';
import type { Workspace, UsageSummary } from '../types';

export const workspaceService = {
  async getMyWorkspace(): Promise<Workspace> {
    const response = await apiClient.get<Workspace>('/workspaces/me');
    return response.data;
  },

  async getMyUsage(): Promise<UsageSummary> {
    const response = await apiClient.get<UsageSummary>('/workspaces/me/usage');
    return response.data;
  },
};
