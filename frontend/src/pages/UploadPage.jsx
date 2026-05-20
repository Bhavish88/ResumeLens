/**
 * UploadPage.jsx
 *
 * Multi-step resume upload flow:
 * Step 1: Drag-and-drop PDF upload zone + target role input
 * Step 2: "Uploading..." progress indicator
 * Step 3: "Analyzing with AI..." progress indicator
 * → On success: navigate to /result/<resumeId>
 *
 * API calls:
 * 1. POST /api/resumes/upload/ (multipart)
 * 2. POST /api/analysis/analyze/<resumeId>/
 */

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadResume } from '../api/resumeAPI';
import { analyzeResume } from '../api/analysisAPI';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';

const STEPS = [
  { label: 'Select File' },
  { label: 'Uploading' },
  { label: 'Analyzing' },
  { label: 'Done!' },
];

function UploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [targetRole, setTargetRole] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [step, setStep] = useState(0); // 0=select, 1=uploading, 2=analyzing, 3=done
  const [error, setError] = useState('');

  // Handle file selection (drag or click)
  const handleFile = (selected) => {
    setError('');
    if (!selected) return;
    if (selected.type !== 'application/pdf') {
      setError('Only PDF files are accepted.');
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10 MB.');
      return;
    }
    setFile(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    handleFile(dropped);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please select a PDF file.'); return; }
    if (!targetRole.trim()) { setError('Please enter the target job role.'); return; }

    setError('');

    try {
      // Step 1: Upload
      setStep(1);
      const formData = new FormData();
      formData.append('resume_file', file);
      formData.append('target_role', targetRole.trim());
      const uploadRes = await uploadResume(formData);
      const resumeId = uploadRes.data.resume.id;

      // Step 2: Analyze
      setStep(2);
      await analyzeResume(resumeId);

      // Step 3: Done → navigate to result
      setStep(3);
      setTimeout(() => navigate(`/result/${resumeId}`), 800);
    } catch (err) {
      setStep(0);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Something went wrong. Please try again.';
      setError(msg);
    }
  };

  const isSubmitting = step >= 1 && step <= 2;

  return (
    <div className="page-wrapper">
      <Navbar />

      <div className="container" style={{ maxWidth: 680 }}>
        {/* Header */}
        <div className="dashboard-header">
          <h1 className="page-title">Upload Resume</h1>
          <p className="page-subtitle">Get your resume AI-analyzed in under 30 seconds.</p>
        </div>

        {/* Progress Steps */}
        <div className="progress-steps" style={{ marginBottom: 40 }}>
          {STEPS.map((s, i) => (
            <div key={i} className="progress-step">
              <div className={`step-dot ${i === step ? 'active' : i < step ? 'done' : ''}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`step-label ${i === step ? 'active' : i < step ? 'done' : ''}`}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`step-line ${i < step ? 'done' : ''}`} />
              )}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="auth-alert auth-alert-error" style={{ marginBottom: 24 }}>{error}</div>
        )}

        {/* Loading states */}
        {step === 1 && (
          <div className="loading-state">
            <LoadingSpinner size={48} />
            <p className="loading-text" style={{ fontSize: '1rem', fontWeight: 600 }}>Uploading your resume...</p>
            <p className="loading-text">Extracting text from PDF</p>
          </div>
        )}

        {step === 2 && (
          <div className="loading-state">
            <LoadingSpinner size={48} color="#00d4ff" />
            <p className="loading-text" style={{ fontSize: '1rem', fontWeight: 600 }}>Analyzing with Gemini AI...</p>
            <p className="loading-text">This may take 10–20 seconds</p>
          </div>
        )}

        {step === 3 && (
          <div className="loading-state">
            <span style={{ fontSize: '3rem' }}>✅</span>
            <p className="loading-text" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--success)' }}>
              Analysis complete! Redirecting...
            </p>
          </div>
        )}

        {/* Upload Form */}
        {step === 0 && (
          <form onSubmit={handleSubmit}>
            {/* Drop Zone */}
            <div
              className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{ marginBottom: 24 }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="upload-file-input"
                onChange={(e) => handleFile(e.target.files[0])}
              />

              {file ? (
                <>
                  <span className="upload-icon">📄</span>
                  <p className="upload-title" style={{ color: 'var(--success)' }}>
                    {file.name}
                  </p>
                  <p className="upload-subtitle">
                    {(file.size / 1024 / 1024).toFixed(2)} MB · Click to change file
                  </p>
                </>
              ) : (
                <>
                  <span className="upload-icon">☁️</span>
                  <p className="upload-title">Drag & drop your resume here</p>
                  <p className="upload-subtitle">or click to browse · PDF only · max 10 MB</p>
                </>
              )}
            </div>

            {/* Target Role */}
            <div className="form-group">
              <label className="form-label" htmlFor="target-role">Target Job Role</label>
              <input
                id="target-role"
                type="text"
                className="form-input"
                placeholder="e.g. Python Developer, Data Analyst, Product Manager"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                required
              />
            </div>

            <button
              id="analyze-btn"
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={isSubmitting}
              style={{ marginTop: 8 }}
            >
              🚀 Analyze My Resume
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default UploadPage;
