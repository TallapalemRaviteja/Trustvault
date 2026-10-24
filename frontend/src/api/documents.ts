import { apiRequest } from './client';
import { DocumentDetail, DocumentItem, DocumentListResponse, DocumentVersion } from '../types';

export interface UploadDocumentParams {
  title: string;
  description?: string;
  category: string;
  tags?: string;
  sensitivity: string;
  file: File;
}

export const documentsApi = {
  list: async (params: {
    search?: string;
    category?: string;
    sensitivity?: string;
    include_deleted?: boolean;
    page?: number;
    page_size?: number;
  } = {}): Promise<DocumentListResponse> => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.append('search', params.search);
    if (params.category) searchParams.append('category', params.category);
    if (params.sensitivity) searchParams.append('sensitivity', params.sensitivity);
    if (params.include_deleted) searchParams.append('include_deleted', 'true');
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.page_size) searchParams.append('page_size', params.page_size.toString());

    return apiRequest<DocumentListResponse>(`/documents?${searchParams.toString()}`);
  },

  get: async (id: string): Promise<DocumentDetail> => {
    return apiRequest<DocumentDetail>(`/documents/${id}`);
  },

  upload: async (params: UploadDocumentParams): Promise<DocumentItem> => {
    const formData = new FormData();
    formData.append('title', params.title);
    if (params.description) formData.append('description', params.description);
    formData.append('category', params.category);
    if (params.tags) formData.append('tags', params.tags);
    formData.append('sensitivity', params.sensitivity);
    formData.append('file', params.file);

    return apiRequest<DocumentItem>('/documents/upload', {
      method: 'POST',
      body: formData,
    });
  },

  download: async (id: string, filename: string): Promise<void> => {
    const blob = await apiRequest<Blob>(`/documents/${id}/download`);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  updateMetadata: async (
    id: string,
    data: {
      title?: string;
      description?: string;
      category?: string;
      tags?: string;
      sensitivity?: string;
    }
  ): Promise<DocumentItem> => {
    return apiRequest<DocumentItem>(`/documents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  replaceContent: async (
    id: string,
    file: File,
    changeSummary?: string
  ): Promise<DocumentItem> => {
    const formData = new FormData();
    formData.append('file', file);
    if (changeSummary) formData.append('change_summary', changeSummary);

    return apiRequest<DocumentItem>(`/documents/${id}/replace`, {
      method: 'POST',
      body: formData,
    });
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/documents/${id}`, {
      method: 'DELETE',
    });
  },

  restore: async (id: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/documents/${id}/restore`, {
      method: 'POST',
    });
  },

  getVersions: async (id: string): Promise<DocumentVersion[]> => {
    return apiRequest<DocumentVersion[]>(`/documents/${id}/versions`);
  },

  downloadVersion: async (
    id: string,
    versionNumber: number,
    filename: string
  ): Promise<void> => {
    const blob = await apiRequest<Blob>(`/documents/${id}/versions/${versionNumber}/download`);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `v${versionNumber}_${filename}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
