import re
from typing import Dict, Any, List, Optional
from abc import ABC, abstractmethod
from ml.voice.inference import run_voice_inference

class SpeechRecognitionProvider(ABC):
    @abstractmethod
    def transcribe(self, audio_data: Any) -> str:
        pass

class LocalRuleBasedSpeechProvider(SpeechRecognitionProvider):
    def transcribe(self, audio_data: Any) -> str:
        if isinstance(audio_data, str) and audio_data.strip():
            return audio_data.strip()
        return "Severe lower back pain since this morning, difficult to walk."

class VoiceAnalysisService:
    """
    Analyzes natural speech and acoustic perturbation indicators for supportive pain communication.
    Powered by the decoupled ml.voice pipeline.
    """

    def __init__(self, speech_provider: Optional[SpeechRecognitionProvider] = None):
        self.provider = speech_provider or LocalRuleBasedSpeechProvider()

    def analyze_voice(
        self,
        transcript: Optional[str] = None,
        acoustic_features: Optional[Dict[str, float]] = None,
        audio_snr_db: Optional[float] = None
    ) -> Dict[str, Any]:
        text = transcript or ""
        # Route to ml.voice pipeline
        res = run_voice_inference(
            transcript=text,
            acoustic_features=acoustic_features,
            audio_snr_db=audio_snr_db
        )

        return {
            "transcript": res["transcript"],
            "extracted_location": res["extracted_location"],
            "extracted_severity": res["extracted_severity"],
            "extracted_duration": res["extracted_duration"],
            "extracted_pain_type": res["extracted_pain_type"],
            "extracted_symptoms": res["extracted_symptoms"],
            "reported_medications": res.get("reported_medications", []),
            "reported_injuries": res.get("reported_injuries", []),
            "acoustic_strain_score": res["acoustic_strain_score"],
            "vocal_tremor_detected": res["vocal_tremor_detected"],
            "acoustic_indicators": res.get("acoustic_indicators", []),
            "confidence": res["confidence"],
            "provider_used": "ml_voice_acoustic_engine",
            "disclaimer": res["disclaimer"]
        }

voice_service = VoiceAnalysisService()
