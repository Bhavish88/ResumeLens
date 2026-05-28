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
import DashboardLayout from '../components/DashboardLayout';

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

      // Start total loading timeout (60 seconds safeguard)
      const loadingTimeoutId = setTimeout(() => {
        log("Request timeout. The server did not respond within 60 seconds.", "error");
        controller.abort();
        setError("The server took too long to respond. The backend may be down or cold-starting.");
        setErrorDetails({
          phase: "FETCH_TIMEOUT",
          url: `${backendHost}/api/analysis/dashboard/`,
          method: "GET",
          message: "Request timed out after 60000ms. Aborted by client safeguard.",
          timestamp: new Date().toISOString()
        });
        setLoading(false);
      }, 60000);

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

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <DashboardLayout
      title={user?.name ? `Hey, ${user.name.split(' ')[0]} 👋` : 'Hey there! 👋'}
      subtitle="Here's your resume performance overview."
    >
      {loading && (
        <div className="terminal-box anim-pulse-glow" style={{ margin: '20px 0' }}>
          <div className="terminal-header">
            <div className="terminal-buttons">
              <span className="term-btn term-close"></span>
              <span className="term-btn term-minimize"></span>
              <span className="term-btn term-maximize"></span>
            </div>
            <div className="terminal-title">resumelens-core-bootstrap.sh</div>
          </div>
          
          <div className="terminal-body">
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

            <div className="terminal-console-output">
              {terminalLogs.map((log, index) => (
                <div key={index} className={`terminal-line line-${log.type}`}>
                  <span className="line-time">[{log.timestamp}]</span>{' '}
                  <span className="line-msg">{log.message}</span>
                </div>
              ))}
              <div className="terminal-line line-active-cursor">
                <span className="line-time">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>{' '}
                <span className="line-msg">Bootstrapping system components...</span>
                <span className="terminal-cursor">█</span>
              </div>
            </div>

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
        <div className="terminal-error-card animate-fade-in" style={{ margin: '20px 0' }}>
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
            {/* Card 1: Resumes Uploaded */}
            <div className="db-stat-card card-purple-theme">
              <div className="db-stat-top">
                <div className="db-stat-icon-box">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <span className="db-stat-label">Resumes Uploaded</span>
              </div>
              <div className="db-stat-value">{stats.total_resumes}</div>
              <div className="db-stat-sub">Total uploaded resumes</div>
              <div className="db-stat-graph">
                <svg viewBox="0 0 200 40" className="db-card-wave" preserveAspectRatio="none">
                  <path d="M0 35 C 30 32, 60 38, 90 28 C 120 18, 150 32, 200 25" fill="none" stroke="rgba(108, 99, 255, 0.8)" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Card 2: Analyses Run */}
            <div className="db-stat-card card-purple-theme">
              <div className="db-stat-top">
                <div className="db-stat-icon-box">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="10" rx="2" />
                    <circle cx="12" cy="5" r="2" />
                    <path d="M12 7v4" />
                    <line x1="8" y1="16" x2="8" y2="16" />
                    <line x1="16" y1="16" x2="16" y2="16" />
                  </svg>
                </div>
                <span className="db-stat-label">Analyses Run</span>
              </div>
              <div className="db-stat-value">{stats.total_analyses}</div>
              <div className="db-stat-sub">Total analyses performed</div>
              <div className="db-stat-graph">
                <svg viewBox="0 0 200 40" className="db-card-wave" preserveAspectRatio="none">
                  <path d="M0 30 C 30 35, 60 25, 90 32 C 120 38, 150 22, 200 28" fill="none" stroke="rgba(167, 139, 250, 0.8)" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Card 3: Avg ATS Score */}
            <div className="db-stat-card card-blue-theme">
              <div className="db-stat-top">
                <div className="db-stat-icon-box">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                </div>
                <span className="db-stat-label">Average ATS Score</span>
              </div>
              <div className="db-stat-value">{stats.average_ats_score}%</div>
              <div className="db-stat-sub">Across all analyses</div>
              <div className="db-stat-graph">
                <svg viewBox="0 0 200 40" className="db-card-wave" preserveAspectRatio="none">
                  <path d="M0 25 C 30 22, 60 28, 90 20 C 120 12, 150 30, 200 22" fill="none" stroke="rgba(59, 130, 246, 0.8)" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Card 4: Best ATS Score */}
            <div className="db-stat-card card-green-theme">
              <div className="db-stat-top">
                <div className="db-stat-icon-box">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                    <path d="M4 22h16" />
                    <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
                    <path d="M12 2a7 7 0 0 1 7 7v4c0 3.87-3.13 7-7 7S5 16.87 5 13V9a7 7 0 0 1 7-7z" />
                  </svg>
                </div>
                <span className="db-stat-label">Best ATS Score</span>
              </div>
              <div className="db-stat-value">{stats.best_ats_score}%</div>
              <div className="db-stat-sub">Your highest score</div>
              <div className="db-stat-graph">
                <svg viewBox="0 0 200 40" className="db-card-wave" preserveAspectRatio="none">
                  <path d="M0 32 C 30 25, 60 35, 90 22 C 120 10, 150 28, 200 18" fill="none" stroke="rgba(16, 185, 129, 0.8)" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* Banner Container */}
          <div className="db-banner-container">
            <div className="db-banner-left">
              <div className="db-banner-icon-box">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div className="db-banner-text">
                <h3 className="db-banner-title">Upload your resume</h3>
                <p className="db-banner-subtitle">PDF, DOCX (Max 5MB)</p>
              </div>
            </div>
            <div className="db-banner-right">
              <Link to="/upload" className="db-banner-btn-primary">
                + Upload New Resume
              </Link>
              <Link to="/history" className="db-banner-btn-secondary">
                View All History &rarr;
              </Link>
            </div>
          </div>

          {/* Recent Analyses Table */}
          <div className="db-recent-container">
            <div className="db-recent-header">
              <h2 className="db-recent-title">Recent Analyses</h2>
              <Link to="/history" className="db-recent-view-all">
                View all &rarr;
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
              <div className="db-table-wrapper">
                <div className="db-table-header">
                  <div className="db-col-name">RESUME NAME</div>
                  <div className="db-col-uploaded">UPLOADED ON</div>
                  <div className="db-col-score">ATS SCORE</div>
                  <div className="db-col-status">STATUS</div>
                  <div className="db-col-actions">ACTIONS</div>
                </div>
                <div className="db-table-body">
                  {stats.recent_analyses.map((report) => {
                    const isDocx = report.file_name?.toLowerCase().endsWith('.docx');
                    return (
                      <div key={report.id} className="db-table-row" onClick={() => navigate(`/result/${report.resume_id}`)}>
                        <div className="db-col-name">
                          <div className={`db-file-icon ${isDocx ? 'file-docx' : 'file-pdf'}`}>
                            {isDocx ? 'DOC' : 'PDF'}
                          </div>
                          <div className="db-file-info">
                            <span className="db-role-title">{report.target_role}</span>
                            <span className="db-file-name">{report.file_name}</span>
                          </div>
                        </div>
                        <div className="db-col-uploaded">
                          <div className="db-date-text">{formatDate(report.created_at)}</div>
                          <div className="db-time-text">{formatTime(report.created_at)}</div>
                        </div>
                        <div className="db-col-score">
                          <span className={`db-score-outline ${report.ats_score >= 75 ? 'score-green' : report.ats_score >= 50 ? 'score-amber' : 'score-red'}`}>
                            {report.ats_score}/100
                          </span>
                        </div>
                        <div className="db-col-status">
                          <span className="db-status-badge">
                            <span className="db-status-dot"></span>
                            Completed
                          </span>
                        </div>
                        <div className="db-col-actions" onClick={(e) => e.stopPropagation()}>
                          <Link to={`/result/${report.resume_id}`} className="db-action-btn" title="View Details">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

export default DashboardPage;
