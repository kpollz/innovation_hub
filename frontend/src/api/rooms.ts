import apiClient from './client';
import type {
  Room,
  CreateRoom,
  PaginatedResponse,
} from '@/types';

interface RoomFilters {
  status?: string;
  problem_id?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export const roomsApi = {
  list: async (filters: RoomFilters = {}): Promise<PaginatedResponse<Room>> => {
    const params = new URLSearchParams();

    if (filters.status) params.append('status', filters.status);
    if (filters.problem_id) params.append('problem_id', filters.problem_id);
    if (filters.search) params.append('search', filters.search);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

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

  update: async (id: string, data: { name?: string; description?: string; status?: string }): Promise<Room> => {
    const response = await apiClient.patch<Room>(`/rooms/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/rooms/${id}`);
  },
};
