"""
PAINSENSE-AI Temporal Gesture Buffer & Trajectory Modeler
Buffers multi-frame landmark sequences to model movement velocity,
hold durations, and hand orientation over time.
"""

from typing import List, Dict, Any, Optional
import math
import numpy as np

class TemporalGestureBuffer:
    """Maintains a rolling temporal window of 21-joint hand landmark frames."""

    def __init__(self, window_size: int = 15):
        self.window_size = window_size
        self.frame_buffer: List[Dict[str, Any]] = []

    def push_frame(
        self,
        landmarks: List[Dict[str, float]],
        handedness: str = "Right",
        confidence: float = 0.90,
        timestamp_ms: Optional[float] = None
    ):
        """Adds a new keypoint frame into the buffer, discarding oldest if buffer is full."""
        frame_entry = {
            "landmarks": landmarks,
            "handedness": handedness,
            "confidence": confidence,
            "timestamp_ms": timestamp_ms or 0.0
        }
        self.frame_buffer.append(frame_entry)
        if len(self.frame_buffer) > self.window_size:
            self.frame_buffer.pop(0)

    def clear(self):
        self.frame_buffer.clear()

    def compute_trajectory_and_stability(self) -> Dict[str, Any]:
        """
        Calculates centroid displacement velocity, holding stability,
        and orientation angle over the window.
        """
        if len(self.frame_buffer) < 3:
            return {
                "trajectory_velocity": 0.0,
                "is_holding_gesture": False,
                "hand_orientation_deg": 0.0,
                "average_confidence": 0.85,
                "buffer_ready": False
            }

        wrist_positions = []
        confidences = []
        for f in self.frame_buffer:
            lms = f["landmarks"]
            if lms and len(lms) > 0:
                wrist = lms[0]
                wrist_positions.append([wrist.get("x", 0.0), wrist.get("y", 0.0)])
                confidences.append(f.get("confidence", 0.9))

        if len(wrist_positions) < 3:
            return {
                "trajectory_velocity": 0.0,
                "is_holding_gesture": False,
                "hand_orientation_deg": 0.0,
                "average_confidence": 0.50,
                "buffer_ready": False
            }

        pts = np.array(wrist_positions)
        # Compute Euclidean displacement between consecutive frames
        displacements = np.sqrt(np.sum(np.diff(pts, axis=0) ** 2, axis=1))
        avg_velocity = float(np.mean(displacements))

        # A steady hold occurs when velocity is low across window (holding the final sign posture)
        is_holding = avg_velocity < 0.025

        # Calculate hand orientation (wrist to middle MCP joint #9)
        last_lms = self.frame_buffer[-1]["landmarks"]
        orientation_deg = 0.0
        if len(last_lms) > 9:
            dx = last_lms[9].get("x", 0.0) - last_lms[0].get("x", 0.0)
            dy = last_lms[9].get("y", 0.0) - last_lms[0].get("y", 0.0)
            orientation_deg = math.degrees(math.atan2(dy, dx))

        avg_conf = float(np.mean(confidences))

        return {
            "trajectory_velocity": round(avg_velocity, 4),
            "is_holding_gesture": is_holding,
            "hand_orientation_deg": round(orientation_deg, 1),
            "average_confidence": round(avg_conf, 2),
            "buffer_ready": True
        }
