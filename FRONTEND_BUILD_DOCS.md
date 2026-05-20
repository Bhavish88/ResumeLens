# AI Resume Analyzer — Frontend Build Documentation

> **What I built and how** — A complete reference explaining every file, decision, and concept in the frontend. Just like the backend docs, this explains the *why* behind every choice.

---

## 📁 Final Project Structure

```
frontend/
├── index.html                     ← App entry (title, meta, root div)
├── vite.config.js                 ← Vite config + API proxy to Django
├── package.json                   ← Dependencies list
│
└── src/
    ├── main.jsx                   ← Renders React into #root, wraps with BrowserRouter
    ├── App.jsx                    ← All routes defined here (public + protected)
    ├── index.css                  ← ENTIRE design system (colors, components, animations)
    │
    ├── api/                       ← All backend communication (one file per domain)
    │   ├── axiosInstance.js       ← Base HTTP client + JWT interceptor (THE KEY FILE)
    │   ├── authAPI.js             ← register, login, logout, getProfile
    │   ├── resumeAPI.js           ← uploadResume, listResumes, getResume, deleteResume
    │   └── analysisAPI.js         ← analyzeResume, getReport, getHistory, getDashboard
    │
    ├── context/
    │   └── AuthContext.jsx        ← Global auth state: user, login(), logout(), loading
    │
    ├── components/                ← Reusable UI building blocks
    │   ├── Navbar.jsx             ← Top navigation bar (shown on all protected pages)
    │   ├── ProtectedRoute.jsx     ← Route guard: redirects to /login if not authed
    │   ├── ScoreGauge.jsx         ← Animated SVG circular ATS score display
    │   ├── SkillBadge.jsx         ← Colored pill/tag for skills and categories
    │   └── LoadingSpinner.jsx     ← CSS-animated spinner for loading states
    │
    └── pages/                     ← One file per screen
        ├── LandingPage.jsx        ← Public homepage (hero + features)
        ├── LoginPage.jsx          ← Email + password login form
        ├── RegisterPage.jsx       ← Registration form with field-level errors
        ├── DashboardPage.jsx      ← Stats overview + recent 5 analyses
        ├── UploadPage.jsx         ← Drag-and-drop upload + multi-step progress
        ├── AnalysisResultPage.jsx ← Full AI report (score, skills, suggestions)
        └── HistoryPage.jsx        ← All past analyses with delete option
```

---

## 🔗 How Frontend Connects to Backend

### The Proxy (vite.config.js)
```
Browser (React on :3000) ──/api/──→ Vite Proxy ──→ Django (:8000)
```

When React makes a request to `/api/auth/login/`, Vite's proxy automatically forwards it to `http://localhost:8000/api/auth/login/`.

**Why proxy?** Avoids CORS issues during development. In production, you'd configure Nginx to do the same thing.

### The Axios Instance (axiosInstance.js)
This is **the most important file** in the API layer. It does 3 things:

**1. Request Interceptor — Attach JWT Token**
```
Every request → reads localStorage('access_token') → adds to header:
Authorization: Bearer <access_token>
```
No component ever manually adds this header. It's automatic.

**2. Response Interceptor — Handle Token Expiry**
```
Any 401 response
    ↓
Call POST /api/auth/token/refresh/ with stored refresh token
    ↓ (success)
Save new access token → retry the original request transparently
    ↓ (failure)
Clear localStorage → redirect to /login
```

**3. Request Queue**
If multiple requests fail at the same time (common on page load), only ONE refresh call is made. Others wait in a queue and retry once the new token arrives.

---

## 🗺️ Page-by-Page Breakdown

### LandingPage (`/`)
- Public page, no auth needed
- Shows: hero headline, CTA buttons (Register / Login), 6 feature cards
- No API calls

### LoginPage (`/login`)
- Calls `POST /api/auth/login/` via `AuthContext.login()`
- On success: tokens saved to `localStorage`, user set in context, redirect to `/dashboard`
- If already logged in → redirected to `/dashboard` automatically (App.jsx handles this)

### RegisterPage (`/register`)
- Calls `POST /api/auth/register/`
- Maps Django serializer field errors to individual form fields
  - e.g., `{ errors: { email: ["already exists"] } }` → shows under email input
- On success: saves tokens, then calls `login()` to populate user state

### DashboardPage (`/dashboard`)
- Calls `GET /api/analysis/dashboard/`
- Renders 4 stat cards + recent 5 analyses list
- Each analysis row is clickable → navigates to `/result/<resumeId>`

### UploadPage (`/upload`)
- **Step 0** — File drop zone + target role input
  - Validates: PDF only, max 10MB
- **Step 1** — Calls `POST /api/resumes/upload/` with `multipart/form-data`
  - Note: `Content-Type: multipart/form-data` is set explicitly (Django needs this for file uploads)
- **Step 2** — Calls `POST /api/analysis/analyze/<resumeId>/`
  - This is the Gemini AI call — takes 10–20 seconds
- **Step 3** — Success animation → navigate to `/result/<resumeId>`

### AnalysisResultPage (`/result/:resumeId`)
- Calls `GET /api/analysis/resume/<resumeId>/` (get report by resume ID, not report ID)
- Renders animated `ScoreGauge`, then:
  - Final Verdict (blockquote style)
  - Missing Skills (red SkillBadge chips)
  - Strengths (green checkmarks)
  - Weaknesses (amber warnings)
  - Numbered Action Steps

