import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('procureflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      // Clear token on session invalidation
      localStorage.removeItem('procureflow_token');
      localStorage.removeItem('procureflow_user');
      window.location.href = '/login?expired=true';
    }
    return Promise.reject(error);
  }
);
