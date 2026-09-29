# PAINSENSE-AI Architecture & System Design

## 1. Architectural Overview

PAINSENSE-AI is an accessibility-first multimodal AI platform designed to empower individuals with diverse communication abilities to express physical pain and rapidly access clinical and caregiver assistance.

```
                    ┌─────────────────────────────────────────────────────┐
                    │                  INPUT MODALITIES                   │
                    ├─────────────────┬─────────────────┬─────────────────┤
                    │  Webcam Optical │ Microphone Audio│ Patient Self-   │
                    │   & Gesture     │  & Speech Text  │ Report (Gold)   │
                    └────────┬────────┴────────┬────────┴────────┬────────┘
                             │                 │                 │
                             ▼                 ▼                 ▼
                    ┌─────────────────┐┌────────────────┐┌────────────────┐
                    │ Facial Action   ││ NLP Symptom    ││ Visual Body    │
                    │ Units (AU4/AU7) ││ Extractor &    ││ Map & 0-10     │
                    │ & ASL Hand Mesh ││ Acoustic Strain││ Pain Scale     │
                    └────────┬────────┘└───────┬────────┘└───────┬────────┘
                             │                 │                 │
                             └─────────────────┼─────────────────┘
                                               │
                                               ▼
                              ┌───────────────────────────────────┐
                              │     MULTIMODAL FUSION ENGINE      │
                              │ - Prioritizes Patient Report (70%)│
                              │ - Supportive Telemetry (30%)      │
                              │ - Divergence Uncertainty Metric   │
                              └────────────────┬──────────────────┘
                                               │
                     ┌─────────────────────────┼─────────────────────────┐
                     ▼                         ▼                         ▼
         ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
         │     SAFETY TRIAGE     │ │  TWO-WAY ACCESSIBLE   │ │    DOCTOR & EHR       │
         │ - Red Flag Detection  │ │       RESPONSE        │ │       HANDOVER        │
         │ - Triage Classification│ │ - Text-to-Speech      │ │ - Structured Clinical │
         │ - Caregiver Dispatch  │ │ - High Contrast UI    │ │   Handover Summary    │
         │ - Emergency Escalation│ │ - ASL Confirmation    │ │ - Demo Call Telemetry │
         └───────────────────────┘ └───────────────────────┘ └───────────────────────┘
```

## 2. Core Modules

### 2.1 Frontend Architecture (React 19 + Vite + Tailwind CSS)
- **Accessible State Management**: Built-in High Contrast toggle manipulating CSS custom properties, keyboard ARIA attributes, and Web Speech API synthesis for non-verbal two-way confirmation.
- **Client-Side Telemetry Processing**: Local browser MediaDevices APIs for optical frame rendering and Web Audio API FFT analysis, preserving privacy through local-first processing.
- **Role Scoping**: Instant context switching between Patient, Caregiver, and Physician views.

### 2.2 Backend Architecture (FastAPI + Pydantic v2 + SQLAlchemy)
- **FastAPI Core**: Asynchronous REST endpoints with Pydantic v2 validation and lifespan event management.
- **Database Engine**: SQLAlchemy ORM compatible with SQLite (zero external dependency for local dev/demo) and PostgreSQL (for production deployments).
- **Security & RBAC**: PBKDF2 HMAC SHA-256 password encryption and JWT authorization.

### 2.3 Modular ML Engine
- **Facial Action Unit Service**: Implements the Prkachin and Solomon Pain Intensity (PSPI) metric combining AU4 (brow furrower), AU6/AU7 (orbital tightener), and AU25-27 (mouth tension).
- **Acoustic Strain Service**: Calculates fundamental frequency perturbation (pitch jitter) and shimmer to detect vocal strain during speech.
- **Sign Language Pipeline**: Temporal token assembler mapping ASL distress gestures into natural language medical statements with user correction feedback loops.
- **Multimodal Fusion Engine**: Synthesizes inputs into a single confidence/uncertainty profile, explicitly guaranteeing that passive vision models cannot override explicit patient self-reports.
