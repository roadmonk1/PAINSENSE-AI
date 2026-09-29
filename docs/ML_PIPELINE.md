# PAINSENSE-AI Machine Learning Pipeline & Benchmark

## 1. Multimodal Evaluation Benchmark Results

Our empirical benchmark evaluates 250 evaluation episodes across unimodal channels versus multimodal fusion:

| Modality Channel | Accuracy | Precision (Weighted) | Recall (Weighted) | F1-Score |
| :--- | :---: | :---: | :---: | :---: |
| **Camera Optical Only** | 0.6480 | 0.6530 | 0.6480 | 0.6474 |
| **Voice Acoustic Only** | 0.7200 | 0.7252 | 0.7200 | 0.7205 |
| **Sign Language Only** | 0.8160 | 0.8181 | 0.8160 | 0.8158 |
| **Self-Report Only** | 0.9160 | 0.9165 | 0.9160 | 0.9159 |
| **Multimodal Fusion** | **0.9280** | **0.9290** | **0.9280** | **0.9277** |

### Benchmark Takeaway
- Optical vision alone is insufficient for clinical assessment (accuracy ~65%) due to natural variability in human stoicism and non-expressive presentation.
- Multimodal Fusion achieves highest overall accuracy (92.8%) while maintaining patient safety by resolving ambiguity when individual modalities degrade.

## 2. Facial Action Units & PSPI Formulation

The optical engine models the **Prkachin and Solomon Pain Intensity (PSPI)** clinical standard:

$$\text{PSPI} = \text{AU4} + \max(\text{AU6}, \text{AU7}) + \max(\text{AU9}, \text{AU10}) + \text{AU43}$$

Where:
- **AU4**: Brow lowerer / Corrugator supercilii contraction
- **AU6 / AU7**: Cheek raiser / Eyelid tightener (Orbital tightening)
- **AU9 / AU10**: Nose wrinkler / Upper lip raiser
- **AU43**: Eye closure duration

## 3. Acoustic Vocal Strain Features
- **Pitch Jitter**: Relative period-to-period variability in fundamental frequency ($F_0$).
- **Energy Flux**: Spectral flux across speech frequency bands measuring vocal tremor.
- **Vocal Strain Index**: Normalized composite score representing physiological phonation tension.

## 4. Dataset Licensing & Ethical Guidance

For further training and fine-tuning, teams should utilize only ethically consented, appropriately licensed research datasets:
- **UNBC-McMaster Shoulder Pain Expression Archive**: Clinically recorded video sequences with FACS Action Unit ground truth.
- **BioVid Heat Pain Database**: Controlled experimental thermal stimulation with physiological telemetry.
- **WLASL & ASL-LEX**: Research datasets for American Sign Language keypoint modeling.
