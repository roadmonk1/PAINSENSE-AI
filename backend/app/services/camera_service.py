from typing import List, Dict, Any, Optional
import math

class FacialPainAnalysisService:
    """
    Analyzes facial indicators based on clinical pain expression metrics
    (Prkachin and Solomon Pain Intensity / PSPI inspired Action Units).
    Action Units:
    - AU4: Brow Lowerer
    - AU6/7: Orbit tightening / Cheek raiser / Eyelid tightener
    - AU9/10: Nose wrinkler / Upper lip raiser
    - AU25/26/27: Mouth open / Jaw drop / Lip stretch
    """

    def analyze_features(self, features: Optional[Dict[str, float]] = None) -> Dict[str, Any]:
        feat = features or {}
        brow_furrowing = float(feat.get("brow_furrowing", 0.15))
        orbital_tightening = float(feat.get("orbital_tightening", 0.10))
        mouth_tension = float(feat.get("mouth_tension", 0.12))

        # PSPI-inspired composite intensity calculation (normalized 0 to 1)
        composite = (brow_furrowing * 0.4) + (orbital_tightening * 0.35) + (mouth_tension * 0.25)
        composite = max(0.0, min(1.0, composite))

        indicators = []
        if brow_furrowing > 0.45:
            indicators.append("Prominent brow furrowing / corrugator contraction")
        elif brow_furrowing > 0.25:
            indicators.append("Mild brow lowering")

        if orbital_tightening > 0.40:
            indicators.append("Marked orbital tightening / eye narrowing")
        elif orbital_tightening > 0.25:
            indicators.append("Subtle orbital tension")

        if mouth_tension > 0.40:
            indicators.append("Elevated mouth/jaw tension or lip compression")

        tension_level = "High" if composite > 0.60 else ("Moderate" if composite > 0.30 else "Low")
        confidence = 0.82 if features else 0.70

        return {
            "brow_furrowing": round(brow_furrowing, 2),
            "orbital_tightening": round(orbital_tightening, 2),
            "mouth_tension": round(mouth_tension, 2),
            "grimace_score": round(composite, 2),
            "tension_level": tension_level,
            "confidence": confidence,
            "observable_indicators": indicators if indicators else ["Relaxed baseline facial presentation"],
            "model_status": "active"
        }

class BodySignalAnalysisService:
    """
    Analyzes somatic and postural indicators including guarding, asymmetry,
    and shoulder elevation associated with protective pain behaviors.
    """

    def analyze_body_signals(self, features: Optional[Dict[str, float]] = None) -> Dict[str, Any]:
        feat = features or {}
        postural_guarding = float(feat.get("postural_guarding", 0.10))
        shoulder_tension = float(feat.get("shoulder_tension", 0.15))
        movement_asymmetry = float(feat.get("movement_asymmetry", 0.05))

        protective_posture = postural_guarding > 0.5 or shoulder_tension > 0.65

        indicators = []
        if shoulder_tension > 0.5:
            indicators.append("Elevated bilateral shoulder shrug/tension")
        if postural_guarding > 0.5:
            indicators.append("Protective trunk flexion / torso guarding")
        if movement_asymmetry > 0.4:
            indicators.append("Observable postural asymmetry / favored side")

        composite_guarding = (postural_guarding * 0.45) + (shoulder_tension * 0.35) + (movement_asymmetry * 0.20)
        confidence = 0.80 if features else 0.68

        return {
            "postural_guarding": round(postural_guarding, 2),
            "shoulder_tension": round(shoulder_tension, 2),
            "movement_asymmetry": round(movement_asymmetry, 2),
            "protective_posture_detected": protective_posture,
            "confidence": confidence,
            "observable_indicators": indicators if indicators else ["Neutral musculoskeletal alignment"]
        }

facial_service = FacialPainAnalysisService()
body_service = BodySignalAnalysisService()
