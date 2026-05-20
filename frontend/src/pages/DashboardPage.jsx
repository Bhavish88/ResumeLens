/**
 * DashboardPage.jsx
 *
 * The main page after login. Shows:
 * - Greeting with user's name
 * - 4 stat cards: total resumes, analyses, avg ATS score, best score
 * - Recent 5 analyses list (clickable → goes to result)
 * - Quick actions: Upload New Resume
 *
 * Data: GET /api/analysis/dashboard/
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboard } from '../api/analysisAPI';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';

function ScorePill({ score }) {
  const cls = score >= 75 ? 'score-pill-green' : score >= 50 ? 'score-pill-amber' : 'score-pill-red';
  return <span className={`score-pill ${cls}`}>{score}/100</span>;
}

function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await getDashboard();
        setStats(res.data);
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const statCards = stats
    ? [
        { icon: '📄', value: stats.total_resumes,    label: 'Resumes Uploaded' },
        { icon: '🤖', value: stats.total_analyses,   label: 'Analyses Run' },
        { icon: '📊', value: `${stats.average_ats_score}%`, label: 'Average ATS Score' },
        { icon: '🏆', value: `${stats.best_ats_score}%`,    label: 'Best ATS Score' },
      ]
    : [];

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      <div className="container">
        {/* Header */}
        <div className="dashboard-header">
          <h1 className="page-title">
            Hey, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="page-subtitle">Here's your resume performance overview.</p>
        </div>

        {loading && (
          <div className="loading-state">
            <LoadingSpinner size={40} />
            <p className="loading-text">Loading your dashboard...</p>
          </div>
        )}

        {error && (
          <div className="auth-alert auth-alert-error">{error}</div>
        )}

        {!loading && stats && (
          <>
            {/* Stat Cards */}
            <div className="stats-grid">
              {statCards.map((card, i) => (
                <div
                  key={i}
                  className="stat-card"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <span className="stat-icon">{card.icon}</span>
                  <div className="stat-value">{card.value}</div>
                  <div className="stat-label">{card.label}</div>
                </div>
              ))}
            </div>

            {/* Quick Action */}
            <div style={{ marginBottom: 32 }}>
              <Link to="/upload" className="btn btn-primary btn-lg">
                ⬆ Upload New Resume
              </Link>
              <Link to="/history" className="btn btn-secondary btn-lg" style={{ marginLeft: 12 }}>
                View All History
              </Link>
            </div>

            <hr className="divider" />

            {/* Recent Analyses */}
            <div>
              <div className="section-header">
                <h2 className="section-heading">Recent Analyses</h2>
                <Link to="/history" style={{ fontSize: '0.85rem', color: 'var(--primary-light)' }}>
                  View all →
                </Link>
              </div>

              {stats.recent_analyses.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📭</span>
                  <p className="empty-title">No analyses yet</p>
                  <p className="empty-desc">Upload your first resume to get started.</p>
                  <Link to="/upload" className="btn btn-primary">Upload Resume</Link>
                </div>
              ) : (
                <div className="analysis-list">
                  {stats.recent_analyses.map((report) => (
                    <div
                      key={report.id}
                      className="analysis-item"
                      onClick={() => navigate(`/result/${report.resume_id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="analysis-item-left">
                        <div className="analysis-item-role">{report.target_role}</div>
                        <div className="analysis-item-file">{report.file_name}</div>
                        <div className="analysis-item-date">{formatDate(report.created_at)}</div>
                      </div>
                      <ScorePill score={report.ats_score} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
