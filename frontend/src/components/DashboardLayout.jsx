import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../api/authAPI';

function DashboardLayout({ children, title, subtitle }) {
  const { user, logout, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditEmail(user.email);
    }
  }, [user, profileModalOpen]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSuccess('');
    setUpdating(true);

    try {
      const response = await updateProfile({ name: editName, email: editEmail });
      updateUser(response.data.user);
      setEditSuccess('Profile updated successfully!');
      setTimeout(() => {
        setProfileModalOpen(false);
        setEditSuccess('');
      }, 1500);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.errors?.email?.[0] || 'Failed to update profile. Please try again.';
      setEditError(errMsg);
    } finally {
      setUpdating(false);
    }
  };

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  const menuItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" />
          <rect x="14" y="3" width="7" height="5" />
          <rect x="14" y="12" width="7" height="9" />
          <rect x="3" y="16" width="7" height="5" />
        </svg>
      )
    },
    {
      to: '/upload',
      label: 'Upload Resume',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      )
    },
    {
      to: '/history',
      label: 'History',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    }
  ];

  return (
    <div className="db-layout-container">
      {/* Mobile Header Bar */}
      <header className="db-mobile-header">
        <button className="db-menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <Link to="/dashboard" className="db-mobile-brand">
          ResumeLens
        </Link>
        <div className="db-mobile-avatar">
          {initial}
        </div>
      </header>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && <div className="db-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Left Sidebar */}
      <aside className={`db-sidebar ${sidebarOpen ? 'db-sidebar--open' : ''}`}>
        <div className="db-sidebar-header">
          <Link to="/dashboard" className="db-sidebar-brand" onClick={() => setSidebarOpen(false)}>
            <div className="db-brand-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            ResumeLens
          </Link>
        </div>

        <nav className="db-sidebar-nav">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`db-sidebar-link ${isActive ? 'db-sidebar-link--active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="db-link-icon">{item.icon}</span>
                <span className="db-link-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="db-sidebar-footer">
          {/* Logout */}
          <button className="db-sidebar-link db-logout-btn-nav" onClick={() => { setSidebarOpen(false); logout(); }}>
            <span className="db-link-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1-2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            <span className="db-link-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="db-main-content">
        {/* Main Content Header */}
        <div className="db-main-header">
          {/* Top Navigation Tabs */}
          <div className="db-header-tabs">
            <Link to="/dashboard" className={`db-header-tab ${location.pathname === '/dashboard' ? 'db-header-tab--active' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="9" />
                <rect x="14" y="3" width="7" height="5" />
                <rect x="14" y="12" width="7" height="9" />
                <rect x="3" y="16" width="7" height="5" />
              </svg>
              <span>Dashboard</span>
            </Link>
            <Link to="/upload" className={`db-header-tab ${location.pathname === '/upload' ? 'db-header-tab--active' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Upload</span>
            </Link>
            <Link to="/history" className={`db-header-tab ${location.pathname === '/history' ? 'db-header-tab--active' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>History</span>
            </Link>
          </div>

          <div className="db-header-right">
            {/* Profile Dropdown Container */}
            <div className="db-profile-container">
              <div 
                className="db-header-profile-pill" 
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              >
                <div className="db-header-profile-avatar">{initial}</div>
                <span className="db-header-profile-name">{user?.name?.split(' ')[0] || 'User'}</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="14" 
                  height="14" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className={`db-profile-arrow ${userDropdownOpen ? 'open' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {/* Profile Dropdown List */}
              {userDropdownOpen && (
                <div className="db-profile-dropdown">
                  <div className="db-profile-dropdown-header">
                    <span className="db-dropdown-name">{user?.name}</span>
                    <span className="db-dropdown-email">{user?.email}</span>
                  </div>
                  <div className="db-profile-dropdown-divider" />
                  <button 
                    className="db-dropdown-item" 
                    onClick={() => { 
                      setUserDropdownOpen(false); 
                      setProfileModalOpen(true); 
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>Edit Profile</span>
                  </button>
                  <button 
                    className="db-dropdown-item db-dropdown-item--logout" 
                    onClick={() => { 
                      setUserDropdownOpen(false); 
                      logout(); 
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1-2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page Headings */}
        <div className="db-page-heading">
          <h1 className="db-page-title">{title}</h1>
          {subtitle && <p className="db-page-subtitle">{subtitle}</p>}
        </div>

        {/* Inner Content */}
        <div className="db-content-body">
          {children}
        </div>
      </main>
      {/* Profile Edit Modal */}
      {profileModalOpen && (
        <div className="profile-modal-overlay" onClick={() => setProfileModalOpen(false)}>
          <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h2 className="profile-modal-title">Edit Profile</h2>
              <button className="profile-modal-close" onClick={() => setProfileModalOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleProfileUpdate} className="profile-modal-form">
              {editError && <div className="auth-alert auth-alert-error">{editError}</div>}
              {editSuccess && <div className="auth-alert auth-alert-success">{editSuccess}</div>}

              <div className="profile-form-group">
                <label className="profile-form-label">Full Name</label>
                <input
                  type="text"
                  className="profile-form-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  disabled={updating}
                />
              </div>

              <div className="profile-form-group">
                <label className="profile-form-label">Email Address</label>
                <input
                  type="email"
                  className="profile-form-input"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={updating}
                />
              </div>

              <div className="profile-modal-actions">
                <button
                  type="button"
                  className="profile-btn-cancel"
                  onClick={() => setProfileModalOpen(false)}
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="profile-btn-save"
                  disabled={updating}
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardLayout;
