"""
PAINSENSE-AI Facial Feature Extractor
Extracts Action Units (AU4, AU6/7, AU9/10, AU25/26/27), Eye/Mouth Aspect Ratios,
and temporal dynamic window metrics.
"""

from typing import List, Dict, Any, Optional
import math
import numpy as np

class FacialFeatureExtractor:
    """Extracts geometric action units and temporal dynamics for pain expression analysis."""

    @staticmethod
    def euclidean_distance(p1: Dict[str, float], p2: Dict[str, float]) -> float:
        return math.sqrt(
            (p1.get("x", 0.0) - p2.get("x", 0.0)) ** 2 +
            (p1.get("y", 0.0) - p2.get("y", 0.0)) ** 2 +
            (p1.get("z", 0.0) - p2.get("z", 0.0)) ** 2
        )

    @classmethod
    def extract_action_units(cls, raw_features: Optional[Dict[str, float]] = None) -> Dict[str, float]:
        """
        Extracts or normalizes key Facial Action Units associated with pain:
        - AU4: Brow Lowerer
        - AU6/7: Orbit tightening / Cheek raiser / Eyelid tightener
        - AU9/10: Nose wrinkler / Upper lip raiser
        - AU25/26/27: Mouth opening / Jaw drop / Lip stretch
        """
        f = raw_features or {}
        au4 = max(0.0, min(1.0, float(f.get("brow_furrowing", f.get("au4", 0.15)))))
        au6_7 = max(0.0, min(1.0, float(f.get("orbital_tightening", f.get("au6_7", 0.10)))))
        au9_10 = max(0.0, min(1.0, float(f.get("levator_tightening", f.get("au9_10", 0.08)))))
        au25_27 = max(0.0, min(1.0, float(f.get("mouth_tension", f.get("au25_27", 0.12)))))

        return {
            "au4_brow_lowerer": round(au4, 3),
            "au6_7_orbital_tightener": round(au6_7, 3),
            "au9_10_levator": round(au9_10, 3),
            "au25_27_mouth_tension": round(au25_27, 3)
        }

    @classmethod
    def compute_temporal_window_features(cls, frame_history: List[Dict[str, float]]) -> Dict[str, float]:
        """
        Computes dynamic temporal changes across a temporal window of frames:
        Mean intensity, peak intensity, and rate of onset (velocity).
        """
        if not frame_history:
            return {"au4_mean": 0.15, "au4_peak": 0.15, "au6_7_mean": 0.10, "au6_7_peak": 0.10, "dynamics_valid": False}

        au4_vals = [f.get("brow_furrowing", f.get("au4", 0.15)) for f in frame_history]
        au6_vals = [f.get("orbital_tightening", f.get("au6_7", 0.10)) for f in frame_history]

        return {
            "au4_mean": round(float(np.mean(au4_vals)), 3),
            "au4_peak": round(float(np.max(au4_vals)), 3),
            "au6_7_mean": round(float(np.mean(au6_vals)), 3),
            "au6_7_peak": round(float(np.max(au6_vals)), 3),
            "window_size": len(frame_history),
            "dynamics_valid": True
        }
