/**
 * analysisAPI.js
 *
 * All API calls related to AI analysis.
 *
 * analyzeResume()      → POST   /api/analysis/analyze/<resumeId>/
 * getReport()          → GET    /api/analysis/<reportId>/
 * getReportByResume()  → GET    /api/analysis/resume/<resumeId>/
 * getHistory()         → GET    /api/analysis/history/
 * getDashboard()       → GET    /api/analysis/dashboard/
 * deleteReport()       → DELETE /api/analysis/<reportId>/delete/
 */

import axiosInstance from './axiosInstance';

// Trigger Gemini AI analysis for a resume
// This is the "big" call — takes a few seconds while Gemini processes
export const analyzeResume = (resumeId) =>
  axiosInstance.post(`/api/analysis/analyze/${resumeId}/`);

// Get a full analysis report by its own ID
export const getReport = (reportId) =>
  axiosInstance.get(`/api/analysis/${reportId}/`);

// Get an analysis report by the resume ID it belongs to
// This is the convenient endpoint — use this right after upload
export const getReportByResume = (resumeId) =>
  axiosInstance.get(`/api/analysis/resume/${resumeId}/`);

// Get all past analyses for the logged-in user (newest first)
export const getHistory = () => axiosInstance.get('/api/analysis/history/');

// Get dashboard stats: total resumes, avg score, best score, recent analyses
export const getDashboard = (config = {}) => axiosInstance.get('/api/analysis/dashboard/', config);

// Delete a specific analysis report (resume stays)
export const deleteReport = (reportId) =>
  axiosInstance.delete(`/api/analysis/${reportId}/delete/`);
