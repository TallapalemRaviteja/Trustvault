import { apiRequest } from './client';
import { AdminStats, AuditEvent } from '../types';

export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    return apiRequest<AdminStats>('/admin/stats');
  },

  getAlerts: async (limit: number = 15): Promise<AuditEvent[]> => {
    return apiRequest<AuditEvent[]>(`/admin/alerts?limit=${limit}`);
  },
};
