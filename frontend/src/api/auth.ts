import apiClient from './client';
import type { User, UserLogin, UserRegister, ApiResponse } from '@/types';

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

interface LoginResponse extends AuthResponse {
  user: User;
}

export const authApi = {
  login: async (credentials: UserLogin): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', {
      username: credentials.username,
      password: credentials.password,
    });
    return response.data;
  },

  register: async (data: UserRegister): Promise<ApiResponse<User>> => {
    const response = await apiClient.post<ApiResponse<User>>('/auth/register', data);
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/users/me');
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  },
};
