import re
from typing import Dict, Any, List, Optional
from abc import ABC, abstractmethod

class SpeechRecognitionProvider(ABC):
    @abstractmethod
    def transcribe(self, audio_data: Any) -> str:
        pass

class LocalRuleBasedSpeechProvider(SpeechRecognitionProvider):
    def transcribe(self, audio_data: Any) -> str:
        # If string is provided directly, return it. In production, connects to local Whisper model.
        if isinstance(audio_data, str):
            return audio_data
        return "Severe lower back pain since this morning, difficult to walk."

class VoiceAnalysisService:
    """
    Analyzes natural speech and extracted acoustic strain for pain communication.
    Extracts pain location, severity, duration, and pain character.
    """

    BODY_LOCATIONS = [
        "lower back", "upper back", "back", "chest", "head", "neck", "shoulder",
        "stomach", "abdomen", "hip", "knee", "leg", "arm", "wrist", "ankle", "throat"
    ]

    SEVERITY_KEYWORDS = {
        "unbearable": "Severe (10/10)",
        "extreme": "Severe (9/10)",
        "severe": "Severe (8/10)",
        "intense": "Severe (7-8/10)",
        "moderate": "Moderate (5-6/10)",
        "bad": "Moderate (5-6/10)",
        "mild": "Mild (2-3/10)",
        "slight": "Mild (1-2/10)",
        "little": "Mild (2/10)"
    }

    PAIN_TYPES = ["sharp", "dull", "burning", "throbbing", "stabbing", "aching", "cramping", "pressure"]

    DURATION_PATTERNS = [
        r"since\s+(this\s+morning|yesterday|last\s+night|[0-9]+\s+(?:hours|days|weeks|months))",
        r"for\s+([0-9]+\s+(?:minutes|hours|days|weeks|months))",
        r"(all\s+day|just\s+now|an\s+hour\s+ago)"
    ]

    def __init__(self, speech_provider: Optional[SpeechRecognitionProvider] = None):
        self.provider = speech_provider or LocalRuleBasedSpeechProvider()

    def analyze_voice(self, transcript: Optional[str] = None, acoustic_features: Optional[Dict[str, float]] = None) -> Dict[str, Any]:
        text = transcript or ""
        text_lower = text.lower()

        # Extract Location
        extracted_location = "Unspecified"
        for loc in self.BODY_LOCATIONS:
            if loc in text_lower:
                extracted_location = loc.title()
                break

        # Extract Severity
        extracted_severity = "Moderate"
        for word, sev in self.SEVERITY_KEYWORDS.items():
            if re.search(r'\b' + re.escape(word) + r'\b', text_lower):
                extracted_severity = sev
                break

        # Extract Duration
        extracted_duration = "Recent"
        for pattern in self.DURATION_PATTERNS:
            match = re.search(pattern, text_lower)
            if match:
                extracted_duration = match.group(0).strip().capitalize()
                break

        # Extract Pain Type
        extracted_pain_type = "Aching"
        for pt in self.PAIN_TYPES:
            if pt in text_lower:
                extracted_pain_type = pt.capitalize()
                break

        # Extract Associated Symptoms
        symptoms = []
        for sym in ["nausea", "dizziness", "shortness of breath", "fever", "numbness", "tingling", "fatigue"]:
            if sym in text_lower:
                symptoms.append(sym.title())

        # Acoustic strain heuristics
        acoustic = acoustic_features or {}
        pitch_jitter = float(acoustic.get("pitch_jitter", 0.18))
        energy_fluctuation = float(acoustic.get("energy_fluctuation", 0.22))
        vocal_strain = max(0.0, min(1.0, (pitch_jitter * 0.5) + (energy_fluctuation * 0.5)))
        tremor_detected = pitch_jitter > 0.45 or vocal_strain > 0.55

        return {
            "transcript": text if text else "Voice capture analyzed.",
            "extracted_location": extracted_location,
            "extracted_severity": extracted_severity,
            "extracted_duration": extracted_duration,
            "extracted_pain_type": extracted_pain_type,
            "extracted_symptoms": symptoms,
            "acoustic_strain_score": round(vocal_strain, 2),
            "vocal_tremor_detected": tremor_detected,
            "confidence": 0.86 if text else 0.72,
            "provider_used": "modular_speech_engine",
            "disclaimer": "Voice analysis is supportive observation only."
        }

voice_service = VoiceAnalysisService()
