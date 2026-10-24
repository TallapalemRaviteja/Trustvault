const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('trustvault_token');
  const correlationId = 'req_' + Math.random().toString(36).substring(2, 11);

  const headers: Record<string, string> = {
    'X-Request-ID': correlationId,
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is NOT FormData, set application/json
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle Unauthorized (expired or invalid token)
  if (response.status === 401) {
    localStorage.removeItem('trustvault_token');
    localStorage.removeItem('trustvault_user');
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login?session_expired=1';
    }
  }

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    let errorData = null;
    try {
      errorData = await response.json();
      if (errorData?.detail) {
        errorDetail = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
      }
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    throw new ApiError(response.status, errorDetail, errorData);
  }

  // If response is a file download (e.g. application/pdf, octet-stream)
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/octet-stream') || contentType.includes('application/pdf') || response.headers.get('content-disposition')) {
    const blob = await response.blob();
    return blob as unknown as T;
  }

  return response.json();
}
