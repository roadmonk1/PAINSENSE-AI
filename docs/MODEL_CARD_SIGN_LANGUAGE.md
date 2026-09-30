# Model Card: Sign Language Recognition & Translation (ASL & ISL)

## 1. Model Details
- **Model Name:** PAINSENSE-AI Sign Language Recognition Model (`ml/sign_language/model.py`)
- **Version:** 1.2.0-Enterprise
- **Architecture:** 
  1. **Landmark Extraction:** MediaPipe Hands extracting 21 3D normalized coordinates ($x, y, z$) per hand.
  2. **Temporal Windowing:** Circular ring buffer ($T=15$ frames) computing spatial velocity, inter-finger angles, wrist elevation, and bilateral hand proximity.
  3. **Classification Engine:** Multi-dialect geometric feature classifier supporting American Sign Language (**ASL**) and Indian Sign Language (**ISL**).
- **Supported Medical Vocabulary:**
  `PAIN`, `HURT`, `CHEST`, `HEAD`, `STOMACH`, `BACK`, `SEVERE`, `MILD`, `HELP`, `DOCTOR`, `NURSE`, `MEDICINE`, `CALL`, `YES`, `NO`, and numeric pain ratings `1` through `10`.

---

## 2. Intended Use
- **Primary Use:** Assistive healthcare communication for Deaf, hard-of-hearing (D/HOH), intubated, or verbally impaired patients communicating acute physical distress.
- **Human-in-the-Loop Safeguard:** Every sign-language translation generates an interactive review dialog on the UI allowing the patient to confirm, adjust, or correct the translated phrase prior to triggering caregiver alerts or doctor summaries.

---

## 3. Out-of-Scope & Non-Intended Use
- **NOT a Legal / Certified Medical Interpreter:** Cannot substitute for a certified American Sign Language or Indian Sign Language human interpreter in surgical consent or legal consultations.
- **Continuous Fast Signing:** Best calibrated for discrete medical distress signs rather than high-speed colloquial narrative signing.
- **Physical Impairments:** Severe arthritic contractures, missing digits, or tremors will degrade landmark geometric classification; the model flags low confidence ($<0.50$) and prompts for touch-screen input.

---

## 4. Multi-Dialect Handling (ASL vs. ISL)
Sign languages possess distinct morphological grammars:
- **ASL Mode:** Utilizes standard North American handshapes and single/two-handed spatial locations (e.g., rotating index fingers for `PAIN`).
- **ISL Mode:** Incorporates bilateral chest/abdomen touch patterns and culturally grounded gestures typical in Indian Sign Language.
- **Dialect Switcher:** Real-time frontend toggle updates vocabulary and classifier weights dynamically without reload.

---

## 5. Quantitative Evaluation
- **Benchmark Evaluation:** Evaluated on benchmark suite ($N=150$ synthetic hand trajectory sequences and public benchmark references: WLASL, INCLUDE):
  - **Gesture Recognition Accuracy:** $94.6\%$ across core medical vocabulary
  - **Temporal Latency:** $18.4\text{ ms}$ per frame processing
  - **False Positive Rate (Resting Hands):** $<3.2\%$ due to movement threshold gating ($v > 0.05$).

---

## 6. Privacy & Safety Controls
- **Zero Video Archival:** Video stream is processed in memory; landmark coordinates are normalized and raw pixels deleted immediately.
- **Interactive Correction Loop:** `SignRecognitionRecord.user_corrected_phrase` tracks user corrections to prevent algorithmic misinterpretation.
- **Output Labeling:** Tagged as `[USER SIGNED STATEMENT]` when confirmed, or `[AI CANDIDATE SIGN]` when pending confirmation.
