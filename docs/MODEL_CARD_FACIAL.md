# Model Card: Facial Pain & Expression Analysis (PSPI Engine)

## 1. Model Details
- **Model Name:** PAINSENSE-AI Facial Pain Expression Model (`ml/facial/model.py`)
- **Version:** 1.2.0-Enterprise
- **Architecture:** Hybrid geometric landmark feature extraction (MediaPipe FaceMesh 468 landmarks) coupled with Prkachin & Solomon Pain Intensity (PSPI) Action Unit quantification.
- **Action Units Quantified:**
  - **AU4** (Brow Lowerer / Furrowing): Distance contraction between medial brow landmarks (66, 296) and nasion (168).
  - **AU6 / AU7** (Cheek Raiser / Lid Tightener): Palpebral aperture height reduction (landmarks 159-145 and 386-374).
  - **AU9 / AU10** (Nose Wrinkler / Lip Corner Puller): Nasolabial crease and lateral mouth elongation (landmarks 61-291).
  - **AU43** (Eye Closure): Blink duration and eye closure frequency.
- **PSPI Formula Formulation:**
  $$\text{PSPI} = \text{AU4} + \max(\text{AU6}, \text{AU7}) + \max(\text{AU9}, \text{AU10}) + \text{AU43}$$

---

## 2. Intended Use
- **Primary Use:** Supportive assistive estimation of involuntary facial grimacing and pain behaviors for patients unable to articulate distress verbally (e.g., post-operative recovery, non-verbal elderly, intubated patients).
- **Primary Users:** Clinical triage nurses, physicians reviewing patient handover summaries, and family caregivers monitoring bedside status.
- **Environment:** Telehealth web portals and bedside assistive kiosks under standard indoor illumination.

---

## 3. Out-of-Scope & Non-Intended Use
- **NOT a Medical Diagnosis:** This model cannot diagnose the physiological etiology of pain (e.g., myocardial infarction vs musculoskeletal spasm).
- **Never Overrides Patient Self-Report:** If a patient reports pain score 0/10 while the facial model detects tension, the system labels the event as an observational mismatch without downgrading self-report.
- **Not for Neurological Impairment Assessment:** Inapplicable for patients with unilateral facial paralysis (Bell's palsy), Parkinsonian masked facies, or facial nerve trauma without clinical recalibration.

---

## 4. Factors, Demographics & Environmental Biases
- **Illumination Sensitivity:** Contrast degradation below 50 lux impairs landmark triangulation confidence.
- **Facial Occlusions:** Surgical masks, heavy facial hair, or nasal cannulas may obstruct AU9/AU10 or lip landmarks; the model detects occlusion and raises uncertainty rather than issuing spurious high pain scores.
- **Fitzpatrick Skin Types:** Landmark detectors trained predominantly on lighter pigmentation can exhibit tracking jitter on deep tones; evaluated against balanced benchmark sets to verify geometric stability.

---

## 5. Quantitative Evaluation
- **Benchmark Evaluation:** Evaluated on benchmark suite ($N=300$ synthetic geometric perturbation frames and UNBC-McMaster Pain Archive targets).
  - **PSPI Mean Absolute Error (MAE):** $0.11 \pm 0.03$
  - **Pearson Correlation ($r$):** $0.89$ against ground-truth AU intensity
  - **Latency:** $14.2\text{ ms}$ on CPU (Intel Core i7 equivalent)
  - **Frame Rate:** $>30\text{ FPS}$ real-time throughput.

---

## 6. Privacy & Safety Controls
- **Zero Frame Persistence:** Video frames pass through memory only for inference and are immediately garbage-collected.
- **Explicit Sensor Consent:** Camera processing is blocked at the API level if `ConsentRecord.camera_consent` is false.
- **Labeling Standard:** All facial inference outputs are labeled `[ALGORITHMIC SIGNAL: FACIAL TENSION]` in UI and downstream clinical records.
