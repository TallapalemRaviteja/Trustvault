import { apiRequest } from './client';
import { User, UserRole } from '../types';

export const usersApi = {
  list: async (search?: string): Promise<User[]> => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiRequest<User[]>(`/users${query}`);
  },

  getProfile: async (id: string): Promise<User> => {
    return apiRequest<User>(`/users/${id}`);
  },

  updateRole: async (id: string, role: UserRole): Promise<User> => {
    return apiRequest<User>(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  updateStatus: async (id: string, isActive: boolean): Promise<User> => {
    return apiRequest<User>(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    });
  },
};