### HistoryPage (`/history`)
- Calls `GET /api/analysis/history/`
- Lists all analyses, newest first
- Each row: role name, file name, date, score pill, delete button
- Delete calls `DELETE /api/analysis/<reportId>/delete/`
  - The delete button uses `e.stopPropagation()` so clicking it doesn't also navigate to result

---

## 🎨 Design System (index.css)

Everything is CSS variables — no Tailwind, no CSS-in-JS.

### Color Palette (Dark Mode)
| Variable | Value | Used For |
|----------|-------|----------|
| `--bg-base` | `#07070f` | Page background |
| `--bg-card` | `#13131f` | Card backgrounds |
| `--primary` | `#6c63ff` | Buttons, active links |
| `--accent` | `#00d4ff` | Highlights, accents |
| `--success` | `#00e5a0` | Green score, strengths |
| `--warning` | `#ffb347` | Amber score, weaknesses |
| `--danger` | `#ff4f6b` | Red score, missing skills |

### Typography
- Font: **Inter** (from Google Fonts) — the same font used by Linear, Notion, Vercel
- Imported via `@import url(...)` in CSS

### ATS Score Colors
| Score | Color | Meaning |
|-------|-------|---------|
| 75–100 | `--success` (green) | Strong resume |
| 50–74 | `--warning` (amber) | Needs improvement |
| 0–49 | `--danger` (red) | Major issues |

### Animations
| Name | Usage |
|------|-------|
| `fadeInUp` | Pages + cards appearing |
| `spin` | LoadingSpinner |
| `pulse-glow` | Glow effect on cards |

---

## 🔐 Auth Flow (End to End)

```
1. User visits /dashboard (protected)
   ↓
2. ProtectedRoute checks: loading? → show spinner
   isAuthenticated? → render page
   not auth? → redirect to /login
   ↓
3. AuthContext.useEffect on mount:
   → reads localStorage access_token
   → calls GET /api/auth/me/
   → sets user state
   ↓
4. User logs in:
   → POST /api/auth/login/
   → tokens saved to localStorage
   → user set in context state
   ↓
5. Every API request:
   → axiosInstance request interceptor adds Bearer token
   ↓
6. Token expires (after 2 hours):
   → any request gets 401
   → response interceptor auto-calls /api/auth/token/refresh/
   → retries original request with new token
   → user never notices
   ↓
7. User logs out:
   → POST /api/auth/logout/ (blacklists refresh token on server)
   → localStorage.clear()
   → navigate to /login
```

---

## 🛠️ Technology Choices

| Technology | Why |
|------------|-----|
| **React** | Component-based UI, industry standard |
| **Vite** | Fast dev server (replaces slow Create React App). You write the same React code — Vite is just the engine |
| **React Router v6** | Client-side routing with `<Routes>`, `<Route>`, `useNavigate`, `useParams` |
| **Axios** | Better than fetch: interceptors, auto JSON parse, cleaner error handling |
| **CSS Variables** | Simple, powerful, no extra dependencies |
| **Inter font** | Modern, readable, professional |

---

## 📦 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | 19.x | UI framework |
| `react-dom` | 19.x | Renders React to DOM |
| `react-router-dom` | 7.x | Client-side routing |
| `axios` | 1.x | HTTP client with interceptors |
| `framer-motion` | 12.x | Installed, available for animations |

---

## ⚙️ How to Run

### Step 1: Make sure backend is running
```bash
cd backend
python manage.py runserver
```
Backend must be on **port 8000**.

### Step 2: Start frontend
In a new terminal:
```powershell
# Set Node path (since Node isn't in system PATH)
$env:PATH = "C:\B-Projects\FinalPortfolio\node_runtime\node-v20.19.1-win-x64;" + $env:PATH
cd "C:\B-Projects\Ai Resume Analyzer\frontend"
npm run dev
```

Frontend runs at: **http://localhost:3000**

> [!TIP]
> Add Node to your permanent system PATH so you don't need to set it every time:
> Settings → System → Advanced System Settings → Environment Variables → Path → Add:
> `C:\B-Projects\FinalPortfolio\node_runtime\node-v20.19.1-win-x64`

---

## 🔁 Typical User Flow

```
1. Visit http://localhost:3000      → Landing page
2. Click "Get Started Free"        → /register
3. Fill name, email, password      → POST /api/auth/register/
4. Auto-login + redirect           → /dashboard (shows empty stats)
5. Click "Upload New Resume"       → /upload
6. Drag PDF, enter role, click Go  → POST /api/resumes/upload/
7. Auto-analyze with Gemini        → POST /api/analysis/analyze/<id>/
8. Redirect to result              → /result/<resumeId>
9. View score, skills, suggestions → GET /api/analysis/resume/<id>/
10. Click Dashboard                → /dashboard (now shows stats)
11. Click History                  → /history (all past analyses)
12. Click Logout                   → POST /api/auth/logout/ → /login
```

---

> [!IMPORTANT]
> **Both servers must be running simultaneously:**
> - Backend: `python manage.py runserver` → port 8000
> - Frontend: `npm run dev` → port 3000
> Vite's proxy connects them — no CORS errors during development.

> [!NOTE]
> **Why `/result/:resumeId` and not `/result/:reportId`?**
> The URL uses the **resume** ID (not the analysis report ID) because after upload we immediately know the resume ID. The frontend then calls `/api/analysis/resume/<resumeId>/` which returns the report. This is cleaner than tracking two different IDs.
