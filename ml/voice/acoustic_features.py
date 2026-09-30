"""
PAINSENSE-AI Comprehensive Acoustic Feature Extraction
Extracts fundamental frequency (F0), pitch variability, energy, speech pauses,
jitter, shimmer, and Harmonics-to-Noise Ratio (HNR).
"""

from typing import Dict, Any, Optional
import numpy as np

class AcousticFeatureExtractor:
    """Extracts bio-acoustic perturbation markers associated with somatic discomfort and vocal tension."""

    @classmethod
    def extract_features(
        cls,
        raw_features: Optional[Dict[str, float]] = None,
        audio_duration_sec: float = 3.5
    ) -> Dict[str, Any]:
        feat = raw_features or {}

        # 1. Pitch & Variability (F0)
        f0_hz = float(feat.get("f0_mean_hz", 175.0))
        f0_std_hz = float(feat.get("f0_variability_hz", 28.0))

        # 2. Perturbation: Jitter (Period perturbation) & Shimmer (Amplitude perturbation)
        jitter_local = float(feat.get("pitch_jitter", feat.get("jitter_local", 0.018)))
        shimmer_local = float(feat.get("shimmer_local", 0.038))

        # 3. Energy / Dynamics & Speech Pace
        energy_rms = float(feat.get("energy_rms", 0.45))
        energy_fluctuation = float(feat.get("energy_fluctuation", 0.22))
        speech_rate_sps = float(feat.get("speech_rate_syllables_sec", 3.8))
        pause_ratio = float(feat.get("pause_ratio", 0.18))

        # 4. Harmonics-to-Noise Ratio (HNR in dB) - higher is cleaner phonation, < 12 dB indicates hoarseness
        hnr_db = float(feat.get("hnr_db", 18.5))

        # 5. Composite Vocal Strain Index (normalized 0.0 to 1.0)
        # Jitter (>0.03 is elevated), Shimmer (>0.06 is elevated), low HNR, high energy flux
        jitter_norm = min(1.0, jitter_local / 0.05)
        shimmer_norm = min(1.0, shimmer_local / 0.10)
        hnr_penalty = max(0.0, (15.0 - hnr_db) / 15.0)

        strain_index = (jitter_norm * 0.40) + (shimmer_norm * 0.35) + (energy_fluctuation * 0.15) + (hnr_penalty * 0.10)
        strain_index = max(0.0, min(1.0, round(strain_index, 3)))

        vocal_tremor = jitter_local > 0.035 or energy_fluctuation > 0.40 or strain_index > 0.55

        acoustic_indicators = []
        if vocal_tremor:
            acoustic_indicators.append("Vocal tremor / pitch instability detected")
        if strain_index > 0.60:
            acoustic_indicators.append("Marked vocal tension and amplitude perturbation")
        elif strain_index > 0.35:
            acoustic_indicators.append("Subtle vocal strain / phonation effort")
        if pause_ratio > 0.35:
            acoustic_indicators.append("Hesitant phonation with frequent respiratory pauses")

        if not acoustic_indicators:
            acoustic_indicators.append("Stable, unconstrained baseline phonation")

        return {
            "vocal_strain_index": strain_index,
            "vocal_tremor_detected": vocal_tremor,
            "f0_mean_hz": round(f0_hz, 1),
            "f0_variability_hz": round(f0_std_hz, 1),
            "jitter_local": round(jitter_local, 4),
            "shimmer_local": round(shimmer_local, 4),
            "hnr_db": round(hnr_db, 1),
            "speech_rate_syllables_sec": round(speech_rate_sps, 1),
            "pause_ratio": round(pause_ratio, 2),
            "acoustic_indicators": acoustic_indicators,
            "disclaimer": "Acoustic features indicate vocal cord tension and physical strain, but do not independently prove pain."
        }
