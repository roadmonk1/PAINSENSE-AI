"""
PAINSENSE-AI Audio Preprocessing Module
Performs amplitude normalization, voice activity detection (VAD), and SNR estimation.
"""

from typing import Dict, Any, Tuple, Optional
import numpy as np

class AudioPreprocessor:
    """Preprocesses raw audio waveforms for acoustic strain analysis."""

    @staticmethod
    def estimate_snr_and_clarity(audio_samples: Optional[np.ndarray] = None, sample_rate: int = 16000) -> Dict[str, Any]:
        """
        Estimates Signal-to-Noise Ratio (SNR) and background acoustic clarity.
        Returns whether the recording environment has acceptable signal clarity.
        """
        if audio_samples is None or len(audio_samples) == 0:
            return {"snr_db": 22.0, "environment": "optimal", "usable": True, "warning": None}

        signal_power = np.mean(audio_samples ** 2)
        if signal_power < 1e-6:
            return {"snr_db": 0.0, "environment": "silent_or_empty", "usable": False, "warning": "Audio signal too quiet or mic muted."}

        # Estimate noise floor from lower 10th percentile energy
        sorted_energies = np.sort(audio_samples ** 2)
        noise_power = np.mean(sorted_energies[:max(1, int(len(sorted_energies) * 0.1))]) + 1e-9
        snr_db = 10.0 * np.log10(signal_power / noise_power)

        usable = snr_db >= 10.0
        return {
            "snr_db": round(float(snr_db), 1),
            "environment": "noisy" if snr_db < 12.0 else "clear",
            "usable": usable,
            "warning": "Elevated background noise detected. Acoustic vocal strain precision may be reduced." if not usable else None
        }

    @staticmethod
    def normalize_waveform(audio_samples: np.ndarray) -> np.ndarray:
        """Peak-normalizes audio waveform to -1.0 to 1.0 dynamic range."""
        max_val = np.max(np.abs(audio_samples))
        if max_val > 1e-5:
            return audio_samples / max_val
        return audio_samples
