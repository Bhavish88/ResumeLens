# AI Resume Analyzer — Backend Build Documentation

> **What I built and how** — A complete reference explaining every file, decision, and concept in the backend.

---

## 📁 Final Project Structure

```
backend/
├── backend/                    ← Django project config
│   ├── settings.py             ← All Django config (DB, JWT, CORS, etc.)
│   ├── urls.py                 ← Root URL router
│   ├── wsgi.py                 ← WSGI server entry point
│   └── asgi.py                 ← ASGI server entry point
│
├── users/                      ← Authentication app
│   ├── models.py               ← Custom User model
│   ├── serializers.py          ← Register, Login, Profile serializers
│   ├── views.py                ← Auth API views
│   ├── urls.py                 ← Auth URL routes
│   ├── admin.py                ← Admin panel registration
│   └── migrations/             ← Database migration files
│
├── resumes/                    ← Resume management app
│   ├── models.py               ← Resume model
│   ├── pdf_extractor.py        ← PDF text extraction utility
│   ├── serializers.py          ← Upload, list, detail serializers
│   ├── views.py                ← Upload, list, detail, delete views
│   ├── urls.py                 ← Resume URL routes
│   ├── admin.py                ← Admin panel registration
│   └── migrations/             ← Database migration files
│
├── analysis/                   ← AI analysis app
│   ├── models.py               ← AnalysisReport model
│   ├── gemini_service.py       ← Gemini AI integration (THE HEART)
│   ├── serializers.py          ← Full and summary serializers
│   ├── views.py                ← Analyze, result, history, dashboard views
│   ├── urls.py                 ← Analysis URL routes
│   ├── admin.py                ← Admin panel registration
│   └── migrations/             ← Database migration files
│
├── media/                      ← Where uploaded PDFs are stored
├── staticfiles/                ← Where collected static files go
├── manage.py                   ← Django management commands
├── requirements.txt            ← All Python dependencies
├── .env                        ← Your actual secrets (DO NOT commit to git)
└── .env.example                ← Template showing what .env needs
```

---

## 🗄️ Database Schema

The database has 3 main tables matching the project spec exactly:

### TABLE 1 — `users`
| Column | Type | Notes |
|--------|------|-------|
| `id` | BigInt (PK) | Auto-generated |
| `name` | VARCHAR(150) | User's display name |
| `email` | VARCHAR (UNIQUE) | Used as login identifier |
| `password` | VARCHAR | Hashed by Django (bcrypt-like) |
| `created_at` | DateTime | Auto-set on creation |
| `is_active` | Boolean | Account enabled flag |
| `is_staff` | Boolean | Admin panel access |

**Why custom User model?** Django's default uses `username` for login. We use `email` instead — more professional and modern.

### TABLE 2 — `resumes`
| Column | Type | Notes |
|--------|------|-------|
| `id` | BigInt (PK) | Auto-generated |
| `user_id` | FK → users | Ownership link |
| `resume_file` | FileField | Stored at `media/resumes/<user_id>/` |
| `extracted_text` | TextField | Text pulled from PDF by pdfplumber |
| `target_role` | VARCHAR(200) | e.g. "Python Developer" |
| `file_name` | VARCHAR(255) | Original filename |
| `uploaded_at` | DateTime | Auto-set on creation |

### TABLE 3 — `analysis_reports`
| Column | Type | Notes |
|--------|------|-------|
| `id` | BigInt (PK) | Auto-generated |
| `resume_id` | OneToOne FK → resumes | One report per resume |
| `ats_score` | Integer | 1-100 score from AI |
| `missing_skills` | JSONField | List of missing skills |
| `strengths` | JSONField | List of resume strengths |
| `weaknesses` | JSONField | List of weak sections |
| `suggestions` | JSONField | Actionable improvements |
| `final_verdict` | TextField | 2-3 sentence AI summary |
| `full_ai_response` | TextField | Raw Gemini output (for audit) |
| `created_at` | DateTime | Auto-set on creation |

---

## 🔐 Authentication System

**Technology:** JWT (JSON Web Tokens) via `djangorestframework-simplejwt`

### How it works:
1. User registers → password is **hashed by Django** → stored securely
2. User logs in → Django verifies password → **two tokens are generated**:
   - `access token` — valid for **2 hours**, sent with every API request
   - `refresh token` — valid for **7 days**, used to get new access tokens
