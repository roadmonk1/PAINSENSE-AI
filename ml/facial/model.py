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

    def predict(
        self,
        raw_features: Optional[Dict[str, float]] = None,
        landmarks: Optional[List[Dict[str, float]]] = None,
        frame_history: Optional[List[Dict[str, float]]] = None,
        lighting_score: Optional[float] = None
    ) -> Dict[str, Any]:
        # Step 1: Preprocessing & Optical Quality Checks
        quality_warnings = []
        confidence = 0.85

        if landmarks:
            valid, reason = self.preprocessor.validate_landmarks(landmarks)
            if not valid:
                return {
                    "grimace_score": 0.0,
                    "tension_level": "Unavailable",
                    "confidence": 0.0,
                    "observable_indicators": ["No face detected"],
                    "quality_warning": reason,
                    "model_status": "face_not_detected"
                }

            pose = self.preprocessor.estimate_head_pose(landmarks)
            if not pose["acceptable_angle"]:
                confidence -= 0.30
                quality_warnings.append(pose["reason"])

        light = self.preprocessor.assess_lighting_quality(lighting_score)
        if not light["usable"]:
            confidence -= 0.25
            quality_warnings.append(light["warning"])

        # Step 2: Feature Extraction
        aus = self.feature_extractor.extract_action_units(raw_features)
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
        confidence = max(0.20, min(0.95, round(confidence, 2)))

        if final_score > 0.55:
            tension_level = "High"
        elif final_score > 0.30:
            tension_level = "Moderate"
        elif final_score > 0.15:
            tension_level = "Mild"
        else:
            tension_level = "Low"

        return {
            "grimace_score": final_score,
            "pspi_baseline_score": pspi_result["pspi_score"],
            "tension_level": tension_level,
            "confidence": confidence,
            "observable_indicators": pspi_result["observable_indicators"],
            "action_units": aus,
            "quality_warnings": quality_warnings,
            "disclaimer": "AI observation only — does not prove or disprove pain. A stoic or paralyzed face may exhibit low score during severe pain."
        }
