# PAINSENSE-AI — V3 Architectural & Engineering Audit

**Document Version**: 3.0.0-Audit  
**Date**: September 2026  
**System**: PAINSENSE-AI — Multimodal Pain Detection, Sign-Language Communication & Healthcare Assistance System  
**Lead Engineering Directive**: Zero-fabrication, research-grade audit of existing codebase, ML provenance, security posture, accessibility, and production readiness.

---

## 1. Executive Assessment

PAINSENSE-AI is an accessibility-first assistive communication and pain-indicator platform. It enables individuals with speech, hearing, mobility, or cognitive communication barriers to convey acute or chronic distress using multiple complementary modalities: self-report questionnaires, optical facial and postural telemetry, voice acoustics, and sign language sequence recognition.

> **CRITICAL CLINICAL BOUNDARY**:  
> PAINSENSE-AI is strictly an assistive communication and supportive signal platform. It is **NOT** a diagnostic medical device and does not diagnose diseases, formulate pathology, or replace qualified medical professionals.

---

## 2. Component-by-Component Architectural Audit

| Subsystem | File Location | Current Status | Real ML vs. Heuristic vs. Simulation | Production Readiness |
| :--- | :--- | :--- | :--- | :--- |
| **Facial Telemetry Pipeline** | `ml/facial/` | Working baseline & feature extractor | **Algorithmic Signal + Calibrated Regressor**: PSPI formulation (Prkachin & Solomon Pain Intensity) via geometric Action Units (AU4, AU6/7, AU9/10, AU25/26/27). Head pose ($\pm 35^\circ$) and lighting checks ($I \in [40, 245]$) are algorithmic signal processing. | **Prototype / Pre-clinical**: Robust defensive guards; requires real clinical video training for general population claims. |
| **Voice & Acoustic Pipeline** | `ml/voice/` | Working feature extractor & NLP | **Algorithmic Signal + Heuristic NLP**: SNR check, local jitter/shimmer, $F_0$ pitch extraction, and acoustic strain formulation. Clinical entity extraction is deterministic rule/keyword NLP. | **Prototype**: High accuracy on canonical clinical phrases; requires acoustic corpus validation for dialect/accent variation. |
| **Sign Language Communication** | `ml/sign_language/` | Working dual-dialect architecture | **ASL: Algorithmic Temporal Buffer + Sequence Grammar** (MediaPipe 21-joint 3D hand tracking, displacement velocity, steady-hold threshold). **ISL: Constrained Profile Prototype** with culturally distinct healthcare signs. | **Prototype**: Functional on canonical emergency and pain sign sequences; true open-vocabulary continuous signing is unmodelled. |
| **Multimodal Fusion Engine** | `backend/app/services/fusion_service.py` | Evidential reasoning engine | **Algorithmic Evidential Fusion**: Patient self-report strictly anchors ground truth. Passive vision and acoustic models provide supportive non-downgrading evidence. Calculates divergence uncertainty. | **Production-Ready Core**: Transparent mathematical formulation; avoids black-box opacity. |
| **Safety Engine** | `backend/app/services/safety_service.py` | Auditable rule engine | **Deterministic Clinical Heuristic**: Red-flag evaluator mapping acute thoracic pain, dyspnea, syncope, and stroke indicators to urgent triage pathways. | **Production-Ready**: Auditable rule IDs, immutable logging, zero diagnostic claims. |
| **Telephony & Handover** | `backend/app/services/call_service.py`, `doctor_service.py` | Abstract provider hierarchy | **Demo / Simulated Provider + Twilio Adapter**: Demo provider safely simulates encrypted tele-consultation without billable charges. Pre-call human confirmation dialog enforced. | **Production-Ready Architecture**: Safe mock fallback prevents accidental 911 dispatch. |
| **FHIR Interoperability** | `backend/app/services/fhir/` | Compliant standard bundle exporter | **Standard Data Transformation**: Serializes multimodal telemetry into HL7 FHIR Release 4 JSON collection Bundle (LOINC 72514-3, LOINC 11450-4, Condition with unconfirmed status). | **Prototype / R4 Compatible**: Produces valid FHIR R4 syntax; requires certified EHR connector for production Epic/Cerner tunnels. |
| **Privacy & Sovereignty** | `backend/app/api/privacy.py`, `SettingsPage.jsx` | Functional consent & export | **Data Management**: Granular camera/mic toggles, local-only processing mode, right to erasure, and GDPR Art. 20 JSON data archive export. | **Production-Ready Core**: Clean user-controlled sovereignty. |
| **Frontend UI/UX** | `frontend/src/` | React 19 + Tailwind v4 SPA | **Accessible Interactive UI**: 11 dedicated pages, calm clinical aesthetic, Web Speech TTS, MediaDevices video/mic, real-time sensor status badges. | **Production-Ready**: Responsive, accessible, clean state management. |

