# PAINSENSE-AI: Comprehensive Dataset & Benchmark Data Card

**Document Version**: 3.0.0-DataCard  
**Date**: September 2026  
**System**: PAINSENSE-AI — Multimodal Pain Detection, Sign-Language Communication & Healthcare Assistance System  
**Mandate**: Scientific transparency, provenance tracking, and zero-fabrication clinical data disclosure.

---

## 1. Overview & Provenance Classification

In strict adherence to medical research ethics and machine learning transparency guidelines, all data artifacts, benchmarks, and model training sources used across PAINSENSE-AI are classified below.

> [!IMPORTANT]
> **NO CLINICAL TRIAL CLAIM**: PAINSENSE-AI evaluation metrics and ablation benchmarks are generated from **controlled synthetic clinical test fixtures and algorithmic signal simulations**. They must **NOT** be interpreted as clinical trial accuracy on hospitalized patients.

| Dataset / Evaluation Asset | Modalities | Asset Type | Sample Size | Primary Role | Provenance & Source |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Multimodal Ablation Benchmark** | Self-report, Vision (AU), Voice (Acoustic), Sign (Token) | **Controlled Synthetic Test Fixture** | $N = 300$ simulated clinical scenarios | Sensor dropout & cross-modal synergy evaluation | Synthesized from clinical sensor physics ($0-10$ continuous scale with Gaussian sensor noise models; $\sigma_{vision}=1.45$, $\sigma_{voice}=1.25$, $\sigma_{sign}=0.65$, $\sigma_{report}=0.45$). |
| **Facial AU Canonical Fixtures** | Facial geometry (Action Units) | **Deterministic Evaluation Suite** | $N = 4$ canonical clinical edge cases | Regression and threshold regression testing | Hand-calibrated facial landmark ratios matching FACS (Facial Action Coding System) literature for acute pain, subtle discomfort, neutral resting, and low-light edge cases. |
| **Voice Acoustic Fixtures** | Audio descriptors, transcript text | **Deterministic Evaluation Suite** | $N = 2$ canonical clinical edge cases | Speech NLP & acoustic strain validation | Clinically curated transcripts covering acute thoracic pain and mild lumbar discomfort with simulated pitch jitter and shimmer. |
| **Sign Language Dictionaries** | 21-joint 3D hand coordinates, token sequences | **Structured Domain Dictionary** | 24 core healthcare concepts (ASL & ISL) | Symbolic sequence assembly & bidirectional translation | Curated medical distress vocabularies based on published American Sign Language (ASL) and Indian Sign Language (ISL) dictionaries. |
| **Seeded Database Patients** | User profiles, assessments, timeline events | **Synthetic Demonstration Fixtures** | 3 users (Alex Morgan, Elena Morgan, Dr. Marcus Vance), 3 timeline assessments | Local development, interactive UI demo, and testing | Seeded programmatically on startup in `backend/app/main.py`. |

---

## 2. Public Research Datasets (Target Specifications for Clinical Training)

For institutions transitioning PAINSENSE-AI from prototype to full-scale clinical deployment, the following public research datasets represent the intended external training targets:

### 2.1 Facial Pain Expression: UNBC-McMaster Shoulder Pain Archive
- **Institution**: University of Northern British Columbia & McMaster University
- **Subjects**: 129 participants experiencing active and passive movement of affected shoulders.
- **Labels**: Frame-by-frame FACS Action Units (AU4, AU6, AU7, AU9, AU10, AU12, AU20, AU25, AU26, AU27, AU43) and continuous OPI (Observer Pain Intensity) / PSPI scores.
- **Subject-Level Split**: Cross-subject 5-fold cross-validation (models must never train and test on the same individual).
- **Known Biases**: Adult orthopedic population only; limited racial diversity; controlled laboratory camera lighting; does not represent pediatric or intensive care populations.

### 2.2 Voice & Vocal Strain: Torgo & MAVO (Multimodal Audio-Visual Pain)
- **Modality**: High-fidelity acoustic recordings of speech under acute/chronic pain.
- **Features**: Fundamental frequency perturbation ($F_0$ jitter), amplitude perturbation (shimmer), harmonics-to-noise ratio (HNR), and pause duration.
- **Subject-Level Split**: Patient-isolated partitioning to prevent speaker recognition leakage.
- **Known Biases**: Dialect and accent variance; high acoustic sensitivity to ambient microphone hardware and room reverberation.

### 2.3 Sign Language: WLASL (World Level American Sign Language) & INCLUDE (Indian Sign Language)
- **WLASL**: 2,000 ASL words signed by over 100 signers across YouTube videos.
- **INCLUDE**: Over 4,000 ISL signs across 260+ categories recorded by native deaf signers.
- **Limitations**: High variance in signer distance, resolution, background clutter, and camera frame rate.

---

## 3. Synthetic Benchmark Generation Methodology

### 3.1 Ablation Study Dataset (`ml/evaluation/benchmark_ablation.py`)
- **Sample Generation**: $N = 300$ continuous ground truth clinical distress scores uniformly distributed $Y^* \in [0.0, 10.0]$.
- **Emergency Ground Truth**: $Y^* \ge 7.5$ classified as true emergency.
- **Sensor Noise Injection**:
  - Direct Patient Self-Report: $S_{report} = \text{clip}(Y^* + \mathcal{N}(0, 0.45^2), 0, 10)$
  - Voice Acoustic Strain: $S_{voice} = \text{clip}(Y^* + \mathcal{N}(0, 1.25^2), 0, 10)$
  - Facial Action Unit Regressor: $S_{vision} = \text{clip}(Y^* + \mathcal{N}(0, 1.45^2), 0, 10)$
  - Sign Language Token Evidence: $S_{sign} = \text{clip}(Y^* + \mathcal{N}(0, 0.65^2), 0, 10)$
- **Evaluation Metrics**:
  - Mean Absolute Error (MAE)
  - Pearson Correlation Coefficient ($r$)
  - Macro-averaged F1 Score across discrete triage categories (none, mild, moderate, severe)
  - Emergency Recall ($\text{Recall} = \frac{\text{TP}}{\text{TP} + \text{FN}}$ at triage threshold $\ge 6.5$)
  - Mean Uncertainty Score

---

## 4. Known Biases & Research Limitations

1. **Stoicism & Non-Expressive Faces**:
   Certain cultural groups, neurodivergent individuals, or patients with peripheral facial paralysis (e.g. Bell's palsy, stroke) exhibit minimal or atypical facial deformation during severe pain. A model relying exclusively on vision would register false negatives.
2. **Acoustic Background Noise**:
   Emergency departments and ambulatory vehicles frequently exceed $70\text{ dB}$ SPL of ambient background noise. Voice pitch jitter measurements degrade unless pre-filtered with an adaptive Wiener filter or SNR gating.
3. **Sign Language Grammatical Variance**:
   ASL and ISL have completely independent historical and syntactic foundations. ASL uses Topic-Comment syntax and spatial references, while ISL often follows Subject-Object-Verb (SOV) structure. A token-based pipeline cannot capture subtle grammatical non-manual facial markers without specialized temporal 3D models.
4. **Data Leakage Prevention**:
   Random sample-level splitting on video frames causes severe optimistic bias (temporal leakage). All future empirical training pipelines in PAINSENSE-AI mandate **strict subject-level disjoint splits**.
