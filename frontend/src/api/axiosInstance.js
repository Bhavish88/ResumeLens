/**
 * axiosInstance.js
 *
 * THE CENTRAL HTTP CLIENT for the entire frontend.
 *
 * What this does:
 * 1. Creates an axios instance pre-configured with baseURL = 'https://resumelens-8u2t.onrender.com'
 * 2. REQUEST interceptor: automatically attaches the JWT access token
 *    to every request in the Authorization header — so no page/component
 *    has to manually add it.
 * 3. RESPONSE interceptor: if any request gets a 401 Unauthorized
 *    (access token expired), it automatically:
 *    a. Calls /api/auth/token/refresh/ with the stored refresh token
 *    b. Saves the new access token
 *    c. Retries the original failed request with the new token
 *    d. If refresh also fails → clears storage and reloads to login
 *
 * Why this matters: Without this, tokens would expire after 2 hours and
 * users would get random errors. This makes the session feel seamless.
 */

import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://resumelens-8u2t.onrender.com';

const axiosInstance = axios.create({
  baseURL: BACKEND_URL,
  timeout: 60000, // 60 seconds timeout safeguard
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── REQUEST INTERCEPTOR ────────────────────────────────────────────────────────
// Runs before every outgoing request. Reads the access token from localStorage
// and adds it to the Authorization header.
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── RESPONSE INTERCEPTOR ───────────────────────────────────────────────────────
// Runs on every response. Handles 401 errors by refreshing the token.
let isRefreshing = false;
let failedQueue = [];  // stores requests that came in while refresh was in progress

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401 errors, and only retry once (_retry flag)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Another request is already refreshing — queue this one
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        // No refresh token — user must log in again
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // Try to get a new access token
        const response = await axios.post(`${BACKEND_URL}/api/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = response.data.access;
        const newRefreshToken = response.data.refresh; // Django rotates refresh tokens

        localStorage.setItem('access_token', newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem('refresh_token', newRefreshToken);
        }

        axiosInstance.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
