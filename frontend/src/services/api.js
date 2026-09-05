import axios from 'axios';
import { supabase, isAuthEnabled } from './supabase';

let rawUrl = import.meta.env.VITE_API_URL || '';
if (rawUrl.endsWith('/api')) {
  rawUrl = rawUrl.slice(0, -4);
}

const api = axios.create({
  baseURL: rawUrl || '',
  timeout: 600000, // 10 minutes for heavy multi-modal inference
});

// Attach Supabase JWT token to all requests when auth is enabled
api.interceptors.request.use(async (config) => {
  if (!isAuthEnabled()) return config;

  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && isAuthEnabled()) {
      originalRequest._retry = true;
      const { data: { session } } = await supabase.auth.refreshSession();
      if (session?.access_token) {
        originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
        return api(originalRequest);
      }
    }
    return Promise.reject(error);
  },
);

export const forensicApi = {
  getStatus: async () => {
    const response = await api.get('/api/v1/models/status');
    return response.data;
  },

  getHealth: async () => {
    const response = await api.get('/api/v1/health');
    return response.data;
  },

  analyzeImage: async (file, mode = 'ensemble', reverseSearch = false, { signal } = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    const modeParam = mode.toLowerCase().includes('fast') ? 'fast' : 'ensemble';
    const response = await api.post(
      `/api/v1/analyze/image?mode=${modeParam}&reverse_search=${reverseSearch}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' }, signal },
    );
    return response.data;
  },

  analyzeVideo: async (file, fps = 1, aggregation = 'weighted_avg', mode = 'ensemble', { signal } = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(
      `/api/v1/analyze/video?fps=${fps}&aggregation=${aggregation}&mode=${mode}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' }, signal },
    );
    return response.data;
  },

  analyzeAudio: async (file, { signal } = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/v1/analyze/audio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      signal,
    });
    return response.data;
  },

  analyzeDocument: async (file, idType = '', idNumber = '', reverseSearch = false, { signal } = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    if (idType) formData.append('id_type', idType);
    if (idNumber) formData.append('id_number', idNumber);
    const response = await api.post(
      `/api/v1/analyze/document?reverse_search=${reverseSearch}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' }, signal },
    );
    return response.data;
  },

  analyzeMultimodal: async (image, video, audio, { signal } = {}) => {
    const formData = new FormData();
    if (image) formData.append('image', image);
    if (video) formData.append('video', video);
    if (audio) formData.append('audio', audio);
    const response = await api.post('/api/v1/analyze/multimodal', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      signal,
    });
    return response.data;
  },

  generateComplaint: async (analysis, fileName, complainant, idProofFile) => {
    const formData = new FormData();
    formData.append('analysis', JSON.stringify(analysis));
    formData.append('file_name', fileName || '');
    formData.append('name', complainant.name);
    formData.append('phone', complainant.phone || '');
    formData.append('email', complainant.email || '');
    formData.append('address', complainant.address || '');
    formData.append('incident_description', complainant.incidentDescription || '');
    if (idProofFile) formData.append('id_proof', idProofFile);

    const response = await api.post('/api/v1/complaint/generate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      responseType: 'blob',
    });
    const disposition = response.headers['content-disposition'] || '';
    const match = disposition.match(/filename="?([^"]+)"?/);
    return {
      blob: response.data,
      filename: match ? match[1] : 'cyber_complaint.html',
    };
  },

  getHistory: async (limit = 20, mediaType = null) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (mediaType) params.set('media_type', mediaType);
    const response = await api.get(`/api/v1/history?${params}`);
    return response.data;
  },

  getAnalysis: async (id) => {
    const response = await api.get(`/api/v1/history/${id}`);
    return response.data;
  },
};
