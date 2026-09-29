"""Facial Action Unit (AU) and PSPI metric calculation based on facial landmarks."""
from typing import Dict, Any

class FacialActionUnitExtractor:
    """
    Computes pain expression action units according to the Prkachin and Solomon Pain Intensity (PSPI) metric:
    PSPI = AU4 (Brow Lowerer) + max(AU6, AU7) (Orbital Tightener) + max(AU9, AU10) (Levator) + AU43 (Eye Closure)
    """

    @staticmethod
    def compute_pspi(au4: float, au6: float, au7: float, au9: float, au10: float, au43: float) -> float:
        orbit = max(au6, au7)
        levator = max(au9, au10)
        raw_score = au4 + orbit + levator + au43
        # Normalize to 0.0 - 1.0 assuming max expected sum is 4.0
        return min(1.0, max(0.0, raw_score / 4.0))

    @staticmethod
    def classify_intensity(pspi_score: float) -> str:
        if pspi_score >= 0.65:
            return "Severe Distress / Grimace"
        elif pspi_score >= 0.35:
            return "Moderate Pain Facial Reaction"
        elif pspi_score >= 0.15:
            return "Mild Discomfort Expression"
        return "Baseline / Neutral Expression"
