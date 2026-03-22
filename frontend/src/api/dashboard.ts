import apiClient from './client';
import type { DashboardStats, TopContributor, Problem, Idea } from '@/types';

export interface DateRangeParams {
  date_from?: string;  // YYYY-MM-DD
  date_to?: string;    // YYYY-MM-DD
}

export const dashboardApi = {
  getStats: async (range?: DateRangeParams): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/dashboard/stats', {
      params: range,
    });
    return response.data;
  },

  getTopContributors: async (limit: number = 10, range?: DateRangeParams): Promise<TopContributor[]> => {
    const response = await apiClient.get<TopContributor[]>('/dashboard/top-contributors', {
      params: { limit, ...range },
    });
    return response.data;
  },

  getRecentProblems: async (limit: number = 5): Promise<Problem[]> => {
    const response = await apiClient.get<Problem[]>(`/dashboard/recent-problems?limit=${limit}`);
    return response.data;
  },

  getRecentIdeas: async (limit: number = 5): Promise<Idea[]> => {
    const response = await apiClient.get<Idea[]>(`/dashboard/recent-ideas?limit=${limit}`);
    return response.data;
  },
};
