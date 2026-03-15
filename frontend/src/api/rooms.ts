import apiClient from './client';
import type { 
  Room, 
  CreateRoom, 
  PaginatedResponse,
  Idea,
  CreateIdea,
  UpdateIdea,
  Vote,
  CreateVote,
  Comment,
  CreateComment 
} from '@/types';

interface RoomFilters {
  status?: string;
  page?: number;
  page_size?: number;
}

export const roomsApi = {
  list: async (filters: RoomFilters = {}): Promise<PaginatedResponse<Room>> => {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());

    const response = await apiClient.get<PaginatedResponse<Room>>(`/rooms?${params}`);
    return response.data;
  },

  getById: async (id: string): Promise<Room> => {
    const response = await apiClient.get<Room>(`/rooms/${id}`);
    return response.data;
  },

  create: async (data: CreateRoom): Promise<Room> => {
    const response = await apiClient.post<Room>('/rooms', data);
    return response.data;
  },

  close: async (id: string): Promise<Room> => {
    const response = await apiClient.post<Room>(`/rooms/${id}/close`);
    return response.data;
  },

  // Ideas
  listIdeas: async (roomId: string, status?: string): Promise<Idea[]> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    
    const response = await apiClient.get<Idea[]>(`/rooms/${roomId}/ideas?${params}`);
    return response.data;
  },

  createIdea: async (roomId: string, data: CreateIdea): Promise<Idea> => {
    const response = await apiClient.post<Idea>(`/rooms/${roomId}/ideas`, data);
    return response.data;
  },

  updateIdea: async (roomId: string, ideaId: string, data: UpdateIdea): Promise<Idea> => {
    const response = await apiClient.put<Idea>(`/rooms/${roomId}/ideas/${ideaId}`, data);
    return response.data;
  },

  // Votes
  voteIdea: async (roomId: string, ideaId: string, data: CreateVote): Promise<Vote> => {
    const response = await apiClient.post<Vote>(`/rooms/${roomId}/ideas/${ideaId}/vote`, data);
    return response.data;
  },

  // Comments
  listComments: async (roomId: string, ideaId: string): Promise<Comment[]> => {
    const response = await apiClient.get<Comment[]>(`/rooms/${roomId}/ideas/${ideaId}/comments`);
    return response.data;
  },

  addComment: async (roomId: string, ideaId: string, data: CreateComment): Promise<Comment> => {
    const response = await apiClient.post<Comment>(`/rooms/${roomId}/ideas/${ideaId}/comments`, data);
    return response.data;
  },

  deleteComment: async (roomId: string, ideaId: string, commentId: string): Promise<void> => {
    await apiClient.delete(`/rooms/${roomId}/ideas/${ideaId}/comments/${commentId}`);
  },
};
