/**
 * LandingPage.jsx
 * Public homepage for ResumeLens.
 * Premium dark theme layout, featuring interactive graphic mockups,
 * glowing capability cards, timeline process tracker, and responsive CTA.
 */

import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <div className="landing-page">
      {/* Top Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <Link to="/" className="landing-nav-brand">
            ResumeLens
          </Link>
          <div className="landing-nav-links">
            <a href="#features" className="landing-nav-link">
              Features
            </a>
            <a href="#how-it-works" className="landing-nav-link">
              How It Works
            </a>
            <Link to="/dashboard" className="landing-nav-link">
              Dashboard
            </Link>
          </div>
          <div className="landing-nav-actions">
            <Link to="/login" className="btn-signin">
              Sign In
            </Link>
            <Link to="/register" className="btn-started">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-container">
        <div className="hero-left">
          <h1 className="hero-title">
            Analyze Your<br />
            Resume <span className="highlight-blue">with AI</span>
          </h1>
          <p className="hero-subtitle">
            Upload your resume and get an ATS score, keyword analysis,
            improvement suggestions, and recruiter-style feedback — instantly.
          </p>
          <div className="hero-cta-group">
            <Link to="/register" className="hero-cta-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Analyze Resume
            </Link>
            <a href="#how-it-works" className="hero-cta-secondary">
              View Demo &rarr;
            </a>
          </div>
        </div>

        <div className="hero-right">
          {/* Floating Keyword Badge */}
          <div className="float-keywords">
            <span className="pulse-dot"></span>
            +12 keywords added
          </div>

          {/* Floating Skill Match Badge */}
          <div className="float-skill-match">
            Skill match
            <span className="match-val">94%</span>
          </div>

          {/* Floating ATS Score Ring Widget */}
          <div className="float-ats-score">
            <div className="ats-ring-container">
              <svg width="48" height="48" viewBox="0 0 48 48">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.03)"
                  strokeWidth="4.5"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="4.5"
                  strokeDasharray="125.6"
                  strokeDashoffset="16.3"
                  strokeLinecap="round"
                  transform="rotate(-90 24 24)"
                />
              </svg>
              <div className="ats-ring-text">87</div>
            </div>
            <div className="ats-details">
              <span className="ats-details-label">ATS Score</span>
              <span className="ats-details-value">Strong Match</span>
              <span className="ats-details-sub">4 improvements found</span>
            </div>
          </div>

          {/* Core Mockup Dashboard UI Card */}
          <div className="mockup-wrapper">
            <div className="mockup-header">
              <span className="mockup-title">Resume Upload</span>
              <span className="mockup-badge">PDF • DOCX</span>
            </div>
            <div className="mockup-dropzone">
              <div className="mockup-icon-box">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div className="mockup-text-main">Drop your resume here</div>
              <div className="mockup-text-sub">or click to browse files</div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="capabilities-section" id="features">
        <p className="cap-label">Capabilities</p>
        <h2 className="cap-title">Everything your resume needs</h2>
        <p className="cap-subtitle">
          Four core engines that work together to turn a weak resume into a recruiter magnet.
        </p>

        <div className="capabilities-grid">
          {/* Card 1: ATS Score */}
          <div className="cap-card card-blue">
            <div className="cap-icon-box">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <h3 className="cap-card-title">ATS Score Analysis</h3>
            <p className="cap-card-desc">
              Instantly score your resume against applicant tracking systems.
              Know exactly where you stand before submitting.
            </p>
            <span className="cap-card-link">
              Learn more &rarr;
            </span>
          </div>

          {/* Card 2: Skill Gap */}
          <div className="cap-card card-purple">
            <div className="cap-icon-box">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>
            <h3 className="cap-card-title">Skill Gap Detection</h3>
            <p className="cap-card-desc">
              Map your skills against job descriptions and surface the exact gaps preventing
              you from reaching the next round.
            </p>
            <span className="cap-card-link">
              Learn more &rarr;
            </span>
          </div>

          {/* Card 3: Suggestions */}
          <div className="cap-card card-amber">
            <div className="cap-icon-box">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18h6" />
                <path d="M10 22h4" />
                <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" />
              </svg>
            </div>
            <h3 className="cap-card-title">Improvement Suggestions</h3>
            <p className="cap-card-desc">
              Receive line-by-line edits and structural recommendations from models
              trained on thousands of hired resumes.
            </p>
            <span className="cap-card-link">
              Learn more &rarr;
            </span>
          </div>

          {/* Card 4: Keyword Optimization */}
          <div className="cap-card card-green">
            <div className="cap-icon-box">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h3 className="cap-card-title">AI Keyword Optimization</h3>
            <p className="cap-card-desc">
              Inject the exact keywords recruiters and ATS parsers look for —
              without making your resume sound robotic.
            </p>
            <span className="cap-card-link">
              Learn more &rarr;
            </span>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="process-section" id="how-it-works">
        <p className="proc-label">Process</p>
        <h2 className="proc-title">Three steps to a better resume</h2>
        <p className="proc-subtitle">
          From upload to actionable report in under 30 seconds.
        </p>

        <div className="process-steps-container">
          <div className="process-divider"></div>

          {/* Step 1 */}
          <div className="proc-step-item">
            <div className="proc-icon-outer">
              <span className="proc-step-num">01</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <h3 className="proc-step-title">Upload Resume</h3>
            <p className="proc-step-desc">
              Drop your PDF or DOCX. We parse every section instantly.
            </p>
          </div>

          {/* Step 2 */}
          <div className="proc-step-item">
            <div className="proc-icon-outer">
              <span className="proc-step-num">02</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-3.12 3 3 0 0 1 0-3.88 2.5 2.5 0 0 1 0-3.12A2.5 2.5 0 0 1 9.5 2z" />
                <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 0-3.12 3 3 0 0 0 0-3.88 2.5 2.5 0 0 0 0-3.12A2.5 2.5 0 0 0 14.5 2z" />
              </svg>
            </div>
            <h3 className="proc-step-title">AI Processes It</h3>
            <p className="proc-step-desc">
              Our model cross-references your content against live job data.
            </p>
          </div>

          {/* Step 3 */}
          <div className="proc-step-item">
            <div className="proc-icon-outer">
              <span className="proc-step-num">03</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <h3 className="proc-step-title">Get Feedback</h3>
            <p className="proc-step-desc">
              Receive a full report: score, gaps, keywords, and rewrites.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-card">
          <div className="cta-icon-box">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <h2 className="cta-title">
            Optimize your resume before<br />
            <span className="highlight-blue">recruiters see it</span>
          </h2>
          <p className="cta-subtitle">
            One upload. One report. Everything you need to pass the ATS and land the interview.
          </p>
          <Link to="/register" className="cta-btn">
            Start Free Analysis &rarr;
          </Link>
          <p className="cta-note">
            No account required &bull; Results in 30 seconds
          </p>
        </div>
      </section>

      {/* Footer (Kept original centered paragraph footer) */}
      <footer className="landing-footer">
        <p>&copy; 2026 ResumeLens</p>
      </footer>
    </div>
  );
}

export default LandingPage;
