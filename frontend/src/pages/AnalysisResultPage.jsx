/**
 * AnalysisResultPage.jsx
 *
 * Full AI report display page.
 * Fetches report by resumeId from URL param.
 *
 * Shows:
 * - ATS score gauge (animated SVG circle)
 * - Resume file name + target role + date
 * - Final verdict block
 * - Missing skills (red badges)
 * - Strengths (green checkmarks)
 * - Weaknesses (amber warnings)
 * - Numbered suggestions
 *
 * API: GET /api/analysis/resume/<resumeId>/
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReportByResume } from '../api/analysisAPI';
import Navbar from '../components/Navbar';
import ScoreGauge from '../components/ScoreGauge';
import SkillBadge from '../components/SkillBadge';
import LoadingSpinner from '../components/LoadingSpinner';

function AnalysisResultPage() {
  const { resumeId } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await getReportByResume(resumeId);
        setReport(res.data);
      } catch (err) {
        if (err.response?.status === 404) {
          setError('No analysis found for this resume. Please run analysis first.');
        } else {
          setError('Failed to load analysis report.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [resumeId]);

  const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      <div className="container">
        {loading && (
          <div className="loading-state" style={{ paddingTop: 80 }}>
            <LoadingSpinner size={48} />
            <p className="loading-text">Loading your analysis...</p>
          </div>
        )}

        {error && (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <div className="auth-alert auth-alert-error" style={{ display: 'inline-block' }}>
              {error}
            </div>
            <div style={{ marginTop: 24 }}>
              <button onClick={() => navigate('/upload')} className="btn btn-primary">
                Upload a Resume
              </button>
              <button onClick={() => navigate('/history')} className="btn btn-secondary" style={{ marginLeft: 12 }}>
                View History
              </button>
            </div>
          </div>
        )}

        {!loading && report && (
          <>
            {/* ── Hero: Score + Meta ─────────────────────────────────────────── */}
            <div className="result-hero">
              <ScoreGauge score={report.ats_score} size={200} />
              <div className="result-meta">
                <div className="result-role">{report.resume?.target_role}</div>
                <div className="result-file">📄 {report.resume?.file_name}</div>
                <div className="result-date">Analyzed on {formatDate(report.created_at)}</div>
                <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => navigate('/upload')}
                    className="btn btn-primary"
                  >
                    ⬆ Re-analyze
                  </button>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="btn btn-secondary"
                  >
                    Dashboard
                  </button>
                </div>
              </div>
            </div>

            {/* ── Final Verdict ──────────────────────────────────────────────── */}
            <div className="verdict-block">
              <div className="verdict-label">🎯 Final Verdict</div>
              <p className="verdict-text">{report.final_verdict}</p>
            </div>

            {/* ── Missing Skills ─────────────────────────────────────────────── */}
            <div className="result-section" style={{ marginBottom: 20 }}>
              <h3 className="result-section-title">
                <span style={{ color: 'var(--danger)' }}>⚠</span>
                Missing Skills
                <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>
                  ({report.missing_skills?.length || 0})
                </span>
              </h3>
              {report.missing_skills?.length > 0 ? (
                <div className="tags-wrap">
                  {report.missing_skills.map((skill, i) => (
                    <SkillBadge key={i} text={skill} variant="danger" />
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No critical missing skills — great job!
                </p>
              )}
            </div>

            {/* ── Strengths + Weaknesses ─────────────────────────────────────── */}
            <div className="result-sections">
              {/* Strengths */}
              <div className="result-section">
                <h3 className="result-section-title">
                  <span style={{ color: 'var(--success)' }}>✓</span>
                  Strengths
                </h3>
                <div className="result-list">
                  {report.strengths?.map((item, i) => (
                    <div key={i} className="result-list-item">
                      <div
                        className="result-list-bullet"
                        style={{ background: 'rgba(0,229,160,0.12)', color: 'var(--success)' }}
                      >✓</div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weaknesses */}
              <div className="result-section">
                <h3 className="result-section-title">
                  <span style={{ color: 'var(--warning)' }}>⚡</span>
                  Areas to Improve
                </h3>
                <div className="result-list">
                  {report.weaknesses?.map((item, i) => (
                    <div key={i} className="result-list-item">
                      <div
                        className="result-list-bullet"
                        style={{ background: 'rgba(255,179,71,0.12)', color: 'var(--warning)' }}
                      >!</div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Suggestions ────────────────────────────────────────────────── */}
            <div className="result-section" style={{ marginBottom: 48 }}>
              <h3 className="result-section-title">
                <span style={{ color: 'var(--accent)' }}>💡</span>
                Action Steps
              </h3>
              <div className="suggestions-list">
                {report.suggestions?.map((suggestion, i) => (
                  <div key={i} className="suggestion-item">
                    <div className="suggestion-number">{i + 1}</div>
                    <p className="suggestion-text">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AnalysisResultPage;
