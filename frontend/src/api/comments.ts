import apiClient from './client';
import type { Comment, PaginatedResponse } from '@/types';

interface CommentFilters {
  target_id?: string;
  target_type?: string;
  page?: number;
  page_size?: number;
}

export const commentsApi = {
  list: async (filters: CommentFilters = {}): Promise<PaginatedResponse<Comment>> => {
    const params = new URLSearchParams();
    
    if (filters.target_id) params.append('target_id', filters.target_id);
    if (filters.target_type) params.append('target_type', filters.target_type);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());

    const response = await apiClient.get<PaginatedResponse<Comment>>(`/comments?${params}`);
    return response.data;
  },

  create: async (data: { target_id: string; target_type: string; content: string }): Promise<Comment> => {
    const response = await apiClient.post<Comment>('/comments', data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/comments/${id}`);
  },
};
