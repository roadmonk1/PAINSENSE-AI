"""
PAINSENSE-AI Voice Inference Entrypoint
"""

from typing import Dict, Any, Optional
from ml.voice.model import VoicePainModel

_global_voice_model = None

def get_voice_model() -> VoicePainModel:
    global _global_voice_model
    if _global_voice_model is None:
        _global_voice_model = VoicePainModel()
    return _global_voice_model

def run_voice_inference(
    transcript: Optional[str] = None,
    acoustic_features: Optional[Dict[str, float]] = None,
    audio_snr_db: Optional[float] = None
) -> Dict[str, Any]:
    """Runs voice and acoustic analysis pipeline."""
    model = get_voice_model()
    return model.analyze(
        transcript=transcript,
        acoustic_features=acoustic_features,
        audio_snr_db=audio_snr_db
    )
