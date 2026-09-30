from typing import List, Dict, Any, Optional
import math
from ml.facial.inference import run_facial_inference

class FacialPainAnalysisService:
    """
    Analyzes facial indicators based on clinical pain expression metrics
    (Prkachin and Solomon Pain Intensity / PSPI inspired Action Units)
    powered by the ml.facial pipeline.
    """

    def analyze_features(
        self,
        features: Optional[Dict[str, float]] = None,
        landmarks: Optional[List[Dict[str, float]]] = None,
        lighting_score: Optional[float] = None
    ) -> Dict[str, Any]:
        feat = features or {}
        brow_furrowing = float(feat.get("brow_furrowing", 0.15))
        orbital_tightening = float(feat.get("orbital_tightening", 0.10))
        mouth_tension = float(feat.get("mouth_tension", 0.12))

        # Invoke ML pipeline
        ml_res = run_facial_inference(
            client_features=feat,
            landmarks=landmarks,
            lighting_score=lighting_score
        )

        return {
            "brow_furrowing": round(brow_furrowing, 2),
            "orbital_tightening": round(orbital_tightening, 2),
            "mouth_tension": round(mouth_tension, 2),
            "grimace_score": ml_res.get("grimace_score", 0.15),
            "tension_level": ml_res.get("tension_level", "Low"),
            "confidence": ml_res.get("confidence", 0.85),
            "observable_indicators": ml_res.get("observable_indicators", ["Neutral facial baseline"]),
            "model_status": "active_ml_pipeline",
            "quality_warnings": ml_res.get("quality_warnings", []),
            "disclaimer": ml_res.get("disclaimer", "AI observation only — not a medical diagnosis.")
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
