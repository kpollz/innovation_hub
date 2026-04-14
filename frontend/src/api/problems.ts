import apiClient from './client';
import type {
  Problem,
  CreateProblem,
  UpdateProblem,
  ProblemFilters,
  PaginatedResponse,
  Reaction,
  ReactionType
} from '@/types';

export const problemsApi = {
  list: async (filters: ProblemFilters = {}): Promise<PaginatedResponse<Problem>> => {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    if (filters.author_id) params.append('author_id', filters.author_id);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<PaginatedResponse<Problem>>(`/problems?${params}`);
    return response.data;
  },

  getById: async (id: string): Promise<Problem> => {
    const response = await apiClient.get<Problem>(`/problems/${id}`);
    return response.data;
  },

  create: async (data: CreateProblem): Promise<Problem> => {
    const response = await apiClient.post<Problem>('/problems', data);
    return response.data;
  },

  update: async (id: string, data: UpdateProblem): Promise<Problem> => {
    const response = await apiClient.patch<Problem>(`/problems/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/problems/${id}`);
  },

  addReaction: async (problemId: string, reactionType: ReactionType): Promise<Reaction> => {
    const response = await apiClient.post<Reaction>(`/problems/${problemId}/reactions`, {
      type: reactionType,
    });
    return response.data;
  },

  removeReaction: async (problemId: string): Promise<void> => {
    await apiClient.delete(`/problems/${problemId}/reactions`);
  },

  createRoom: async (problemId: string, data: { name: string; description?: string; visibility?: string; shared_user_ids?: string[] }): Promise<unknown> => {
    const response = await apiClient.post(`/problems/${problemId}/rooms`, data);
    return response.data;
  },
};
