# PAINSENSE-AI REST API Reference

Interactive OpenAPI documentation is automatically served at `/docs` (Swagger UI) and `/redoc`.

## Base URL
- Local: `http://localhost:8000/api`
- Production: Configurable via `VITE_API_BASE_URL`

## Core Endpoints

### 1. Authentication
- `POST /api/auth/register`: Create user account with role (`patient`, `caregiver`, `doctor`).
- `POST /api/auth/login`: Authenticate with email/password; returns JWT access token.
- `POST /api/auth/token`: OAuth2 password flow compatibility.
- `GET /api/auth/me`: Retrieve authenticated user profile.

### 2. Multimodal Assessment & Fusion
- `POST /api/assessment/fuse-and-save`: Fuses active modalities (camera, voice, sign, self-report) and saves to database.
- `GET /api/assessment/history`: Retrieve recent assessment history.
- `GET /api/assessment/{id}`: Detailed multimodal assessment breakdown.
- `POST /api/fusion/analyze`: Stateless multimodal fusion inference.

### 3. Modality Analysis
- `POST /api/camera/analyze`: Evaluates facial action units (AU4, AU6/7, AU25) and posture guarding.
- `GET /api/camera/status`: Returns optical model status.
- `POST /api/voice/analyze`: Extracts pain location, duration, severity, and acoustic strain index.
- `POST /api/voice/transcribe`: Transcribes voice sample.
- `POST /api/sign-language/analyze`: Translates sign sequence into structured medical statements.
- `GET /api/sign-language/vocabulary`: Returns supported ASL healthcare vocabulary.
- `POST /api/sign-language/feedback`: Records user translation corrections.

### 4. Safety & Triage
- `POST /api/safety/check`: Scans symptoms for clinical red flags and returns triage classification.

### 5. Timeline & Longitudinal Records
- `GET /api/timeline`: Query timeline events filtered by `severity` and `modality`.

### 6. Doctor & Caregiver Handover
- `GET /api/doctor/summary/{assessment_id}`: Generates structured clinical handover summary.
- `POST /api/doctor/call`: Initiates call workflow via `CallService` (operates in Demo Call Mode).
- `GET /api/caregiver/dashboard`: Returns monitored patient status, active alerts, and contact links.
- `POST /api/caregiver/alert`: Triggers caregiver alert.

### 7. Privacy & Data Rights
- `GET /api/privacy/consent`: Retrieve user sensor and telemetry consent.
- `PUT /api/privacy/consent`: Update consent preferences (camera, audio, local-only mode).
- `DELETE /api/privacy/data`: Right to be Forgotten - permanently purges patient telemetry.
