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
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());

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
    const response = await apiClient.put<Problem>(`/problems/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/problems/${id}`);
  },

  addReaction: async (problemId: string, reactionType: ReactionType): Promise<Reaction> => {
    const response = await apiClient.post<Reaction>(`/problems/${problemId}/reactions`, {
      reaction_type: reactionType,
    });
    return response.data;
  },

  removeReaction: async (problemId: string): Promise<void> => {
    await apiClient.delete(`/problems/${problemId}/reactions`);
  },
};
