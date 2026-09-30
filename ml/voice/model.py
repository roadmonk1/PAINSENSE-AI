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

    def validate_input(
        self,
        transcript: Optional[str] = None,
        audio_snr_db: Optional[float] = None,
        audio_duration_sec: Optional[float] = None
    ) -> Dict[str, Any]:
        """Validates acoustic quality: duration threshold, SNR, and transcript presence."""
        warnings = []
        is_valid = True

        if audio_duration_sec is not None and audio_duration_sec < 0.5:
            is_valid = False
            warnings.append("Audio duration is less than 0.5s minimum required threshold.")

        if audio_snr_db is not None and audio_snr_db < 10.0:
            warnings.append(f"High background noise detected (SNR: {audio_snr_db:.1f} dB < 10 dB). Acoustic precision degraded.")

        if not transcript or len(transcript.strip()) == 0:
            warnings.append("No spoken transcript provided; evaluating acoustic features alone.")

        return {
            "is_valid": is_valid,
            "warnings": warnings,
            "status": "valid" if is_valid else "insufficient_duration"
        }

    def preprocess(
        self,
        transcript: Optional[str] = None,
        audio_snr_db: Optional[float] = None,
        audio_duration_sec: Optional[float] = None
    ) -> Dict[str, Any]:
        """Preprocesses audio metadata and extracts quality metrics."""
        val = self.validate_input(transcript=transcript, audio_snr_db=audio_snr_db, audio_duration_sec=audio_duration_sec)
        clean_text = transcript.strip() if transcript else ""
        return {
            "validation": val,
            "cleaned_transcript": clean_text
        }

    def extract_acoustic_features(self, acoustic_features: Optional[Dict[str, float]] = None) -> Dict[str, Any]:
        """Extracts acoustic biomarkers: pitch variability, jitter, shimmer, tremor, and strain."""
        return self.acoustic_extractor.extract_features(acoustic_features)

    def extract_entities(self, transcript: Optional[str] = None) -> Dict[str, Any]:
        """Extracts clinical pain entities (location, severity, duration, character) from speech."""
        return self.speech_extractor.extract_entities(transcript)

    def confidence(self, transcript: str, audio_snr_db: Optional[float] = None) -> float:
        """Calibrates confidence score based on linguistic clarity and acoustic signal-to-noise ratio."""
        conf = 0.88 if transcript and len(transcript.strip()) > 5 else 0.70
        if audio_snr_db is not None and audio_snr_db < 10.0:
            conf -= 0.20
        return max(0.25, min(0.95, round(conf, 2)))

    def explain(self, prediction_result: Dict[str, Any]) -> Dict[str, Any]:
        """Generates clinical explainability breakdown separating speech content from acoustic strain."""
        strain = prediction_result.get("acoustic_strain_score", 0.0)
        loc = prediction_result.get("extracted_location", "Unspecified")
        sev = prediction_result.get("extracted_severity", "Unspecified")
        tremor = prediction_result.get("vocal_tremor_detected", False)

        speech_summary = f"Spoken content reported {sev} distress in {loc}."
        acoustic_summary = f"Acoustic strain index: {strain}/1.0 ({'Tremor detected' if tremor else 'Stable vocal tone'})."

        return {
            "speech_content_summary": speech_summary,
            "acoustic_strain_summary": acoustic_summary,
            "provenance": "USER REPORT (Speech Transcript) + ALGORITHMIC SIGNAL (Acoustics)",
            "explanation_text": f"{speech_summary} {acoustic_summary} Note: Vocal strain is supportive telemetry only."
        }

    def predict(
        self,
        transcript: Optional[str] = None,
        acoustic_features: Optional[Dict[str, float]] = None,
        audio_snr_db: Optional[float] = None,
        audio_duration_sec: Optional[float] = None
    ) -> Dict[str, Any]:
        """Runs integrated voice and acoustic analysis."""
        preproc = self.preprocess(transcript=transcript, audio_snr_db=audio_snr_db, audio_duration_sec=audio_duration_sec)
        val = preproc["validation"]
        if not val["is_valid"]:
            return {
                "transcript": transcript or "",
                "extracted_location": "Unspecified",
                "extracted_severity": "Unspecified",
                "extracted_duration": "Unspecified",
                "extracted_pain_type": "Unspecified",
                "extracted_symptoms": [],
                "reported_medications": [],
                "reported_injuries": [],
                "acoustic_strain_score": 0.0,
                "vocal_tremor_detected": False,
                "acoustic_indicators": ["Audio sample duration too short (<0.5s)"],
                "confidence": 0.0,
                "quality_warnings": val["warnings"],
                "provenance": "VALIDATION REJECTION",
                "disclaimer": "Insufficient audio duration for valid acoustic analysis."
            }

        entities = self.extract_entities(preproc["cleaned_transcript"])
        acoustics = self.extract_acoustic_features(acoustic_features)
        conf = self.confidence(preproc["cleaned_transcript"], audio_snr_db=audio_snr_db)

        result = {
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
            "confidence": conf,
            "quality_warnings": val["warnings"],
            "provenance": "USER REPORT (Transcript) + ALGORITHMIC SIGNAL (Acoustics)",
            "disclaimer": "Voice analysis provides supportive conversational and acoustic telemetry only — not a medical diagnosis."
        }
        result["explanation"] = self.explain(result)
        return result

    def analyze(
        self,
        transcript: Optional[str] = None,
        acoustic_features: Optional[Dict[str, float]] = None,
        audio_snr_db: Optional[float] = None
    ) -> Dict[str, Any]:
        """Backward-compatible alias for predict()."""
        return self.predict(transcript=transcript, acoustic_features=acoustic_features, audio_snr_db=audio_snr_db)

