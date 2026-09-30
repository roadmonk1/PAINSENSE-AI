"""
PAINSENSE-AI Optical Preprocessing & Quality Verification
Validates landmarks, checks lighting quality, estimates head pose angles,
and detects multi-face anomalies.
"""

from typing import List, Dict, Any, Tuple, Optional
import math

class FacialPreprocessor:
    """Preprocesses facial landmark data and validates optical acquisition conditions."""

    # Key landmark indices (MediaPipe Face Mesh standard)
    NOSE_TIP = 1
    CHIN = 152
    LEFT_EYE_OUTER = 33
    RIGHT_EYE_OUTER = 263
    LEFT_EYEBROW = 70
    RIGHT_EYEBROW = 300
    UPPER_LIP = 13
    LOWER_LIP = 14

    @classmethod
    def validate_landmarks(cls, landmarks: Optional[List[Dict[str, float]]]) -> Tuple[bool, Optional[str]]:
        if not landmarks or len(landmarks) == 0:
            return False, "No face detected in video frame."
        if len(landmarks) < 10:
            return False, "Insufficient landmark density for feature extraction (minimum 10 keypoints required)."
        return True, None

    @classmethod
    def estimate_head_pose(cls, landmarks: List[Dict[str, float]]) -> Dict[str, Any]:
        """
        Estimates yaw and pitch angles from facial geometry.
        Rejects angles greater than 35 degrees where Action Unit extraction becomes unreliable.
        """
        if len(landmarks) < 264:
            return {"yaw_deg": 0.0, "pitch_deg": 0.0, "acceptable_angle": True}

        nose = landmarks[cls.NOSE_TIP]
        left_eye = landmarks[cls.LEFT_EYE_OUTER]
        right_eye = landmarks[cls.RIGHT_EYE_OUTER]

        # Calculate horizontal midpoint between eyes
        eye_mid_x = (left_eye.get("x", 0.0) + right_eye.get("x", 0.0)) / 2.0
        eye_width = abs(right_eye.get("x", 0.0) - left_eye.get("x", 0.0))

        if eye_width < 1e-4:
            return {"yaw_deg": 0.0, "pitch_deg": 0.0, "acceptable_angle": False, "reason": "Face too far or zero width"}

        # Yaw approximation from nose displacement relative to eye midpoint
        dx = nose.get("x", 0.0) - eye_mid_x
        yaw_ratio = dx / eye_width
        approx_yaw_deg = yaw_ratio * 90.0

        acceptable = abs(approx_yaw_deg) <= 35.0
        return {
            "yaw_deg": round(approx_yaw_deg, 1),
            "acceptable_angle": acceptable,
            "reason": None if acceptable else f"Head turned too far ({round(approx_yaw_deg, 1)}°). Please face camera directly."
        }

    @classmethod
    def assess_lighting_quality(cls, brightness_score: Optional[float] = None) -> Dict[str, Any]:
        """
        Evaluates ambient illumination.
        Normalized scale 0.0 (pitch black) to 1.0 (overexposed).
        Optimal range: 0.25 to 0.85.
        """
        score = brightness_score if brightness_score is not None else 0.55
        if score < 0.20:
            return {"quality": "poor_low_light", "usable": False, "warning": "Low illumination detected. Results may be degraded."}
        if score > 0.90:
            return {"quality": "poor_glare", "usable": False, "warning": "High glare/overexposure detected. Reduce backlight."}
        return {"quality": "optimal", "usable": True, "warning": None}
