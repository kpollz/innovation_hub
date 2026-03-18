import apiClient from './client';
import type {
  Idea,
  CreateIdea,
  UpdateIdea,
  PaginatedResponse,
  Vote,
  CreateVote,
  Reaction,
  ReactionType,
} from '@/types';

interface IdeaFilters {
  room_id?: string;
  author_id?: string;
  status?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export const ideasApi = {
  list: async (filters: IdeaFilters = {}): Promise<PaginatedResponse<Idea>> => {
    const params = new URLSearchParams();

    if (filters.room_id) params.append('room_id', filters.room_id);
    if (filters.author_id) params.append('author_id', filters.author_id);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<PaginatedResponse<Idea>>(`/ideas?${params}`);
    return response.data;
  },

  getById: async (id: string): Promise<Idea> => {
    const response = await apiClient.get<Idea>(`/ideas/${id}`);
    return response.data;
  },

  create: async (data: CreateIdea): Promise<Idea> => {
    const response = await apiClient.post<Idea>('/ideas', data);
    return response.data;
  },

  update: async (id: string, data: UpdateIdea): Promise<Idea> => {
    const response = await apiClient.patch<Idea>(`/ideas/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/ideas/${id}`);
  },

  // Votes
  vote: async (ideaId: string, data: CreateVote): Promise<Vote> => {
    const response = await apiClient.post<Vote>(`/ideas/${ideaId}/votes`, data);
    return response.data;
  },

  removeVote: async (ideaId: string): Promise<void> => {
    await apiClient.delete(`/ideas/${ideaId}/votes`);
  },

  // Reactions
  addReaction: async (ideaId: string, reactionType: ReactionType): Promise<Reaction> => {
    const response = await apiClient.post<Reaction>(`/ideas/${ideaId}/reactions`, {
      type: reactionType,
    });
    return response.data;
  },

  removeReaction: async (ideaId: string): Promise<void> => {
    await apiClient.delete(`/ideas/${ideaId}/reactions`);
  },
};
