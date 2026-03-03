import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach token and tenant
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
  if (tenant?.subdomain) config.headers['X-Tenant-ID'] = tenant.subdomain;

  return config;
});

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('tenant');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Tenant
export const tenantAPI = {
  getCurrent: () => api.get('/tenants/current'),
  updateBranding: (data) => api.put('/tenants/branding', data),
  updateSettings: (data) => api.put('/tenants/settings', data),
  checkSubdomain: (subdomain) => api.get(`/tenants/check-subdomain/${subdomain}`),
};

// Users
export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// Analytics
export const analyticsAPI = {
  getOverview: (params) => api.get('/analytics/overview', { params }),
  getLogs: (params) => api.get('/analytics/logs', { params }),
  getReports: () => api.get('/analytics/reports'),
  generateReport: () => api.post('/analytics/generate-report'),
  logAction: (data) => api.post('/analytics/log', data),
};

// Uploads
export const uploadAPI = {
  uploadLogo: (file) => {
    const form = new FormData();
    form.append('logo', file);
    return api.post('/uploads/logo', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  uploadAvatar: (file) => {
    const form = new FormData();
    form.append('avatar', file);
    return api.post('/uploads/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

// Admin
export const adminAPI = {
  getTenants: (params) => api.get('/admin/tenants', { params }),
  updateTenantStatus: (id, status) => api.put(`/admin/tenants/${id}/status`, { status }),
  updateTenantPlan: (id, data) => api.put(`/admin/tenants/${id}/plan`, data),
  getStats: () => api.get('/admin/stats'),
};

export default api;
