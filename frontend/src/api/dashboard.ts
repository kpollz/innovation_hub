import apiClient from './client';
import type { DashboardStats, TopContributor, Problem, Idea, DailyActivity, ActivityItem } from '@/types';

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

  getProblemsByCategory: async (range?: DateRangeParams): Promise<Record<string, number>> => {
    const response = await apiClient.get<Record<string, number>>('/dashboard/problems-by-category', {
      params: range,
    });
    return response.data;
  },

  getActivityOverTime: async (range?: DateRangeParams): Promise<DailyActivity[]> => {
    const response = await apiClient.get<DailyActivity[]>('/dashboard/activity-over-time', {
      params: range,
    });
    return response.data;
  },

  getRecentActivity: async (limit: number = 20): Promise<ActivityItem[]> => {
    const response = await apiClient.get<ActivityItem[]>(`/dashboard/recent-activity?limit=${limit}`);
    return response.data;
  },
};
