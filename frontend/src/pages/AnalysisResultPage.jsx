/**
 * AnalysisResultPage.jsx - ENHANCED
 *
 * Implements:
 * 1. Interactive Tabs: "Analysis Breakdown" vs "Parsed Resume"
 * 2. Category-based ATS scoring breakdown with progress bars and dynamic colors
 * 3. Structured parsed resume section displaying extracted candidate contact details, skills, experience, projects, education, and certifications
 * 4. High-fidelity vector PDF download trigger (window.print()) with print CSS integration
 * 5. Robust fallback support for older reports
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

  const handleDownloadPDF = () => {
    window.print();
  };

  // Categories definitions and max points
  const categoriesConfig = [
    { key: 'formatting', label: 'Formatting & ATS Compatibility', max: 20 },
    { key: 'skills_match', label: 'Skills Match', max: 25 },
    { key: 'experience_quality', label: 'Experience Quality', max: 20 },
    { key: 'projects_portfolio', label: 'Projects & Portfolio', max: 15 },
    { key: 'education_certifications', label: 'Education & Certifications', max: 10 },
    { key: 'resume_structure', label: 'Resume Structure', max: 10 }
  ];

  // Helper to color code category progress bars
  const getCategoryColor = (percentage) => {
    if (percentage >= 75) return 'var(--success)';
    if (percentage >= 50) return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      {/* Print stylesheet override */}
      <style>{`
        @media print {
          .print-page-break {
            page-break-before: always;
            margin-top: 40px;
          }
        }
      `}</style>

      <div className="container">
        {loading && (
          <div className="loading-state" style={{ paddingTop: 80 }}>
            <LoadingSpinner size={48} />
            <p className="loading-text">Loading your analysis...</p>
          </div>
        )}

        {error && !loading && (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <div className="auth-alert auth-alert-error" style={{ display: 'inline-block', maxWidth: 480 }}>
              {error}
            </div>
            <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/upload')} className="btn btn-primary">
                Upload a Resume
              </button>
              <button onClick={() => navigate('/history')} className="btn btn-secondary">
                View History
              </button>
            </div>
          </div>
        )}

        {!loading && report && (
          <>
            {/* ── Hero: Score + Meta ─────────────────────────────────── */}
            <div className="result-hero">
              <ScoreGauge score={report.ats_score} size={200} />
              <div className="result-meta">
                <div className="result-role">{report.target_role}</div>
                <div className="result-file">📄 {report.file_name}</div>
                <div className="result-date">Analyzed on {formatDate(report.created_at)}</div>
                <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => navigate('/upload')}
                    className="btn btn-primary"
                  >
                    ⬆ Upload New
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="btn btn-accent"
                  >
                    📥 Download PDF
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

            {/* ───────────────────────────────────────────────────────── */}
            {/* ANALYSIS BREAKDOWN                                        */}
            {/* ───────────────────────────────────────────────────────── */}
            <div className="tab-pane-breakdown">
              
              {/* Final Verdict */}
              {report.final_verdict && (
                <div className="verdict-block">
                  <div className="verdict-label">🎯 Final Verdict</div>
                  <p className="verdict-text">{report.final_verdict}</p>
                </div>
              )}

              {/* Category scores breakdown */}
              <div className="category-scores-card">
                <h3 className="result-section-title" style={{ marginBottom: 20 }}>
                  📈 Score Breakdown
                </h3>
                <div className="category-score-grid">
                  {categoriesConfig.map((cat) => {
                    const categoryScores = report.category_scores || {};
                    // Graceful fallback to proportional scores for legacy records
                    const score = categoryScores[cat.key] !== undefined 
                      ? categoryScores[cat.key] 
                      : Math.round((report.ats_score || 0) * (cat.max / 100));
                    
                    const pct = (score / cat.max) * 100;
                    const barColor = getCategoryColor(pct);

                    return (
                      <div key={cat.key} className="category-score-item">
                        <div className="category-score-header">
                          <span className="category-score-label">{cat.label}</span>
                          <span className="category-score-val">{score}/{cat.max}</span>
                        </div>
                        <div className="category-progress-track">
                          <div 
                            className="category-progress-bar"
                            style={{ 
                              width: `${pct}%`,
                              backgroundColor: barColor
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Missing Skills */}
              <div className="result-section" style={{ marginBottom: 20 }}>
                <h3 className="result-section-title">
                  <span style={{ color: 'var(--danger)' }}>⚠</span>
                  &nbsp;Missing Skills
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8, fontSize: '0.78rem' }}>
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
                  <p style={{ color: 'var(--success)', fontSize: '0.9rem' }}>
                    ✓ No critical missing skills — great job!
                  </p>
                )}
              </div>

              {/* Strengths & Weaknesses */}
              <div className="result-sections">
                {/* Strengths */}
                <div className="result-section">
                  <h3 className="result-section-title">
                    <span style={{ color: 'var(--success)' }}>✓</span>
                    &nbsp;Strengths
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
                    <span style={{ color: 'var(--warning)' }}>⚠</span>
                    &nbsp;Areas to Improve
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

              {/* Action Steps */}
              {report.suggestions?.length > 0 && (
                <div className="result-section" style={{ marginTop: 20, marginBottom: 48 }}>
                  <h3 className="result-section-title">
                    <span style={{ color: 'var(--accent)' }}>💡</span>
                    &nbsp;Action Steps
                  </h3>
                  <div className="suggestions-list">
                    {report.suggestions.map((suggestion, i) => (
                      <div key={i} className="suggestion-item">
                        <div className="suggestion-number">{i + 1}</div>
                        <p className="suggestion-text">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </>
        )}
      </div>
    </div>
  );
}

export default AnalysisResultPage;

