import { apiRequest } from './client';
import { DocumentPermission } from '../types';

export const permissionsApi = {
  grant: async (
    documentId: string,
    userId: string,
    permission: 'READ' | 'EDIT'
  ): Promise<DocumentPermission> => {
    return apiRequest<DocumentPermission>(`/documents/${documentId}/permissions`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, permission }),
    });
  },

  list: async (documentId: string): Promise<DocumentPermission[]> => {
    return apiRequest<DocumentPermission[]>(`/documents/${documentId}/permissions`);
  },

  update: async (
    documentId: string,
    permissionId: string,
    permission: 'READ' | 'EDIT'
  ): Promise<DocumentPermission> => {
    return apiRequest<DocumentPermission>(`/documents/${documentId}/permissions/${permissionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ permission }),
    });
  },

  revoke: async (
    documentId: string,
    permissionId: string
  ): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/documents/${documentId}/permissions/${permissionId}`, {
      method: 'DELETE',
    });
  },
};
