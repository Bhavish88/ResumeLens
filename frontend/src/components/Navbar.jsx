/**
 * Navbar.jsx
 *
 * Top navigation bar shown on all authenticated pages.
 * Shows logo, nav links, user name, and logout button.
 */

import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/upload',    label: 'Upload Resume' },
    { to: '/history',   label: 'History' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/dashboard" className="navbar-logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">ResumeAI</span>
        </Link>

        {/* Nav links */}
        <div className="navbar-links">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${location.pathname === link.to ? 'nav-link-active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* User info + logout */}
        <div className="navbar-right">
          {user && (
            <span className="navbar-user">
              👤 {user.name}
            </span>
          )}
          <button onClick={logout} className="btn-logout">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
