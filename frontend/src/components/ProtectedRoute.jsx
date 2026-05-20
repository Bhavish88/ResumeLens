/**
 * ProtectedRoute.jsx
 *
 * A wrapper component that guards private pages.
 * If the user is not logged in, redirects to /login.
 * If auth is still loading (checking session), shows a spinner.
 *
 * Usage in App.jsx:
 *   <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // Still checking if tokens are valid — show spinner, not redirect
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <LoadingSpinner size={48} />
      </div>
    );
  }

  // Not logged in — redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Logged in — render the page
  return children;
}

export default ProtectedRoute;
