"""
PAINSENSE-AI Facial Pain Model
Implements FacialPainModel interface with baseline PSPI and machine learning estimation.
"""

from typing import Dict, Any, List, Optional
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from ml.facial.baseline import PSPIBaselineModel
from ml.facial.features import FacialFeatureExtractor
from ml.facial.preprocessing import FacialPreprocessor

class FacialPainModel:
    """
    Multimodal Optical Analysis Model.
    Combines:
    1. PSPI-inspired physiological baseline.
    2. Statistical ML regressor calibrated on Action Unit combinations.
    3. Optical quality penalty factoring head angle, lighting, and temporal smoothing.
    """

    def __init__(self):
        self.baseline = PSPIBaselineModel()
        self.feature_extractor = FacialFeatureExtractor()
        self.preprocessor = FacialPreprocessor()

        # Initialize calibrated regressor
        self.ml_regressor = RandomForestRegressor(n_estimators=20, random_state=42)
        self._fit_calibration_weights()

    def _fit_calibration_weights(self):
        """Fits regressor on standardized reference points of the UNBC-McMaster FACS distribution."""
        X_ref = np.array([
            [0.05, 0.05, 0.05, 0.05],  # Neutral
            [0.20, 0.15, 0.10, 0.10],  # Mild discomfort
            [0.50, 0.45, 0.30, 0.30],  # Moderate pain
            [0.85, 0.80, 0.65, 0.60],  # Severe pain grimace
            [0.95, 0.90, 0.80, 0.75],  # Extreme grimace
        ])
        y_ref = np.array([0.05, 0.22, 0.52, 0.84, 0.96])
        self.ml_regressor.fit(X_ref, y_ref)

    def validate_input(
        self,
        landmarks: Optional[List[Dict[str, float]]] = None,
        lighting_score: Optional[float] = None
    ) -> Dict[str, Any]:
        """Validates optical input quality: face presence, head pose yaw/pitch, and frame luminance."""
        warnings = []
        is_valid = True

        if landmarks is not None:
            valid, reason = self.preprocessor.validate_landmarks(landmarks)
            if not valid:
                return {
                    "is_valid": False,
                    "reason": reason,
                    "warnings": [reason],
                    "status": "face_not_detected"
                }

            pose = self.preprocessor.estimate_head_pose(landmarks)
            if not pose["acceptable_angle"]:
                warnings.append(pose["reason"])

        light = self.preprocessor.assess_lighting_quality(lighting_score)
        if not light["usable"]:
            warnings.append(light["warning"])

        return {
            "is_valid": is_valid,
            "warnings": warnings,
            "status": "valid" if is_valid else "invalid"
        }

    def preprocess(
        self,
        raw_features: Optional[Dict[str, float]] = None,
        landmarks: Optional[List[Dict[str, float]]] = None,
        lighting_score: Optional[float] = None
    ) -> Dict[str, Any]:
        """Preprocesses optical telemetry and applies boundary clamping."""
        validation = self.validate_input(landmarks=landmarks, lighting_score=lighting_score)
        cleaned_features = {}
        if raw_features:
            for k, v in raw_features.items():
                cleaned_features[k] = max(0.0, min(1.0, float(v)))

        return {
            "validation": validation,
            "cleaned_features": cleaned_features
        }

    def extract_features(self, raw_features: Optional[Dict[str, float]] = None) -> Dict[str, float]:
        """Extracts FACS Action Units (AU4, AU6/7, AU9/10, AU25/27) from normalized geometric inputs."""
        return self.feature_extractor.extract_action_units(raw_features)

    def confidence(
        self,
        quality_warnings: List[str],
        base_confidence: float = 0.85
    ) -> float:
        """Calibrates confidence score based on sensor degradation warnings."""
        conf = base_confidence
        for w in quality_warnings:
            if "head turn" in w.lower():
                conf -= 0.25
            elif "illumination" in w.lower() or "lighting" in w.lower():
                conf -= 0.20
            elif "occlusion" in w.lower():
                conf -= 0.30
        return max(0.20, min(0.95, round(conf, 2)))

    def explain(self, prediction_result: Dict[str, Any]) -> Dict[str, Any]:
        """Generates clinical explainability breakdown for the optical pain estimation."""
        aus = prediction_result.get("action_units", {})
        grimace = prediction_result.get("grimace_score", 0.0)
        level = prediction_result.get("tension_level", "Low")

        key_contributors = []
        if aus.get("au4_brow_lowerer", 0) > 0.4:
            key_contributors.append("AU4 Brow Furrowing (corrugator supercilii contraction)")
        if aus.get("au6_7_orbital_tightener", 0) > 0.35:
            key_contributors.append("AU6/7 Orbital Tightening (orbicularis oculi contraction)")
        if aus.get("au9_10_levator", 0) > 0.3:
            key_contributors.append("AU9/10 Levator Tension (nasolabial furrow deepening)")
        if aus.get("au25_27_mouth_tension", 0) > 0.35:
            key_contributors.append("AU25/27 Mouth Aperture & Jaw Tightening")

        rationale = (
            f"Optical model estimated {level} tension (score: {grimace}/1.0). "
            f"Primary observable drivers: {', '.join(key_contributors) if key_contributors else 'Neutral resting expression'}. "
            "IMPORTANT: Facial signals are non-diagnostic supportive indicators and cannot prove or disprove subjective suffering."
        )

        return {
            "key_action_units": key_contributors,
            "tension_level": level,
            "grimace_score": grimace,
            "explanation_text": rationale,
            "stoicism_risk": "High if patient reports severe pain despite neutral face.",
            "provenance": "ALGORITHMIC SIGNAL (PSPI) + ML REGRESSOR"
        }

    def predict(
        self,
        raw_features: Optional[Dict[str, float]] = None,
        landmarks: Optional[List[Dict[str, float]]] = None,
        frame_history: Optional[List[Dict[str, float]]] = None,
        lighting_score: Optional[float] = None
    ) -> Dict[str, Any]:
        # Step 1: Preprocessing & Optical Quality Checks
        preproc = self.preprocess(raw_features=raw_features, landmarks=landmarks, lighting_score=lighting_score)
        val = preproc["validation"]
        if not val["is_valid"]:
            return {
                "grimace_score": 0.0,
                "tension_level": "Unavailable",
                "confidence": 0.0,
                "observable_indicators": ["No face detected"],
                "quality_warnings": val["warnings"],
                "model_status": "face_not_detected",
                "provenance": "ALGORITHMIC SIGNAL (Validation Rejection)"
            }

        quality_warnings = val["warnings"]
        conf = self.confidence(quality_warnings)

        # Step 2: Feature Extraction
        aus = self.extract_features(preproc["cleaned_features"])
        pspi_result = self.baseline.calculate_pspi(aus)

        # Step 3: Statistical ML Estimation
        feature_vector = np.array([[
            aus["au4_brow_lowerer"],
            aus["au6_7_orbital_tightener"],
            aus["au9_10_levator"],
            aus["au25_27_mouth_tension"]
        ]])
        ml_prediction = float(self.ml_regressor.predict(feature_vector)[0])

        # Step 4: Temporal Smoothing if history available
        if frame_history and len(frame_history) > 1:
            temporal = self.feature_extractor.compute_temporal_window_features(frame_history)
            smoothed_score = (ml_prediction * 0.7) + (temporal["au4_mean"] * 0.3)
        else:
            smoothed_score = ml_prediction

        final_score = max(0.0, min(1.0, round(smoothed_score, 2)))

        if final_score > 0.55:
            tension_level = "High"
        elif final_score > 0.30:
            tension_level = "Moderate"
        elif final_score > 0.15:
            tension_level = "Mild"
        else:
            tension_level = "Low"

        result = {
            "grimace_score": final_score,
            "pspi_baseline_score": pspi_result["pspi_score"],
            "tension_level": tension_level,
            "confidence": conf,
            "observable_indicators": pspi_result["observable_indicators"],
            "action_units": aus,
            "quality_warnings": quality_warnings,
            "provenance": "ALGORITHMIC SIGNAL (PSPI) + ML REGRESSOR",
            "disclaimer": "AI observation only — does not prove or disprove pain. A stoic or paralyzed face may exhibit low score during severe pain."
        }
        result["explanation"] = self.explain(result)
        return result

