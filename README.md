# ResumeLens — AI Powered Resume Analyzer

ResumeLens is a modern full-stack AI-powered resume analysis platform that evaluates resumes using ATS (Applicant Tracking System) techniques and provides intelligent, role-specific feedback to improve resume quality and hiring potential.

The platform analyzes uploaded PDF resumes, calculates ATS compatibility scores, detects missing skills and keywords, and generates AI-powered personalized improvement suggestions using Gemini AI.

---

# Features

## Authentication & Security
- User Signup & Login
- JWT Authentication
- Protected API Routes
- Secure Environment Variable Handling
- File Validation & Upload Security

---

# Resume Analysis Features

## ATS Resume Evaluation
- ATS Compatibility Scoring
- Resume Structure Analysis
- Resume Completeness Evaluation
- Role-Based Resume Scoring
- Visual ATS Score Breakdown

## AI-Powered Analysis
- Gemini AI Integration
- Personalized Resume Feedback
- Intelligent Improvement Suggestions
- Context-Aware Resume Recommendations
- Professional Resume Summary Generation

## Missing Skills Detection
- Role-Specific Skill Gap Analysis
- Missing Keyword Detection
- Industry-Relevant Recommendations

---

# Dashboard & History

- Resume Analysis Dashboard
- ATS Score Analytics
- Resume Upload History
- Best Score Tracking
- Average ATS Score Tracking
- Recent Analysis Overview

---

# Export & Reporting

- Downloadable PDF Analysis Report
- Printable Resume Evaluation
- Structured Analysis Export

---

# Tech Stack

## Frontend
- React.js
- Tailwind CSS
- JavaScript
- Vite

## Backend
- Django
- Django REST Framework

## Database
- MySQL

## AI Integration
- Gemini AI API

---

# Project Structure

```bash
ResumeLens/
│
├── backend/
│   ├── backend/
│   ├── resumes/
│   ├── users/
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
│
└── README.md
