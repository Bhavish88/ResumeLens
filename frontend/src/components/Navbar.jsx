/**
 * Navbar.jsx - FIXED with mobile hamburger menu
 *
 * On mobile: shows ☰ button that opens/closes a slide-down menu.
 * On desktop: shows horizontal links as before.
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { to: '/dashboard', label: '📊 Dashboard' },
    { to: '/upload',    label: '⬆ Upload' },
    { to: '/history',   label: '📜 History' },
  ];

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          {/* Logo */}
          <Link to="/dashboard" className="navbar-logo" onClick={closeMenu}>
            <span className="logo-text">ResumeLens</span>
          </Link>

          {/* Desktop nav links */}
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

          {/* Desktop right side */}
          <div className="navbar-right desktop-only">
            {user && (
              <span className="navbar-user">
                👤 {user.name?.split(' ')[0]}
              </span>
            )}
            <button onClick={logout} className="btn-logout">
              Logout
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="hamburger-btn"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="mobile-menu">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`mobile-nav-link ${location.pathname === link.to ? 'mobile-nav-link-active' : ''}`}
                onClick={closeMenu}
              >
                {link.label}
              </Link>
            ))}
            <div className="mobile-menu-divider" />
            {user && (
              <span className="mobile-user">👤 {user.name}</span>
            )}
            <button
              onClick={() => { closeMenu(); logout(); }}
              className="mobile-logout-btn"
            >
              Logout
            </button>
          </div>
        )}
      </nav>
    </>
  );
}

export default Navbar;