3. Frontend stores tokens (localStorage/cookie)
4. Every protected API request includes: `Authorization: Bearer <access_token>`
5. On logout → refresh token is **blacklisted** (can't be reused even if stolen)

### Why JWT?
- Stateless (no server-side session storage)
- Standard for React frontends
- Secure with proper blacklisting on logout

### Auth Endpoints:
| Method | URL | Auth Required | Description |
|--------|-----|---------------|-------------|
| POST | `/api/auth/register/` | ❌ | Create new account |
| POST | `/api/auth/login/` | ❌ | Get JWT tokens |
| POST | `/api/auth/logout/` | ✅ | Blacklist refresh token |
| GET/PUT | `/api/auth/me/` | ✅ | View/update profile |
| POST | `/api/auth/token/refresh/` | ❌ | Get new access token |

---

## 📄 PDF Extraction System

**File:** `resumes/pdf_extractor.py`  
**Technology:** `pdfplumber` (better than PyPDF2 for complex layouts)

### The extraction pipeline:
```
PDF Upload
   ↓
pdfplumber.open(file_obj)
   ↓
Loop through each page
   ↓
page.extract_text() per page
   ↓
Combine all pages into one string
   ↓
Clean the text:
   - Remove extra blank lines
   - Normalize multiple spaces → single space
   - Remove non-printable characters
   - Strip leading/trailing whitespace
   ↓
Store cleaned text in database
```

> [!TIP]
> **Why pdfplumber?** It handles multi-column layouts, tables, and complex PDFs much better than PyPDF2. It uses a different rendering engine (pdfminer) that preserves text order.

> [!IMPORTANT]
> The PDF must contain **selectable text** — scanned image PDFs will return empty text. OCR (like Tesseract) would be needed for scanned PDFs (not implemented yet).

### Resume Endpoints:
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/resumes/upload/` | Upload PDF, extract text, save |
| GET | `/api/resumes/` | List all user's resumes |
| GET | `/api/resumes/<id>/` | Get one resume's full detail |
| DELETE | `/api/resumes/<id>/delete/` | Delete resume + file |

---

## 🤖 Gemini AI Integration

**File:** `analysis/gemini_service.py`  
**Technology:** `google-genai` SDK, model: `gemini-2.0-flash`

### Why this is the most important part:

Most students send a weak prompt: *"Analyze this resume"* — the output is generic, unstructured text that's hard to display and parse.

We use **structured prompt engineering** to force Gemini to output a specific JSON schema every time.

### The Prompt Engineering:

```
You are a professional ATS resume analyzer with 10+ years experience.
Analyze this resume for a **{target_role}** position.
Return ONLY valid JSON in this exact format:
{
  "ats_score": <1-100>,
  "missing_skills": [...],
  "strengths": [...],
  "weaknesses": [...],
  "suggestions": [...],
  "final_verdict": "..."
}
```

**Why this works:**
- The model is given a role ("professional ATS analyzer") → better framing
- The JSON schema is explicitly defined → consistent, parseable output
- `temperature=0.3` → lower creativity, higher consistency
- The scoring guide gives the model calibration benchmarks

### The Parsing Pipeline:

```
Raw Gemini Response (might be wrapped in ```json...```)
   ↓
_parse_gemini_response()
   ↓
Extract JSON using regex (handles markdown code blocks)
   ↓
json.loads() → Python dict
   ↓
Validate each field (_safe_int, _safe_list)
   ↓
Return clean structured dict
   ↓
Save to AnalysisReport model
```

> [!NOTE]
> We store the `full_ai_response` (raw Gemini text) in the database too. This is useful for debugging if parsing fails, and for audit purposes.

### Analysis Endpoints:
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/analysis/analyze/<resume_id>/` | Trigger AI analysis |
| GET | `/api/analysis/<report_id>/` | Get full report |
| GET | `/api/analysis/resume/<resume_id>/` | Get report by resume ID |
| GET | `/api/analysis/history/` | All user's past reports |
| GET | `/api/analysis/dashboard/` | Aggregated stats |
| DELETE | `/api/analysis/<report_id>/delete/` | Delete a report |

---

## 📊 Dashboard Stats API

`GET /api/analysis/dashboard/` returns:

```json
{
  "total_resumes": 5,
  "total_analyses": 4,
  "average_ats_score": 68.5,
  "best_ats_score": 82,
  "recent_analyses": [...]
}
```

This is computed using Django ORM aggregations (`Avg`, `Max`, `Count`) — no raw SQL needed.

---

## 🔒 Security Features Built In

| Feature | Implementation |
|---------|----------------|
| Password hashing | Django's `set_password()` (PBKDF2 by default) |
| JWT authentication | `djangorestframework-simplejwt` |
| Token blacklisting on logout | `token_blacklist` app |
| CORS protection | `django-cors-headers` (only allow frontend domain) |
| File type validation | Only `.pdf` extension accepted |
| File size limit | 10MB max enforced in both settings and serializer |
| Object-level permissions | Users can only access/delete their own data |
| Token expiry | Access: 2h, Refresh: 7d |

---

## 🛠️ Complete API Reference

### Auth (`/api/auth/`)

```
POST   /api/auth/register/         → { name, email, password, password2 }
POST   /api/auth/login/            → { email, password }
POST   /api/auth/logout/           → { refresh }              [JWT Required]
GET    /api/auth/me/               →                           [JWT Required]
PUT    /api/auth/me/               → { name }                  [JWT Required]
POST   /api/auth/token/refresh/    → { refresh }
```

### Resumes (`/api/resumes/`)

```
POST   /api/resumes/upload/        → Form: { resume_file (PDF), target_role }   [JWT]
GET    /api/resumes/               →                                              [JWT]
GET    /api/resumes/<id>/          →                                              [JWT]
DELETE /api/resumes/<id>/delete/   →                                              [JWT]
```

### Analysis (`/api/analysis/`)

```
POST   /api/analysis/analyze/<resume_id>/   →                [JWT]
GET    /api/analysis/<report_id>/           →                [JWT]
GET    /api/analysis/resume/<resume_id>/    →                [JWT]
GET    /api/analysis/history/              →                [JWT]
GET    /api/analysis/dashboard/            →                [JWT]
DELETE /api/analysis/<report_id>/delete/   →                [JWT]
```

---

## ⚙️ How to Run the Backend

### Step 1: Set up MySQL database
```sql
CREATE DATABASE ai_resume_analyzer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 2: Configure `.env`
Fill in your values:
```
DB_PASSWORD=your_mysql_password
GEMINI_API_KEY=your_key_from_aistudio.google.com
```

### Step 3: Run migrations
```bash
cd backend
python manage.py migrate
```

### Step 4: Create superuser (for admin panel)
```bash
python manage.py createsuperuser
```

### Step 5: Start server
```bash
python manage.py runserver
```

Backend runs at: **http://localhost:8000**  
Admin panel: **http://localhost:8000/admin/**

---

## 🔗 Typical User Flow (API calls in order)

```
1. POST /api/auth/register/           → create account
2. POST /api/auth/login/              → get access + refresh tokens
3. POST /api/resumes/upload/          → upload PDF (JWT in header)
   ← returns resume ID
4. POST /api/analysis/analyze/<id>/   → trigger Gemini analysis (JWT in header)
   ← returns structured report
5. GET  /api/analysis/dashboard/      → show stats on dashboard (JWT in header)
6. GET  /api/analysis/history/        → show past analyses (JWT in header)
7. POST /api/auth/logout/             → blacklist refresh token
```

---

## 📦 Python Dependencies

| Package | Purpose |
|---------|---------|
| `django` | Core web framework |
| `djangorestframework` | REST API toolkit |
| `djangorestframework-simplejwt` | JWT authentication |
| `mysqlclient` | MySQL database adapter |
| `pdfplumber` | PDF text extraction |
| `google-genai` | Gemini AI SDK (new official SDK) |
| `python-dotenv` | Load environment variables from .env |
| `django-cors-headers` | CORS control for frontend access |
| `Pillow` | Image processing (Django file handling) |

---

> [!WARNING]
> **Before running:** Make sure to fill in `.env` with your actual `DB_PASSWORD` and `GEMINI_API_KEY`. The backend will start but won't connect to MySQL or AI without these.

> [!CAUTION]
> **Never commit `.env` to git.** Add it to `.gitignore`. Use `.env.example` as the safe template to share.
