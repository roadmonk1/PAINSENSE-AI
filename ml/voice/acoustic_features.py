"""Acoustic feature extractor abstraction for vocal strain and pitch perturbation."""
import numpy as np
from typing import Dict, Any

class AcousticStrainExtractor:
    """
    Extracts acoustic perturbation indicators associated with physical discomfort:
    - Pitch Jitter: Period-to-period variability of fundamental frequency (F0)
    - Shimmer: Amplitude perturbation
    - Harmonics-to-Noise Ratio (HNR): Measures breathiness / hoarseness
    """

    @staticmethod
    def calculate_vocal_strain(jitter: float, shimmer: float, energy_flux: float) -> Dict[str, Any]:
        # Strain index (0.0 to 1.0)
        strain = (jitter * 0.4) + (shimmer * 0.35) + (energy_flux * 0.25)
        strain = min(1.0, max(0.0, strain))

        tremor_present = jitter > 0.40 or strain > 0.55

        return {
            "vocal_strain_index": round(strain, 2),
            "tremor_detected": tremor_present,
            "interpretation": "Elevated vocal tension" if strain > 0.5 else ("Mild vocal variation" if strain > 0.25 else "Stable phonation")
        }
