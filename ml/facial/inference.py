"""
PAINSENSE-AI Facial Inference Pipeline
Entrypoint for single frame and batch video optical analysis.
"""

from typing import Dict, Any, Optional, List
from ml.facial.model import FacialPainModel

_global_model = None

def get_facial_model() -> FacialPainModel:
    global _global_model
    if _global_model is None:
        _global_model = FacialPainModel()
    return _global_model

def run_facial_inference(
    client_features: Optional[Dict[str, float]] = None,
    landmarks: Optional[List[Dict[str, float]]] = None,
    frame_history: Optional[List[Dict[str, float]]] = None,
    lighting_score: Optional[float] = None
) -> Dict[str, Any]:
    """Runs end-to-end facial inference pipeline."""
    model = get_facial_model()
    return model.predict(
        raw_features=client_features,
        landmarks=landmarks,
        frame_history=frame_history,
        lighting_score=lighting_score
    )
