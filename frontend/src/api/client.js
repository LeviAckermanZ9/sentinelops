/**
 * SentinelOps Frontend — Axios API Client
 *
 * Centralized HTTP client with:
 *   - Base URL configuration
 *   - JWT auth header injection
 *   - Token refresh on 401
 *   - Error handling
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ---------------------------------------------------------------------------
// Request Interceptor — Inject auth token
// ---------------------------------------------------------------------------
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response Interceptor — Handle 401 / token refresh
// ---------------------------------------------------------------------------
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return client(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
          refreshToken,
        });

        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        processQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// API Methods
// ---------------------------------------------------------------------------
export const api = {
  // Prediction
  predict: (text) => client.post('/api/predict', { text }),
  predictBatch: (texts) => client.post('/api/predict/batch', { texts }),

  // Model info
  modelInfo: () => client.get('/api/model/info'),

  // Health
  healthML: () => client.get('/api/health/ml'),
  healthAuth: () => client.get('/api/health/auth'),

  // Auth
  login: (email, password) => client.post('/api/auth/login', { email, password }),
  register: (email, password) => client.post('/api/auth/register', { email, password }),
  logout: () => client.post('/api/auth/logout'),
  getProfile: () => client.get('/api/users/me'),
};

export default client;
