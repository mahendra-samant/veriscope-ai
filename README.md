# VeriScope AI — AI-Powered News Verification Platform

**Less noise. More clarity. Verify information with AI-assisted analysis.**

VeriScope AI is a full-stack misinformation analysis platform that helps users investigate news claims and information shared online. It combines Google Gemini AI, Google News RSS, and Optical Character Recognition (OCR) to assess claims as **REAL, FAKE, or UNVERIFIED**.

Users can submit text-based claims or upload screenshots containing information they want to investigate. The platform retrieves related news coverage, generates an AI-assisted assessment, and maintains a personal verification history.

> **Important:** VeriScope AI provides an AI-generated assessment, not definitive proof. Always review original and authoritative sources before relying on or sharing information.

---

## Features

### 1. AI-Powered Claim Verification
- Analyze news claims and information using Google Gemini.
- Classify claims into three categories: REAL, FAKE, and UNVERIFIED.
- Display an AI-generated explanation and confidence estimate.
- Preserve uncertainty when available evidence is insufficient.

### 2. Screenshot Text Extraction (OCR)
- Upload JPG, PNG, and WEBP images.
- Extract text from screenshots using Tesseract OCR.
- Automatically submit extracted text for verification.
- Display the extracted content alongside the analysis.

### 3. Related News Search
- Retrieve related news coverage using Google News RSS.
- Display article titles, publishers, publication dates, and source links.
- Provide additional context to support further investigation.

### 4. User Authentication
- User registration and login.
- Password hashing.
- JWT-based authentication.
- Protected user-specific resources.

### 5. Verification History
- Save previous verification results in PostgreSQL.
- View recent verification records.
- Track REAL, FAKE, and UNVERIFIED statistics.
- Delete individual history records.

### 6. Modern User Interface
- React-based responsive interface.
- Interactive 3D intelligence visualization.
- Framer Motion animations.
- Dark and light theme support.
- Dedicated landing, authentication, and verification experiences.

---

## How It Works

```text
       User submits a claim
                |
                v
      Text or image upload
                |
                v
       OCR text extraction
       (for image uploads)
                |
                v
       Google News RSS
       Related news search
                |
                v
        Google Gemini AI
       Evidence-aware analysis
                |
                v
        Verification result
       REAL / FAKE / UNVERIFIED
                |
                v
       Save result in database
                |
                v
       Display result and history
```

---

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js, JavaScript |
| Build Tool | Vite |
| UI & Animations | CSS, Framer Motion |
| 3D Visualization | Three.js, React Three Fiber, Drei |
| Icons | Lucide React |
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| AI Integration | Google Gemini API |
| News Integration | Google News RSS |
| OCR | Tesseract OCR, Pillow, Pytesseract |
| Authentication | JWT, Passlib, bcrypt |
| API Communication | Axios |

---

## Project Structure

```text
VeriScopeAI/
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── security.py
│   │   └── services.py
│   │
│   ├── .env.example
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── main.jsx
│   │   └── style.css
│   │
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
├── ATTRIBUTION.md
└── README.md
```

---

## Installation and Setup

Follow these instructions to run VeriScope AI locally on Windows.

### Prerequisites

Install the following:

- Python 3.10 or newer
- Node.js 18 or newer
- PostgreSQL 14 or newer
- Tesseract OCR
- Git

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd VeriScopeAI
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your actual GitHub repository URL.

### 2. Create the Database

Open PostgreSQL or pgAdmin and execute:

```sql
CREATE DATABASE veriscope;
```

### 3. Configure the Backend

Open a terminal in the project root:

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Create your environment file:

```powershell
Copy-Item .env.example .env
```

Open `backend/.env` and configure the following:

```env
DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/veriscope
JWT_SECRET_KEY=YOUR_SECRET_KEY
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=YOUR_SUPPORTED_GEMINI_MODEL
FRONTEND_URL=http://localhost:5173
```

**Important:**
- Replace the database password with your PostgreSQL password.
- Generate a secure JWT secret.
- Add your Gemini API key from Google AI Studio.
- Set `GEMINI_MODEL` to a model currently supported by your Gemini API key.
- Never upload your `.env` file or API keys to GitHub.

Start the backend:

```powershell
uvicorn app.main:app --reload
```

Backend API:

`http://127.0.0.1:8000`

Interactive API documentation:

`http://127.0.0.1:8000/docs`

Health check:

`http://127.0.0.1:8000/health`

The application creates its database tables automatically when the backend starts.

### 4. Configure the Frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the application:

`http://localhost:5173`

---

## Tesseract OCR Configuration

Screenshot verification requires Tesseract OCR.

1. Install Tesseract OCR on Windows.
2. Add its installation directory to your system PATH.
3. Restart your terminal and backend server.

A common installation location is:

```text
C:\Program Files\Tesseract-OCR\tesseract.exe
```

Text-based claim verification does not require OCR.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Check API and database status |
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Authenticate a user |
| GET | `/api/auth/me` | Retrieve current user |
| POST | `/api/predict` | Verify a text-based claim |
| POST | `/api/image-predict` | Extract and verify image text |
| GET | `/api/auth/history` | Retrieve verification history |
| GET | `/api/auth/stats` | Retrieve verification statistics |
| DELETE | `/api/auth/history/{prediction_id}` | Delete a history record |

Protected endpoints require JWT authentication.

---

## Example Verification Scenarios

| Submitted Claim | Expected Assessment |
|---|---|
| The Earth revolves around the Sun. | REAL |
| The Sun revolves around the Earth. | FAKE |
| Scientists discovered a new ocean beneath Mars in November 2026. | UNVERIFIED |

*These are example test cases, not permanent classifications. Results depend on the available context and AI response.*

---

## Security and Responsible AI

- Passwords are stored as hashes rather than plain text.
- JWT authentication protects user-specific endpoints.
- Verification history is associated with individual accounts.
- API keys and database credentials are stored in environment variables.
- Claims without sufficient evidence can be classified as UNVERIFIED.

AI-generated results may contain errors. News coverage retrieved through RSS is contextual information and should not automatically be treated as proof.

---

## Future Improvements

- Improve relevance filtering for retrieved news articles.
- Integrate additional trusted fact-checking sources.
- Add multilingual claim analysis.
- Improve evidence comparison and source credibility assessment.
- Expand verification analytics and reporting.

---

## Project Attribution

This project was adapted from a supplied VeriScope AI / TruthLens codebase and customized with changes to its architecture, dependencies, integrations, and user interface.

Please review `ATTRIBUTION.md` and the original upstream licensing terms before redistributing the project.

---

## Author

**VeriScope AI**

*Verify information. Understand the evidence. Think before you share.*
