/**
 * LandingPage.jsx
 * Public homepage. Shows hero section + feature cards + CTA buttons.
 * No auth required.
 */

import { Link } from 'react-router-dom';

const features = [
  {
    icon: '🤖',
    title: 'Gemini AI Analysis',
    desc: 'Powered by Google Gemini 2.0 Flash — the same AI used by professionals to evaluate thousands of resumes.',
  },
  {
    icon: '📊',
    title: 'ATS Score (1–100)',
    desc: 'Get a precise Applicant Tracking System score that tells you exactly how recruiters\' software rates your resume.',
  },
  {
    icon: '🎯',
    title: 'Role-Specific Feedback',
    desc: 'Upload for any role — Python Developer, Product Manager, Data Scientist — and get feedback tailored to that job.',
  },
  {
    icon: '⚡',
    title: 'Missing Skills Detection',
    desc: 'Instantly identify which skills are missing from your resume vs. what the industry expects for your target role.',
  },
  {
    icon: '💡',
    title: 'Actionable Suggestions',
    desc: 'Don\'t just hear what\'s wrong — get specific, numbered steps to improve your resume right now.',
  },
  {
    icon: '📈',
    title: 'Track Your Progress',
    desc: 'Upload multiple versions and watch your ATS score improve over time on your personal dashboard.',
  },
];

function LandingPage() {
  return (
    <div className="landing-page">
      {/* Top Nav */}
      <nav className="landing-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '1.4rem' }}>⚡</span>
          <span style={{
            fontSize: '1.15rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #a78bfa, #00d4ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>ResumeAI</span>
        </div>
        <div className="landing-nav-links">
          <Link to="/login" className="btn btn-secondary" style={{ padding: '8px 20px', fontSize: '0.875rem' }}>
            Sign In
          </Link>
          <Link to="/register" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '0.875rem' }}>
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">
          <span>✨</span> Powered by Google Gemini AI
        </div>
        <h1 className="hero-title">
          Get Your Resume<br />
          <span className="gradient-text">AI-Analyzed in Seconds</span>
        </h1>
        <p className="hero-subtitle">
          Upload your PDF, pick your target role, and get a detailed ATS score,
          missing skills, strengths, and specific improvement suggestions —
          all powered by Gemini AI.
        </p>
        <div className="hero-cta">
          <Link to="/register" className="btn btn-primary btn-lg">
            Analyze My Resume →
          </Link>
          <Link to="/login" className="btn btn-secondary btn-lg">
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <p className="section-label">What You Get</p>
        <h2 className="section-title">Everything You Need to Land the Job</h2>
        <p className="section-subtitle">
          Stop guessing. Get precise, AI-driven feedback on your resume in under 30 seconds.
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
        <p>© 2026 ResumeAI · Built with Django + React + Google Gemini</p>
      </footer>
    </div>
  );
}

export default LandingPage;