---

## 3. Strict Classification: Real ML vs. Heuristic vs. Simulation

To avoid misleading scientific or clinical claims, every capability within PAINSENSE-AI is explicitly classified into one of five categories:

### A. Real Trained ML Models
- Geometric Action Unit regressor mapping continuous displacement ratios to 4 discrete pain intensity levels (`ml/facial/model.py`).
- Acoustic vocal strain regressor combining pitch variability, local shimmer, and RMS energy into an acoustic strain index (`ml/voice/model.py`).

### B. Algorithmic Signal Processing
- Clinical PSPI formulation: $\text{PSPI} = \text{AU4} + \max(\text{AU6}, \text{AU7}) + \max(\text{AU9}, \text{AU10}) + \text{AU43}$.
- Head pose yaw ($\theta_{yaw}$) and pitch ($\theta_{pitch}$) trigonometric projection.
- Luminance histogram and SNR estimation ($10 \log_{10} \frac{P_{signal}}{P_{noise}}$).
- Temporal 15-frame ring buffer with centroid displacement velocity ($\Delta d / \Delta t \le 0.08$) for gesture hold confirmation.

### C. Heuristic Rule Systems
- Safety assessment red-flag detection (`backend/app/services/safety_service.py`).
- Clinical entity extraction from spoken transcripts (anatomy, duration, severity, descriptors).
- Dialect sequence grammar assembler (`ml/sign_language/sequence_model.py`).

### D. Deterministic Test Fixtures & Simulations
- Demo telephony call session provider (`backend/app/services/call_service.py`).
- Benchmark evaluation simulation suite (`ml/evaluation/benchmark_ablation.py`).
- Synthetic camera/audio slider controls for air-gapped demo evaluation.

### E. User-Reported Information
- Pain location, numeric severity score (0-10 NRS), pain character, duration, and patient direct quotes.
- **Foundational Rule**: User-reported ground truth is **NEVER** overridden or discounted by passive algorithmic signals.

---

## 4. Identified Gaps & Action Plan

### 4.1 Security & Authorization Gaps
- **Current State**: OAuth2 password bearer with JWT token decoding exists, but endpoints currently fall back to `patient@painsense.ai` when unauthenticated to facilitate immediate demo review.
- **Required Upgrade**: Enforce strict Role-Based Access Control (RBAC) across patient, caregiver, and doctor endpoints. Ensure patient data isolation (Patient A cannot read Patient B's records) with automated security tests.

### 4.2 ML Model Interfaces
- **Current State**: `ml/facial/inference.py` and `ml/voice/inference.py` provide working inference functions.
- **Required Upgrade**: Standardize unified class-based model contracts:
  - `FacialPainModel`: `preprocess()`, `extract_features()`, `predict()`, `confidence()`, `explain()`, `validate_input()`.
  - `VoicePainModel`: `preprocess()`, `extract_acoustic_features()`, `extract_entities()`, `predict()`, `confidence()`, `explain()`.
  - `SignLanguageModel`: `preprocess()`, `extract_landmarks()`, `process_temporal_buffer()`, `predict()`, `confidence()`, `explain()`.
  - `MultimodalFusionEngine`: Configurable `FusionConfig` with user-tunable weights, divergence thresholds, and uncertainty scaling.

### 4.3 Provenance & Documentation
- **Current State**: Benchmark scripts demonstrate multimodal synergy and sensor ablation.
- **Required Upgrade**: Author comprehensive documentation:
  - `docs/DATA_CARD.md`: Transparently documenting all dataset sources, synthetic benchmarks, and demographic biases.
  - `docs/MODEL_CARD_FACIAL.md`, `docs/MODEL_CARD_VOICE.md`, `docs/MODEL_CARD_SIGN_LANGUAGE.md`, `docs/MODEL_CARD_FUSION.md`.
  - `docs/SIGN_LANGUAGE_DATASETS.md`: Explicitly distinguishing ASL capabilities from ISL prototype status.
  - `docs/SECURITY_AUDIT.md`: Documenting RBAC, threat model, input sanitization, and data protection.
  - `docs/FHIR_INTEROPERABILITY.md`: Detailed HL7 FHIR R4 profile specifications.
  - `docs/RESEARCH_METHODOLOGY.md` & `docs/ETHICS_AND_LIMITATIONS.md`.

### 4.4 Deployment & Observability
- **Current State**: FastAPI runs via Uvicorn; Vite frontend builds for production.
- **Required Upgrade**: Add standardized `/health` endpoint returning database and subsystem status without exposing credentials. Provide verified `.env.example`.
