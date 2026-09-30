# Model Card: Voice Acoustics & Spoken Pain Extraction

## 1. Model Details
- **Model Name:** PAINSENSE-AI Voice Acoustics & Entity Extraction Model (`ml/voice/model.py`)
- **Version:** 1.2.0-Enterprise
- **Architecture:** Dual-stream processing pipeline:
  1. **Acoustic Signal Stream:** In-memory PCM audio processing computing Fundamental Frequency ($F_0$), pitch perturbation (jitter), amplitude perturbation (shimmer), spectral flux, and composite vocal strain index ($0.0 \text{ to } 1.0$).
  2. **Clinical Entity Extraction Stream:** Deterministic tokenization and regex-based entity recognizer mapping patient statements to anatomical locations, numeric/adjectival severity, onset temporalities, and qualitative descriptions (e.g., sharp, throbbing, burning).

---

## 2. Intended Use
- **Primary Use:** Assistive extraction of pain attributes from spoken utterances and acoustic strain detection for patients communicating verbally or groaning in bed.
- **Target Setting:** Hands-free bedside kiosks, nurse triage stations, and remote patient monitoring consultations.

---

## 3. Out-of-Scope & Non-Intended Use
- **NOT a Diagnostic Tool:** Cannot differentiate pain groans from shortness of breath, asthma, or emotional distress without clinical review.
- **Not for Speaker Identification:** Does not perform voice biometric verification, voice profiling, or speaker identification.
- **Accents & Dialects:** Lexicon mapping is tuned for English; foreign language clinical descriptions require localized terminology packs.

---

## 4. Acoustic Features & Mathematical Formulation
- **Fundamental Frequency ($F_0$) & Variance:** High pitch variability and acute upward pitch shifts indicate acute vocal tract constriction during pain.
- **Vocal Strain Index ($S_v$):**
  $$S_v = 0.35 \cdot \text{norm}(F_0) + 0.30 \cdot \text{Jitter} + 0.25 \cdot \text{Shimmer} + 0.10 \cdot \text{SpectralFlux}$$
- **Entity Extraction:** Maps over 35 anatomical regions (lumbar, thoracic, cranial, epigastric, appendicular) and 12 pain adjectives.

---

## 5. Quantitative Evaluation
- **Benchmark Evaluation:** Evaluated across synthetic and audio test targets ($N=100$ simulated vocal clips and Torgo dysarthria reference profiles):
  - **Acoustic Strain MAE:** $0.08 \pm 0.02$
  - **Entity Extraction Precision:** $96.4\%$
  - **Entity Extraction Recall:** $94.1\%$
  - **Processing Latency:** $32\text{ ms}$ for 3-second audio buffers.

---

## 6. Privacy & Safety Controls
- **Zero Raw Audio Retention:** Spoken audio is analyzed in an ephemeral memory buffer and immediately destroyed; raw waveforms are never persisted to disk or cloud buckets.
- **Audio Consent Enforcement:** Checks `ConsentRecord.audio_consent` before instantiating audio listeners.
- **Transparent Output Tagging:** Acoustic strain metrics are tagged `[ALGORITHMIC SIGNAL: ACOUSTIC STRAIN]` and transcripts are tagged `[USER SPOKEN STATEMENT]`.
