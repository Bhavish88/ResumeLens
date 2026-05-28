/**
 * AuthContext.jsx
 *
 * THE GLOBAL AUTH STATE for the entire app.
 *
 * What this provides to every component (via useAuth hook):
 *   - user         → { id, name, email, created_at } or null if logged out
 *   - isAuthenticated → true/false
 *   - loading      → true while we're checking if user is still logged in
 *   - login(data)  → call this with { email, password }, handles tokens automatically
 *   - logout()     → blacklists token, clears state, redirects to login
 *
 * How it works:
 * On app start → checks localStorage for tokens → fetches user profile
 * This is how the app "remembers" you between page refreshes.
 * If the tokens are expired, axiosInstance's interceptor handles the refresh.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin, logout as apiLogout, getProfile } from '../api/authAPI';

// Create the context
const AuthContext = createContext(null);

// Provider component — wraps the whole app in App.jsx
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // On mount: check if there's a saved session
  useEffect(() => {
    const checkSession = async () => {
      const accessToken = localStorage.getItem('access_token');

      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        // Fetch the user's profile using the stored token
        // axiosInstance automatically attaches the token
        const response = await getProfile();
        setUser(response.data);
      } catch (err) {
        // Token is invalid/expired and refresh failed — clear everything
        localStorage.clear();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // Login: call the API, save tokens, set user state
  const login = async (credentials) => {
    const response = await apiLogin(credentials);
    const { tokens, user: userData } = response.data;

    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);

    setUser(userData);
    return response;
  };

  // Logout: blacklist refresh token on server, clear local state
  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await apiLogout(refreshToken);
      }
    } catch (err) {
      // Even if blacklisting fails, clear locally
    } finally {
      localStorage.clear();
      setUser(null);
      navigate('/login');
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    updateUser: (userData) => setUser(userData),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook — components call useAuth() instead of useContext(AuthContext)
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
