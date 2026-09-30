# PAINSENSE-AI: Robustness, Sensor Failures & Environmental Edge Cases

## 1. Overview
Real-world clinical and domestic environments present non-ideal sensing conditions: dim lighting, head rotation away from camera, loud background ambient noise, partial hand occlusion during signing, or complete channel dropout. PAINSENSE-AI incorporates strict defensive guards across all modalities.

---

## 2. Modality-Specific Safeguards

### 2.1 Facial Vision Channel (`ml/facial/preprocessing.py`)
- **Extreme Lighting Rejection**:
  - Validates frame mean luminance ($I_{mean} \in [40, 245]$).
  - Flags `"underexposed"` (dim lighting) or `"overexposed"` (glare) warnings.
  - Dampens vision confidence by $50\%$ under poor lighting, deferring priority to voice/sign channels.
- **Head Pose Limits**:
  - Calculates yaw ($\theta_{yaw}$) and pitch ($\theta_{pitch}$) angles using geometric nose-to-temple vector projections.
  - Operational bounds: $|\theta_{yaw}| \le 35^\circ$, $|\theta_{pitch}| \le 25^\circ$.
  - Exceeding bounds triggers `"excessive_head_turn"` warning and flags spatial confidence penalty.
- **Multi-Face Rejection**:
  - If more than 1 face is detected in the clinical field of view, the system halts facial pain inference to prevent attributing a bystander's expression to the patient.
- **Occlusion Handling**:
  - Individual action units (AU4, AU6/7, AU9/10, AU25/26/27) require complete landmark visibility. If landmarks fall off-frame, the affected AU defaults to neutral with uncertainty scaling.

### 2.2 Voice & Acoustic Channel (`ml/voice/preprocessing.py`)
- **Acoustic Noise Floor & SNR**:
  - Computes Signal-to-Noise Ratio (SNR).
  - If $\text{SNR} < 12.0\text{ dB}$, emits `"high_background_noise"` warning and reduces acoustic weight in fusion.
- **Minimum Duration Check**:
  - Discards audio frames shorter than $0.5$ seconds to prevent false alarms on transient clicks, coughs, or microphone bumps.
- **Speech Rate & Pause Analysis**:
  - Distinguishes breathlessness (high pause ratio $> 0.40$ + rapid shallow speech) from intentional pauses.

### 2.3 Sign Language Channel (`ml/sign_language/temporal_buffer.py`)
- **Temporal Ring Buffer**:
  - Buffers 15 consecutive frames ($500\text{ ms}$) of 21-joint 3D coordinates.
  - Calculates centroid displacement velocity ($\Delta d / \Delta t$) to require steady hold ($< 0.08\text{ units/frame}$) before confirming a key sign.
- **Dialect Separation**:
  - American Sign Language (ASL) and Indian Sign Language (ISL) models run on separate dictionary graphs, preventing cross-cultural misinterpretations (e.g., medical doctor signed differently in ASL vs. ISL).

---

## 3. Sensor Dropout & Degraded Modes
PAINSENSE-AI gracefully degrades across all combinations of channel dropout:

| Active Channels | Behavior | Fusion Strategy | UI Indicator |
| :--- | :--- | :--- | :--- |
| **All Channels Active** | Full multimodal synthesis | Evidential consensus across vision, voice, sign, self-report | Green "All Sensors Active" badge |
| **Camera Blocked / Dark** | Vision disabled | Voice + Sign + Self-Report | Amber "Camera Degraded (Lighting/Occluded)" |
| **Mic Noisy / Muted** | Audio disabled | Vision + Sign + Self-Report | Amber "Microphone Inactive" |
| **No Active Sensors** | Sensor-less mode | Direct structured self-report questionnaire | Blue "Manual Mode Active" |
| **Conflicting Inputs** | Vision shows Low (0/10), User reports Severe (9/10) | **User self-report strictly overrides AI.** System NEVER discounts user-reported distress. | Informative badge: "High reported distress noted; observational markers subdued." |
