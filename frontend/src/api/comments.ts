import apiClient from './client';
import type { Comment, CreateComment, PaginatedResponse } from '@/types';

interface CommentFilters {
  target_id?: string;
  target_type?: string;
  page?: number;
  limit?: number;
}

export const commentsApi = {
  list: async (filters: CommentFilters = {}): Promise<PaginatedResponse<Comment>> => {
    const params = new URLSearchParams();

    if (filters.target_id) params.append('target_id', filters.target_id);
    if (filters.target_type) params.append('target_type', filters.target_type);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<PaginatedResponse<Comment>>(`/comments?${params}`);
    return response.data;
  },

  create: async (data: CreateComment): Promise<Comment> => {
    const response = await apiClient.post<Comment>('/comments', data);
    return response.data;
  },

  update: async (id: string, content: string): Promise<Comment> => {
    const response = await apiClient.patch<Comment>(`/comments/${id}`, { content });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/comments/${id}`);
  },
};
