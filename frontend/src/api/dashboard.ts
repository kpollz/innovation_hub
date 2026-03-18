import apiClient from './client';
import type { DashboardStats, TopContributor, Problem, Idea } from '@/types';

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },

  getTopContributors: async (limit: number = 10): Promise<TopContributor[]> => {
    const response = await apiClient.get<TopContributor[]>(`/dashboard/top-contributors?limit=${limit}`);
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
