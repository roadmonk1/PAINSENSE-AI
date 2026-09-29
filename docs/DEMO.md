# PAINSENSE-AI Demo Mode & Evaluation Guide

## 1. Zero External API Dependency Guarantee

PAINSENSE-AI includes a comprehensive, deterministic **Demo Mode** that functions completely out of the box without requiring external paid telephony keys, cloud speech credits, or special GPU servers.

## 2. Pre-Seeded Clinical Profiles

When the backend initializes, it automatically seeds realistic demo data:

| User Account | Email | Password | Role | Phone / Note |
| :--- | :--- | :--- | :--- | :--- |
| **Alex Morgan** | `patient@painsense.ai` | `patient123` | Patient | Monitored patient with pain timeline history |
| **Elena Morgan** | `caregiver@painsense.ai` | `caregiver123` | Caregiver | Authorized family caregiver receiving alerts |
| **Dr. Marcus Vance, MD** | `doctor@painsense.ai` | `doctor123` | Doctor | Attending primary physician receiving handovers |

## 3. Recommended 5-Minute Walkthrough

1. **Landing Page (`/`)**:
   - Observe core philosophy: `SEE -> HEAR -> UNDERSTAND -> COMMUNICATE -> ASSIST`.
2. **Dashboard (`/dashboard`)**:
   - Inspect active assessment summary, caregiver link, and longitudinal timeline preview.
3. **Assess Pain Hub (`/assess`)**:
   - Step 1: Adjust pain location to "Chest" and severity slider to "8 / 10".
   - Step 2: Toggle optical telemetry and observe action units.
   - Step 3: Click **Run Multimodal Fusion**.
   - Observe how the engine preserves the high severity report while computing divergence uncertainty.
4. **Sign Language (`/sign-language`)**:
   - Click preset `[Pain] + [Chest] + [Severe]`.
   - Observe natural language translation: *"Severe chest pain"*.
   - Listen to two-way speech synthesis response.
5. **Doctor Assistance (`/doctor`)**:
   - View clinical handover summary separating subjective patient statements from objective AI observations.
   - Click **Consult Doctor** to launch the Demo Call Mode telemetry dialog.
6. **Caregiver Portal (`/caregiver`)**:
   - Review automated caregiver alert feed and dispatch quick check-in notes.
