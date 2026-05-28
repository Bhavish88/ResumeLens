/**
 * HistoryPage.jsx
 *
 * Shows ALL past analyses for the logged-in user, newest first.
 * Each row is clickable → navigates to the full result page.
 * Also allows deleting individual analysis reports.
 *
 * API: GET /api/analysis/history/
 *      DELETE /api/analysis/<reportId>/delete/
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHistory, deleteReport } from '../api/analysisAPI';
import DashboardLayout from '../components/DashboardLayout';
import LoadingSpinner from '../components/LoadingSpinner';

function ScorePill({ score }) {
  const cls =
    score >= 75 ? 'score-pill-green' :
    score >= 50 ? 'score-pill-amber' :
    'score-pill-red';
  return <span className={`score-pill ${cls}`}>{score}/100</span>;
}

function HistoryPage() {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getHistory();
        setReports(res.data.reports || []);
      } catch {
        setError('Failed to load history.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleDelete = async (e, reportId) => {
    e.stopPropagation(); // don't navigate when clicking delete
    if (!window.confirm('Delete this analysis report? The resume file will stay.')) return;
    setDeletingId(reportId);
    try {
      await deleteReport(reportId);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch {
      alert('Failed to delete report. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });

  return (
    <DashboardLayout
      title="Analysis History"
      subtitle={`All ${reports.length > 0 ? reports.length : ''} resume analyses, newest first.`}
    >
      <div>

        {loading && (
          <div className="loading-state">
            <LoadingSpinner size={40} />
            <p className="loading-text">Loading history...</p>
          </div>
        )}

        {error && (
          <div className="auth-alert auth-alert-error">{error}</div>
        )}

        {!loading && reports.length === 0 && !error && (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p className="empty-title">No analyses yet</p>
            <p className="empty-desc">
              Upload a resume and run AI analysis to see results here.
            </p>
            <button
              onClick={() => navigate('/upload')}
              className="btn btn-primary"
            >
              Upload My First Resume
            </button>
          </div>
        )}

        {!loading && reports.length > 0 && (
          <div className="analysis-list">
            {reports.map((report, i) => (
              <div
                key={report.id}
                className="analysis-item"
                onClick={() => navigate(`/result/${report.resume_id}`)}
                style={{ cursor: 'pointer', animationDelay: `${i * 0.05}s` }}
              >
                {/* Left: role + file + date */}
                <div className="analysis-item-left">
                  <div className="analysis-item-role">
                    {report.target_role}
                  </div>
                  <div className="analysis-item-file">
                    📄 {report.file_name}
                  </div>
                  <div className="analysis-item-date">
                    {formatDate(report.created_at)}
                  </div>
                </div>

                {/* Right: score + delete */}
                <div className="analysis-item-right">
                  <ScorePill score={report.ats_score} />
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={(e) => handleDelete(e, report.id)}
                    disabled={deletingId === report.id}
                    title="Delete this analysis"
                  >
                    {deletingId === report.id
                      ? <LoadingSpinner size={14} color="var(--danger)" />
                      : '🗑'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default HistoryPage;
