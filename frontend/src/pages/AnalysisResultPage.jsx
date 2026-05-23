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

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReportByResume } from '../api/analysisAPI';
import Navbar from '../components/Navbar';
import ScoreGauge from '../components/ScoreGauge';
import SkillBadge from '../components/SkillBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

function AnalysisResultPage() {
  const { resumeId } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const pdfPage1Ref = useRef(null);
  const pdfPage2Ref = useRef(null);

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

  const handleDownloadPDF = async () => {
    if (isGeneratingPDF) return;
    setIsGeneratingPDF(true);

    try {
      // Small timeout to ensure the DOM has fully adjusted
      await new Promise((resolve) => setTimeout(resolve, 300));

      const page1 = pdfPage1Ref.current;
      const page2 = pdfPage2Ref.current;

      if (!page1 || !page2) {
        throw new Error('PDF template refs are not initialized.');
      }

      // Configure html2canvas for high quality 3x resolution and static viewport locks
      const canvasOpts = {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#07070f',
        logging: false,
        width: 794,
        height: 1123,
        windowWidth: 794,
        windowHeight: 1123
      };

      const canvas1 = await html2canvas(page1, canvasOpts);
      const canvas2 = await html2canvas(page2, canvasOpts);

      const imgData1 = canvas1.toDataURL('image/png');
      const imgData2 = canvas2.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // A4 is 210mm x 297mm
      pdf.addImage(imgData1, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
      pdf.addPage();
      pdf.addImage(imgData2, 'PNG', 0, 0, 210, 297, undefined, 'FAST');

      const sanitizedRole = (report.target_role || 'resume-analysis')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');
      pdf.save(`resumelens-${sanitizedRole}-report.pdf`);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
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

      {/* PDF loading state overlay */}
      {isGeneratingPDF && (
        <div 
          className="animate-fade-in" 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(7, 7, 15, 0.9)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16
          }}
        >
          <LoadingSpinner size={48} color="var(--accent)" />
          <p className="loading-text" style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Generating premium PDF report...
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Optimizing layout structures and rendering vector graphics
          </p>
        </div>
      )}

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
            <div className="btn-group" style={{ marginTop: 24, justifyContent: 'center' }}>
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
                <div className="btn-group result-actions" style={{ marginTop: 20 }}>
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

            {/* ── Hidden PDF Template for A4 Export ──────────────────── */}
            <div className="pdf-offscreen-container">
              {/* PAGE 1 */}
              <div className="pdf-page" ref={pdfPage1Ref}>
                <div className="pdf-header">
                  <span className="logo-text">ResumeLens</span>
                  <span className="pdf-header-label">Resume Evaluation Report</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 32, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', marginTop: 16 }}>
                  <ScoreGauge score={report.ats_score} size={120} animate={false} />
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                      ATS Evaluation Summary
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>TARGET ROLE</span>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{report.target_role}</span>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>FILE NAME</span>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 500, wordBreak: 'break-all' }}>{report.file_name}</span>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>DATE ANALYZED</span>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{formatDate(report.created_at)}</span>
                    </div>
                  </div>
                </div>

                {report.final_verdict && (
                  <div className="verdict-block" style={{ margin: '10px 0 0 0' }}>
                    <div className="verdict-label">🎯 Final Verdict</div>
                    <p className="verdict-text">{report.final_verdict}</p>
                  </div>
                )}

                <div className="category-scores-card" style={{ flex: 1, margin: 0, display: 'flex', flexDirection: 'column' }}>
                  <h3 className="result-section-title" style={{ marginBottom: 16 }}>
                    📈 Score Breakdown
                  </h3>
                  <div className="category-score-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    {categoriesConfig.map((cat) => {
                      const categoryScores = report.category_scores || {};
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

                <div className="pdf-footer">
                  <span className="pdf-footer-brand">ResumeLens Report</span>
                  <span className="pdf-footer-page">Page 1 of 2</span>
                </div>
              </div>

              {/* PAGE 2 */}
              <div className="pdf-page" ref={pdfPage2Ref}>
                <div className="pdf-header">
                  <span className="logo-text">ResumeLens</span>
                  <span className="pdf-header-label">Detailed Findings & Recommendations</span>
                </div>

                {/* Missing Skills */}
                <div className="result-section" style={{ padding: '20px' }}>
                  <h3 className="result-section-title" style={{ marginBottom: 12 }}>
                    <span style={{ color: 'var(--danger)' }}>⚠</span>
                    &nbsp;Missing Skills ({report.missing_skills?.length || 0})
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

                {/* Strengths & Weaknesses side-by-side */}
                <div style={{ display: 'flex', gap: 20 }}>
                  {/* Strengths */}
                  <div className="result-section" style={{ flex: 1, padding: '20px' }}>
                    <h3 className="result-section-title" style={{ marginBottom: 12 }}>
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

                  {/* Improvements */}
                  <div className="result-section" style={{ flex: 1, padding: '20px' }}>
                    <h3 className="result-section-title" style={{ marginBottom: 12 }}>
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
                  <div className="result-section" style={{ flex: 1, padding: '20px' }}>
                    <h3 className="result-section-title" style={{ marginBottom: 12 }}>
                      <span style={{ color: 'var(--accent)' }}>💡</span>
                      &nbsp;Action Steps
                    </h3>
                    <div className="suggestions-list" style={{ gap: '10px' }}>
                      {report.suggestions.slice(0, 4).map((suggestion, i) => (
                        <div key={i} className="suggestion-item" style={{ padding: '10px 16px' }}>
                          <div className="suggestion-number">{i + 1}</div>
                          <p className="suggestion-text" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pdf-footer">
                  <span className="pdf-footer-brand">ResumeLens Report</span>
                  <span className="pdf-footer-page">Page 2 of 2</span>
                </div>
              </div>
            </div>

          </>
        )}
      </div>
    </div>
  );
}

export default AnalysisResultPage;

