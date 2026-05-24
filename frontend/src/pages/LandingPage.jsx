/**
 * LandingPage.jsx
 * Public homepage. Shows hero section + feature cards + CTA buttons.
 * No auth required.
 */

import { Link } from 'react-router-dom';

const features = [
  {
    icon: '📋',
    title: 'In-Depth Evaluation',
    desc: 'Get structured feedback on content, formatting, and relevance based on professional hiring standards.',
  },
  {
    icon: '📊',
    title: 'Match Score (1–100)',
    desc: 'Get an estimate of how well your resume matches your target job requirements and industry standards.',
  },
  {
    icon: '🎯',
    title: 'Role-Specific Feedback',
    desc: 'Tailor your analysis to specific career paths, like engineering, analytics, design, or project management.',
  },
  {
    icon: '🔍',
    title: 'Skill Gap Identification',
    desc: 'Discover critical technical and soft skills that are highly valued but missing from your current profile.',
  },
  {
    icon: '💡',
    title: 'Actionable Steps',
    desc: 'Receive specific, clear recommendations and adjustments to make your achievements stand out.',
  },
  {
    icon: '📈',
    title: 'Track Improvements',
    desc: 'Compare multiple versions of your resume to systematically improve your scores and polish your presentation.',
  },
];

function LandingPage() {
  return (
    <div className="landing-page">
      {/* Top Nav */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: '1.15rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #a78bfa, #00d4ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>ResumeLens</span>
          </div>
          <div className="landing-nav-links">
            <Link to="/login" className="btn btn-secondary btn-sm">
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Get Started 
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">
          Professional Resume Evaluation
        </div>
        <h1 className="hero-title">
          Optimize your resume for<br />
          <span className="gradient-text">your next career move</span>
        </h1>
        <p className="hero-subtitle">
          Get detailed insights on how recruiters and tracking systems evaluate your experience.
          Identify missing skills, highlight your strengths, and receive clear, actionable recommendations.
        </p>
        <div className="btn-group hero-cta">
          <Link to="/register" className="btn btn-primary btn-lg">
            Review Your Resume →
          </Link>
          <Link to="/login" className="btn btn-secondary btn-lg">
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <p className="section-label">Features</p>
        <h2 className="section-title">Clean, Precise, Objective Feedback</h2>
        <p className="section-subtitle">
          Stop guessing. Get detailed, structured feedback to improve your response rates and land more interviews.
        </p>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card" style={{ animationDelay: `${i * 0.07}s` }}>
              <span className="feature-icon">{f.icon}</span>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>© 2026 ResumeLens</p>
      </footer>
    </div>
  );
}

export default LandingPage;
