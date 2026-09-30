"""
PAINSENSE-AI Voice Pain Model
Combines acoustic strain telemetry and speech clinical entity extraction.
"""

from typing import Dict, Any, Optional
from ml.voice.acoustic_features import AcousticFeatureExtractor
from ml.voice.speech import SpeechEntityExtractor
from ml.voice.preprocessing import AudioPreprocessor

class VoicePainModel:
    """Integrated voice and acoustic analysis model."""

    def __init__(self):
        self.acoustic_extractor = AcousticFeatureExtractor()
        self.speech_extractor = SpeechEntityExtractor()
        self.preprocessor = AudioPreprocessor()

    def analyze(
        self,
        transcript: Optional[str] = None,
        acoustic_features: Optional[Dict[str, float]] = None,
        audio_snr_db: Optional[float] = None
    ) -> Dict[str, Any]:
        # 1. Linguistic Entity Extraction
        entities = self.speech_extractor.extract_entities(transcript)

        # 2. Acoustic Feature Extraction
        acoustics = self.acoustic_extractor.extract_features(acoustic_features)

        # 3. Environmental Quality & Confidence Calibration
        confidence = 0.88 if transcript and len(transcript.strip()) > 5 else 0.70
        snr_eval = self.preprocessor.estimate_snr_and_clarity()
        if audio_snr_db is not None:
            if audio_snr_db < 10.0:
                confidence -= 0.20

        # Construct comprehensive structured response
        return {
            "transcript": entities["transcript"],
            "extracted_location": entities["extracted_location"],
            "extracted_severity": entities["extracted_severity"],
            "extracted_duration": entities["extracted_duration"],
            "extracted_pain_type": entities["extracted_pain_type"],
            "extracted_symptoms": entities["extracted_symptoms"],
            "reported_medications": entities["reported_medications"],
            "reported_injuries": entities["reported_injuries"],
            "acoustic_strain_score": acoustics["vocal_strain_index"],
            "vocal_tremor_detected": acoustics["vocal_tremor_detected"],
            "acoustic_indicators": acoustics["acoustic_indicators"],
            "confidence": round(confidence, 2),
            "disclaimer": "Voice analysis provides supportive conversational and acoustic telemetry only — not a medical diagnosis."
        }
