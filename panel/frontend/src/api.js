import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const serversAPI = {
  getAll: () => api.get('/servers'),
  getById: (id) => api.get(`/servers/${id}`),
  create: (data) => {
    // Don't set Content-Type header manually - axios will set it with the correct boundary
    console.log('Sending server creation request with data:', data);
    return api.post('/servers', data);
  },
  start: (id) => api.post(`/servers/${id}/start`),
  stop: (id) => api.post(`/servers/${id}/stop`),
  restart: (id) => api.post(`/servers/${id}/restart`),
  delete: (id, removeData = false) => api.delete(`/servers/${id}?removeData=${removeData}`),
  getStats: (id) => api.get(`/servers/${id}/stats`),
  getSettings: (id) => api.get(`/servers/${id}/settings`),
  updateSettings: (id, settings) => api.put(`/servers/${id}/settings`, settings),
};

export const filesAPI = {
  list: (serverId, path = '/data') => api.get(`/files/${serverId}?path=${path}`),
  getContent: (serverId, path) => api.get(`/files/${serverId}/content?path=${path}`),
  setContent: (serverId, path, content) => api.put(`/files/${serverId}/content`, { path, content }),
  upload: (serverId, formData) => api.post(`/files/${serverId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  download: (serverId, path) => api.get(`/files/${serverId}/download?path=${path}`, {
    responseType: 'blob',
  }),
  delete: (serverId, path) => api.delete(`/files/${serverId}?path=${path}`),
  mkdir: (serverId, path) => api.post(`/files/${serverId}/mkdir`, { path }),
  rename: (serverId, oldPath, newPath) => api.post(`/files/${serverId}/rename`, { oldPath, newPath }),
  backup: (serverId) => api.post(`/files/${serverId}/backup`),
};

export const logsAPI = {
  get: (serverId, tail = 100, follow = false) => 
    api.get(`/logs/${serverId}?tail=${tail}&follow=${follow}`),
  getFiles: (serverId) => api.get(`/logs/${serverId}/files`),
  getFileContent: (serverId, filename, tail = 1000) => 
    api.get(`/logs/${serverId}/files/${filename}?tail=${tail}`),
};

export const consoleAPI = {
  exec: (serverId, command) => api.post(`/console/${serverId}/exec`, { command }),
  getHistory: (serverId) => api.get(`/console/${serverId}/history`),
};

export default api;
