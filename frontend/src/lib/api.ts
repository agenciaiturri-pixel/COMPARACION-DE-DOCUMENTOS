import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001'
});

export interface UploadResponse {
  id: string;
  filename: string;
  originalName: string;
  mimeType?: string | null;
  type: string;
  extractedFields: Record<string, string | number | null>;
  createdAt: string;
}

export interface ComparisonFieldResponse {
  field: string;
  label: string;
  values: Record<string, string | number | null>;
  status: 'MATCH' | 'DIFFERENT' | 'MISSING';
  critical?: boolean;
}

export interface ComparisonResultResponse {
  id: string;
  documents: UploadResponse[];
  result: ComparisonFieldResponse[];
  hasCriticalAlerts: boolean;
  createdAt: string;
}

export const ApiService = {
  setAuthToken(token?: string) {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common.Authorization;
    }
  },

  async login(email: string, password: string) {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data as { accessToken: string };
  },

  async uploadDocuments(formData: FormData) {
    const response = await api.post('/api/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data as UploadResponse[];
  },

  async compare(documentIds: string[]) {
    const response = await api.post('/api/comparison/run', { documentIds });
    return response.data as ComparisonResultResponse;
  },

  async getHistory() {
    const response = await api.get('/api/history');
    return response.data as ComparisonResultResponse[];
  },

  async downloadReport(id: string, type: 'excel' | 'pdf') {
    const response = await api.get(`/api/reports/${id}/${type}`, {
      responseType: 'blob'
    });
    return response.data as Blob;
  }
};

export default api;
