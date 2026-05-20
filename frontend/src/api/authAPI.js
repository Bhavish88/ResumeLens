/**
 * authAPI.js
 *
 * All API calls related to user authentication.
 * Every function maps to one backend endpoint.
 *
 * register()    → POST /api/auth/register/
 * login()       → POST /api/auth/login/
 * logout()      → POST /api/auth/logout/
 * getProfile()  → GET  /api/auth/me/
 * updateProfile()→ PUT /api/auth/me/
 */

import axiosInstance from './axiosInstance';

// Create a new user account
// body: { name, email, password, password2 }
export const register = (data) => axiosInstance.post('/api/auth/register/', data);

// Log in and get access + refresh tokens
// body: { email, password }
export const login = (data) => axiosInstance.post('/api/auth/login/', data);

// Blacklist the refresh token (true server-side logout)
// body: { refresh: <refresh_token> }
export const logout = (refreshToken) =>
  axiosInstance.post('/api/auth/logout/', { refresh: refreshToken });

// Get the currently logged-in user's profile
export const getProfile = () => axiosInstance.get('/api/auth/me/');

// Update user's display name
// body: { name }
export const updateProfile = (data) => axiosInstance.put('/api/auth/me/', data);
