"""Sign language gesture sequence model and hand landmark geometry analyzer."""
from typing import List, Dict, Any, Tuple
import math

class SignLandmarkAnalyzer:
    """
    Computes key joint angles and normalized tip-to-palm distance vectors
    for 21 standard hand landmarks (MediaPipe Hands format).
    """

    @staticmethod
    def euclidean_distance(p1: Dict[str, float], p2: Dict[str, float]) -> float:
        return math.sqrt((p1.get("x", 0) - p2.get("x", 0))**2 +
                         (p1.get("y", 0) - p2.get("y", 0))**2 +
                         (p1.get("z", 0) - p2.get("z", 0))**2)

    @classmethod
    def extract_finger_states(cls, landmarks: List[Dict[str, float]]) -> Dict[str, bool]:
        """Returns whether each finger (thumb, index, middle, ring, pinky) is extended."""
        if len(landmarks) < 21:
            return {"thumb": False, "index": False, "middle": False, "ring": False, "pinky": False}

        wrist = landmarks[0]
        # Compare tip distance to PIP joint distance from wrist
        tips = [4, 8, 12, 16, 20]
        pips = [2, 6, 10, 14, 18]
        names = ["thumb", "index", "middle", "ring", "pinky"]

        extended = {}
        for name, tip_idx, pip_idx in zip(names, tips, pips):
            d_tip = cls.euclidean_distance(landmarks[tip_idx], wrist)
            d_pip = cls.euclidean_distance(landmarks[pip_idx], wrist)
            extended[name] = d_tip > d_pip * 1.15

        return extended

class SignSequenceAssembler:
    """Assembles temporal tokens into structured medical intent."""

    @staticmethod
    def assemble(tokens: List[str]) -> Dict[str, Any]:
        normalized = [t.lower().strip() for t in tokens if t.strip()]
        if not normalized:
            return {"phrase": "No active gesture", "intent": "neutral"}

        if "pain" in normalized:
            loc = next((t for t in normalized if t in ["chest", "head", "stomach", "back", "arm", "leg"]), "unspecified region")
            sev = next((t for t in normalized if t in ["severe", "mild"]), "moderate")
            return {
                "phrase": f"{sev.capitalize()} {loc} pain",
                "intent": "pain_report",
                "urgency": "high" if sev == "severe" or loc == "chest" else "routine"
            }

        if "help" in normalized and "emergency" in normalized:
            return {
                "phrase": "Emergency assistance requested immediately",
                "intent": "emergency_call",
                "urgency": "critical"
            }

        return {
            "phrase": " ".join([t.capitalize() for t in normalized]),
            "intent": "general_communication",
            "urgency": "routine"
        }
