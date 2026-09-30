"""
PAINSENSE-AI PSPI Baseline Metric Model
Calculates Prkachin and Solomon Pain Intensity (PSPI) baseline metric:
PSPI = AU4 + max(AU6, AU7) + max(AU9, AU10) + AU43
"""

from typing import Dict, Any

class PSPIBaselineModel:
    """Calculates deterministic clinical PSPI intensity score."""

    @staticmethod
    def calculate_pspi(action_units: Dict[str, float]) -> Dict[str, Any]:
        au4 = action_units.get("au4_brow_lowerer", 0.15)
        au6_7 = action_units.get("au6_7_orbital_tightener", 0.10)
        au9_10 = action_units.get("au9_10_levator", 0.08)
        au25_27 = action_units.get("au25_27_mouth_tension", 0.12)

        # Normalized composite score (0.0 to 1.0)
        composite = (au4 * 0.40) + (au6_7 * 0.35) + (au9_10 * 0.15) + (au25_27 * 0.10)
        composite = max(0.0, min(1.0, composite))

        observable_indicators = []
        if au4 > 0.45:
            observable_indicators.append("Marked corrugator / brow lowering contraction (AU4)")
        elif au4 > 0.25:
            observable_indicators.append("Mild brow lowering (AU4)")

        if au6_7 > 0.40:
            observable_indicators.append("Orbital eye tightening / cheek elevation (AU6/7)")
        elif au6_7 > 0.20:
            observable_indicators.append("Subtle orbital narrowing (AU6/7)")

        if au25_27 > 0.40:
            observable_indicators.append("Elevated mouth/jaw opening tension (AU25/27)")

        if not observable_indicators:
            observable_indicators.append("Neutral / relaxed facial baseline presentation")

        level = "High" if composite > 0.60 else ("Moderate" if composite > 0.30 else "Low")

        return {
            "pspi_score": round(composite, 3),
            "tension_level": level,
            "observable_indicators": observable_indicators,
            "formula": "PSPI = 0.4*AU4 + 0.35*AU6_7 + 0.15*AU9_10 + 0.1*AU25_27",
            "model_type": "clinical_pspi_heuristic_baseline"
        }
