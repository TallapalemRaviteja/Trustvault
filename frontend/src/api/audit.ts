import { apiRequest } from './client';
import { AuditEvent, AuditExplorerResponse, AuditIntegrityReport } from '../types';

export const auditApi = {
  explorer: async (params: {
    actor_id?: string;
    action?: string;
    resource_type?: string;
    outcome?: string;
    search?: string;
    page?: number;
    page_size?: number;
  } = {}): Promise<AuditExplorerResponse> => {
    const searchParams = new URLSearchParams();
    if (params.actor_id) searchParams.append('actor_id', params.actor_id);
    if (params.action) searchParams.append('action', params.action);
    if (params.resource_type) searchParams.append('resource_type', params.resource_type);
    if (params.outcome) searchParams.append('outcome', params.outcome);
    if (params.search) searchParams.append('search', params.search);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.page_size) searchParams.append('page_size', params.page_size.toString());

    return apiRequest<AuditExplorerResponse>(`/audit?${searchParams.toString()}`);
  },

  documentHistory: async (documentId: string): Promise<AuditEvent[]> => {
    return apiRequest<AuditEvent[]>(`/audit/document/${documentId}`);
  },

  verifyIntegrity: async (): Promise<AuditIntegrityReport> => {
    return apiRequest<AuditIntegrityReport>('/audit/verify');
  },

  createCheckpoint: async (): Promise<any> => {
    return apiRequest('/audit/checkpoint', { method: 'POST' });
  },
};
