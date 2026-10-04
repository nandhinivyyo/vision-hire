import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('visionhire_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Only redirect on 401 if it's not a login or register request
    const isAuthEndpoint = err.config?.url?.includes('/api/auth/login') || err.config?.url?.includes('/api/auth/register');
    if (err.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('visionhire_token');
      window.location.href = '/auth';
    }
    return Promise.reject(err);
  }
);

export default api;