import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vh_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global response handler
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('vh_token');
      localStorage.removeItem('vh_user');
      window.location.href = '/auth';
    }
    return Promise.reject(err);
  }
);

export default api;
