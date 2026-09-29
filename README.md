# PAINSENSE-AI

### Multimodal Pain Detection, Sign-Language Communication & Healthcare Assistance System

[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)]()
[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)]()
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)]()
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)]()
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg)]()
[![Tests](https://img.shields.io/badge/Tests-13%20Passed-success.svg)]()

> **Making pain easier to communicate.**
>
> An accessibility-first multimodal AI system designed to help individuals communicate possible pain through multiple sensory and linguistic channels: camera facial/posture indicators, voice acoustic strain, speech transcription, sign-language recognition, and direct self-reports.

---

## 1. Problem Statement & Motivation

Pain is subjective, personal, and complex. In traditional healthcare and emergency settings:
- Non-verbal patients, individuals who are Deaf or hard of hearing, stroke survivors, and critically ill patients often struggle to communicate acute discomfort.
- Primitive "facial expression classifiers" frequently fail because they misinterpret stoicism, paralysis, or non-expressive faces as absence of pain, silencing vulnerable patients.
- Single-channel technologies are fragile: poor lighting breaks cameras, noisy rooms break microphones, and non-verbal barriers break verbal surveys.

**PAINSENSE-AI addresses this with the philosophy:**
$$\text{SEE} \longrightarrow \text{HEAR} \longrightarrow \text{UNDERSTAND} \longrightarrow \text{COMMUNICATE} \longrightarrow \text{ASSIST}$$

### The Core Differentiator: Prioritizing the Patient's Voice
PAINSENSE-AI's Multimodal Fusion Engine operates under a non-negotiable rule: **A passive AI model reading "low tension" is NEVER permitted to override an explicit patient report of pain.** The system tracks divergence uncertainty and preserves the patient's ground truth report.

---

## 2. Key Features

- **Multimodal Fusion Engine**: Fuses optical action units, somatic guarding, vocal strain, speech transcription, sign language, and self-reports into a unified triage assessment with uncertainty metrics.
- **Sign Language Communication**: Focused healthcare distress ASL vocabulary (`pain`, `chest`, `severe`, `help`, `doctor`, etc.) with sequence assembly (`[pain] + [chest] + [severe]` &rarr; *"Severe chest pain"*) and user correction feedback loops.
- **Two-Way Accessible UX**: Communicates back using Web Speech API Text-to-Speech (TTS), high contrast visual alerts, and large accessible buttons.
- **Optical & Posture Telemetry**: Analyzes Action Units based on the clinical Prkachin and Solomon Pain Intensity (PSPI) metric (AU4 brow furrowing, AU6/7 orbital tightening, AU25 mouth tension) and torso guarding.
- **Voice & Acoustic Analysis**: Transcribes natural complaint narratives while estimating fundamental frequency perturbation (pitch jitter) and vocal strain.
- **Longitudinal Pain Timeline**: Interactive timeline tracking symptom evolution with filtering by severity, modality, and date.
- **Physician Handover Console**: Converts multimodal telemetry into concise clinical summaries separating patient subjective statements from objective AI observations.
- **Replaceable Calling Desk**: Seamless telephony workflow with deterministic **Demo Call Mode** for offline demonstration without billable telephony charges.
- **Caregiver Portal**: Monitored patient status cards, automated alerts feed, and emergency dispatch links.
- **Privacy & Consent Sovereignty**: Local-only processing toggles and one-click data deletion (Right to Be Forgotten).

---

## 3. Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons, React Router v7, Web Speech API, Web Audio API, Web Camera MediaDevices.
- **Backend**: Python 3.11, FastAPI, Pydantic v2, SQLAlchemy ORM, SQLite / PostgreSQL.
- **Machine Learning**: Scikit-Learn, NumPy, MediaPipe landmark geometry models, PSPI Action Unit formulations.
- **Testing**: Pytest, FastAPI TestClient, Vite Production Builder.

---

## 4. Project Structure

```
PAINSENSE-AI/
├── frontend/                     # React + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/           # Navbar, Footer
│   │   ├── pages/                # Landing, Dashboard, Assess, Camera, Voice, Sign, Timeline, Doctor, Caregiver, Settings, Limitations
│   │   ├── services/api.js       # Unified REST API client
│   │   ├── utils/speech.js       # Accessible Text-to-Speech engine
│   │   ├── App.jsx               # Application routing and accessibility theme state
│   │   └── index.css             # Tailwind v4 and high-contrast styles
│   └── package.json
├── backend/                      # FastAPI Python Application
│   ├── app/
│   │   ├── api/                  # Auth, Assessment, Camera, Voice, Sign, Fusion, Timeline, Doctor, Caregiver, Safety, Privacy
│   │   ├── auth/                 # PBKDF2 hashing, JWT tokens, RBAC dependencies
│   │   ├── models/entities.py    # SQLAlchemy database schema
│   │   ├── schemas/schemas.py    # Pydantic v2 schemas
│   │   ├── services/             # FusionService, SafetyService, SignLanguageService, CameraService, VoiceService, CallService, DoctorService
│   │   ├── config.py             # App settings and environment variables
│   │   ├── database.py           # Engine and DB session provider
│   │   └── main.py               # Application entrypoint & demo data seeder
│   ├── tests/                    # Automated pytest suite (13 passing tests)
│   └── requirements.txt
├── ml/                           # ML Research & Evaluation
│   ├── facial/action_units.py    # PSPI Action Unit metrics
│   ├── voice/acoustic_features.py# Jitter and vocal strain extractor
│   ├── sign_language/sequence_model.py # Hand landmark geometry and sequence assembler
│   └── evaluation/               # Multimodal benchmark scripts and outputs
├── docs/                         # Comprehensive Documentation
│   ├── ARCHITECTURE.md           # System design & architecture diagram
│   ├── ML_PIPELINE.md            # Benchmark evaluation results & PSPI formulas
│   ├── SIGN_LANGUAGE.md          # ASL vocabulary & two-way feedback
│   ├── API.md                    # REST endpoint reference
│   ├── SAFETY.md                 # Red flag protocol & triage guidelines
│   ├── DEPLOYMENT.md             # Vercel & Render deployment guides
│   └── DEMO.md                   # 5-minute evaluation walkthrough
├── .gitignore
├── .env.example
└── README.md
```

---

## 5. Quickstart & Installation

### Prerequisites
- Node.js $\ge$ 18.0.0
- Python $\ge$ 3.10

### 1. Clone & Configure
```bash
git clone https://github.com/your-username/PAINSENSE-AI.git
cd PAINSENSE-AI
cp .env.example .env
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

Run tests to verify backend health:
```bash
python -m pytest tests/
```

Start backend development server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
API Documentation will be live at `http://localhost:8000/docs`.

### 3. Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 6. Pre-Seeded Demo Accounts

The application automatically seeds realistic clinical profiles upon first launch:

| Role | Account Email | Password | Access Highlights |
| :--- | :--- | :--- | :--- |
| **Patient** | `patient@painsense.ai` | `patient123` | Full multimodal assessment, sign language, history |
| **Caregiver** | `caregiver@painsense.ai` | `caregiver123` | Monitored patient alerts, check-in logger |
| **Doctor** | `doctor@painsense.ai` | `doctor123` | Clinical handover documents, demo call console |

---

## 7. Machine Learning Benchmark

Multimodal evaluation comparing unimodal accuracy versus multimodal fusion across 250 evaluation samples:

```
================================================================================
Channel Modality         | Accuracy   | Precision  | Recall     | F1-Score  
--------------------------------------------------------------------------------
Camera Only              | 0.6480     | 0.6530     | 0.6480     | 0.6474    
Voice Only               | 0.7200     | 0.7252     | 0.7200     | 0.7205    
Sign Only                | 0.8160     | 0.8181     | 0.8160     | 0.8158    
Self Report Only         | 0.9160     | 0.9165     | 0.9160     | 0.9159    
Multimodal Fusion        | 0.9280     | 0.9290     | 0.9280     | 0.9277    
================================================================================
```
To reproduce benchmarks:
```bash
python ml/evaluation/benchmark_multimodal.py
```

---

## 8. Clinical Safety & Legal Disclaimer

> [!IMPORTANT]
> **PAINSENSE-AI is NOT a Diagnostic Medical Device.**
>
> The software identifies observable indicators and reported symptoms to facilitate communication between patients, caregivers, and medical providers. The system does not diagnose medical conditions. A qualified human healthcare professional must evaluate, diagnose, and treat medical conditions. In case of life-threatening emergencies, dial local emergency services (911 / 112) immediately.

---

## 9. License

This project is licensed under the MIT License - see the LICENSE file for details.
