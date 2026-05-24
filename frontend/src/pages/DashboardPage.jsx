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
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getDashboard } from '../api/analysisAPI';
import Navbar from '../components/Navbar';

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

  // Terminal bootstrapping states
  const [bootStep, setBootStep] = useState(1);
  const [coldStart, setColdStart] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    setTerminalLogs([]);
    setError('');
    setErrorDetails(null);
    setColdStart(false);
    setLoading(true);

    const timestamp = () => new Date().toLocaleTimeString('en-US', { hour12: false });
    const logList = [];
    const log = (msg, type = 'info') => {
      const line = { timestamp: timestamp(), message: msg, type };
      logList.push(line);
      setTerminalLogs([...logList]);
      console.log(`[Dashboard Boot] [${type.toUpperCase()}] ${msg}`);
    };

    const runBootSequence = async () => {
      log("Initializing bootstrap sequence...", "system");

      // --- STEP 1: READ TOKEN ---
      setBootStep(1);
      log("Reading local storage authentication token...", "info");
      const token = localStorage.getItem('access_token');
      if (!token) {
        log("Access token not found in local storage.", "error");
        setError("Missing authentication token. Please log in again.");
        setLoading(false);
        return;
      }
      log("JWT token retrieved successfully from localStorage.", "success");

      // --- STEP 2: VERIFY AUTH SESSION ---
      setBootStep(2);
      log("Verifying user session credentials...", "info");
      if (!user) {
        log("No authenticated user profile loaded.", "error");
        setError("Failed to verify authentication session. Please try logging in again.");
        setLoading(false);
        return;
      }
      log(`Session authenticated for user: ${user.name} (${user.email})`, "success");

      // --- STEP 3 & 4: CONNECT TO BACKEND & FETCH DATA ---
      setBootStep(3);
      const backendHost = import.meta.env.VITE_API_URL || 'https://resumelens-8u2t.onrender.com';
      log(`Connecting to backend service at: ${backendHost}`, "info");

      // Start cold start timer (3 seconds)
      const coldStartTimeoutId = setTimeout(() => {
        setColdStart(true);
        log("Connection delayed. API server appears to be cold-starting...", "warn");
      }, 3000);

      // Start total loading timeout (12 seconds safeguard)
      const loadingTimeoutId = setTimeout(() => {
        log("Request timeout. The server did not respond within 12 seconds.", "error");
        controller.abort();
        setError("The server took too long to respond. The backend may be down or cold-starting.");
        setErrorDetails({
          phase: "FETCH_TIMEOUT",
          url: `${backendHost}/api/analysis/dashboard/`,
          method: "GET",
          message: "Request timed out after 12000ms. Aborted by client safeguard.",
          timestamp: new Date().toISOString()
        });
        setLoading(false);
      }, 12000);

      try {
        const res = await getDashboard({ signal: controller.signal });
        
        clearTimeout(coldStartTimeoutId);
        clearTimeout(loadingTimeoutId);

        setBootStep(4);
        log("Backend connection established successfully. HTTP 200 OK", "success");
        log("Retrieving and parsing dashboard metrics...", "info");
        
        setStats(res.data);
        log("Dashboard stats parsed. 100% operational.", "success");
        
        // Brief delay before resolving loading spinner for transition aesthetics
        setTimeout(() => {
          setLoading(false);
        }, 600);

      } catch (err) {
        clearTimeout(coldStartTimeoutId);
        clearTimeout(loadingTimeoutId);

        if (axios.isCancel(err) || err.name === 'CanceledError') {
          log("Bootstrap process canceled by system/client request.", "warn");
          return;
        }

        log("Bootstrap failed. Error encountered during connection/fetch.", "error");
        console.error("[Dashboard Boot] Error occurred:", err);

        const status = err.response?.status || "NETWORK_ERROR";
        const statusText = err.response?.statusText || "Unable to reach server";
        const message = err.response?.data?.message || err.message || "An unknown network error occurred.";

        setError(message);
        setErrorDetails({
          phase: "CONN_DATA_FETCH",
          url: `${backendHost}/api/analysis/dashboard/`,
          method: "GET",
          status,
          statusText,
          message,
          timestamp: new Date().toISOString(),
          details: err.response?.data || "No response details provided."
        });
        setLoading(false);
      }
    };

    runBootSequence();

    return () => {
      controller.abort();
    };
  }, [retryCount, user]);

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
          <div className="terminal-box anim-pulse-glow">
            <div className="terminal-header">
              <div className="terminal-buttons">
                <span className="term-btn term-close"></span>
                <span className="term-btn term-minimize"></span>
                <span className="term-btn term-maximize"></span>
              </div>
              <div className="terminal-title">resumelens-core-bootstrap.sh</div>
            </div>
            
            <div className="terminal-body">
              {/* Boot steps checklist */}
              <div className="boot-steps-progress">
                <div className={`boot-step-item ${bootStep >= 1 ? 'active' : ''} ${bootStep > 1 ? 'done' : ''}`}>
                  <span className="step-status-icon">{bootStep > 1 ? '✓' : bootStep === 1 ? '⚡' : '○'}</span>
                  <span className="step-status-text">Initialize local environment & token</span>
                </div>
                <div className={`boot-step-item ${bootStep >= 2 ? 'active' : ''} ${bootStep > 2 ? 'done' : ''}`}>
                  <span className="step-status-icon">{bootStep > 2 ? '✓' : bootStep === 2 ? '⚡' : '○'}</span>
                  <span className="step-status-text">Authenticate auth session token</span>
                </div>
                <div className={`boot-step-item ${bootStep >= 3 ? 'active' : ''} ${bootStep > 3 ? 'done' : ''}`}>
                  <span className="step-status-icon">{bootStep > 3 ? '✓' : bootStep === 3 ? '⚡' : '○'}</span>
                  <span className="step-status-text">Establish backend server connection</span>
                </div>
                <div className={`boot-step-item ${bootStep >= 4 ? 'active' : ''} ${bootStep > 4 ? 'done' : ''}`}>
                  <span className="step-status-icon">{bootStep > 4 ? '✓' : bootStep === 4 ? '⚡' : '○'}</span>
                  <span className="step-status-text">Parse and load dashboard report metrics</span>
                </div>
              </div>

              <hr className="terminal-divider" />

              {/* Terminal Logs Output */}
              <div className="terminal-console-output">
                {terminalLogs.map((log, index) => (
                  <div key={index} className={`terminal-line line-${log.type}`}>
                    <span className="line-time">[{log.timestamp}]</span>{' '}
                    <span className="line-msg">{log.message}</span>
                  </div>
                ))}
                {/* Visual loading prompt */}
                <div className="terminal-line line-active-cursor">
                  <span className="line-time">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>{' '}
                  <span className="line-msg">Bootstrapping system components...</span>
                  <span className="terminal-cursor">█</span>
                </div>
              </div>

              {/* Cold start alert message */}
              {coldStart && (
                <div className="cold-start-banner animate-fade-in">
                  <div className="cold-start-banner-title">⚠️ Slow Response Detected</div>
                  <p className="cold-start-banner-desc">
                    The backend instance on Render is waking up from a cold-start. This can take up to 40-50 seconds because Render's free tier spins down containers during periods of inactivity. Thank you for your patience!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="terminal-error-card animate-fade-in">
            <div className="terminal-error-header">
              <span className="error-dot"></span>
              <span className="terminal-error-title">SYSTEM_BOOT_FAILURE: DIAGNOSTIC_REPORT</span>
            </div>

            <div className="terminal-error-body">
              <div className="error-fallback-hero">
                <span className="error-fallback-icon">⚠️</span>
                <h3 className="error-fallback-title">Dashboard Boot Failed</h3>
                <p className="error-fallback-message">{error}</p>
              </div>

              {errorDetails && (
                <div className="error-details-console">
                  <div className="details-header">METADATA & SYSTEM DIAGNOSTIC SUMMARY:</div>
                  <pre className="details-code">
                    {JSON.stringify(errorDetails, null, 2)}
                  </pre>
                </div>
              )}

              <div className="error-fallback-actions">
                <button
                  onClick={() => setRetryCount((prev) => prev + 1)}
                  className="btn btn-primary btn-lg btn-retry"
                >
                  🔄 Retry Bootstrap Sequence
                </button>
                <Link to="/" className="btn btn-secondary btn-lg">
                  🏠 Back to Home
                </Link>
              </div>
            </div>
          </div>
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
            <div className="btn-group btn-group-center dashboard-actions" style={{ marginBottom: 40 }}>
              <Link to="/upload" className="btn btn-primary btn-lg">
                ⬆ Upload New Resume
              </Link>
              <Link to="/history" className="btn btn-secondary btn-lg">
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
