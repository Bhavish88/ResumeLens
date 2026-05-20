/**
 * resumeAPI.js
 *
 * All API calls related to resume management.
 *
 * uploadResume()  → POST   /api/resumes/upload/      (multipart/form-data)
 * listResumes()   → GET    /api/resumes/
 * getResume()     → GET    /api/resumes/<id>/
 * deleteResume()  → DELETE /api/resumes/<id>/delete/
 */

import axiosInstance from './axiosInstance';

// Upload a PDF resume with a target role
// formData must contain: resume_file (File), target_role (string)
// Note: must use multipart/form-data, not JSON — that's what the backend expects
export const uploadResume = (formData) =>
  axiosInstance.post('/api/resumes/upload/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

// Get all resumes for the logged-in user
export const listResumes = () => axiosInstance.get('/api/resumes/');

// Get full detail of a single resume (includes extracted text)
export const getResume = (id) => axiosInstance.get(`/api/resumes/${id}/`);

// Delete a resume and its associated file
export const deleteResume = (id) => axiosInstance.delete(`/api/resumes/${id}/delete/`);
