"""
PAINSENSE-AI Spoken Clinical Entity Extractor
Decouples spoken linguistic semantic extraction from raw acoustic telemetry.
"""

from typing import Dict, Any, List, Optional
import re

class SpeechEntityExtractor:
    """Extracts structured clinical entities from natural spoken text narratives."""

    BODY_LOCATIONS = [
        "lower back", "upper back", "back", "chest", "head", "neck", "shoulder",
        "stomach", "abdomen", "hip", "knee", "leg", "arm", "wrist", "ankle",
        "throat", "jaw", "groin", "flank", "pelvis"
    ]

    SEVERITY_MAPPINGS = {
        "unbearable": "Severe (10/10)",
        "extreme": "Severe (9/10)",
        "severe": "Severe (8/10)",
        "intense": "Severe (7-8/10)",
        "bad": "Moderate (5-6/10)",
        "moderate": "Moderate (5/10)",
        "mild": "Mild (2-3/10)",
        "slight": "Mild (1-2/10)",
        "little": "Mild (2/10)"
    }

    PAIN_TYPES = ["sharp", "dull", "burning", "throbbing", "stabbing", "aching", "cramping", "pressure", "radiating"]

    DURATION_PATTERNS = [
        r"since\s+(this\s+morning|yesterday|last\s+night|[0-9]+\s+(?:hours|days|weeks|months))",
        r"for\s+([0-9]+\s+(?:minutes|hours|days|weeks|months))",
        r"(all\s+day|just\s+now|an\s+hour\s+ago|past\s+[0-9]+\s+(?:hours|days))"
    ]

    SYMPTOMS_LIST = [
        "shortness of breath", "difficulty breathing", "nausea", "vomiting", "dizziness",
        "lightheadedness", "fever", "chills", "numbness", "tingling", "fatigue",
        "sweating", "stiffness", "swelling"
    ]

    MEDICATION_KEYWORDS = ["ibuprofen", "paracetamol", "acetaminophen", "aspirin", "inhaler", "nitroglycerin", "painkiller"]

    INJURY_KEYWORDS = ["fall", "fell", "car accident", "lifting", "twisted", "hit", "injury", "trauma"]

    @classmethod
    def extract_entities(cls, transcript: Optional[str] = None) -> Dict[str, Any]:
        text = (transcript or "").strip()
        text_lower = text.lower()

        # Location
        location = "Unspecified"
        for loc in cls.BODY_LOCATIONS:
            if re.search(r'\b' + re.escape(loc) + r'\b', text_lower):
                location = loc.title()
                break

        # Severity
        severity = "Moderate"
        for word, sev in cls.SEVERITY_MAPPINGS.items():
            if re.search(r'\b' + re.escape(word) + r'\b', text_lower):
                severity = sev
                break

        # Duration
        duration = "Recent"
        for pat in cls.DURATION_PATTERNS:
            match = re.search(pat, text_lower)
            if match:
                duration = match.group(0).strip().capitalize()
                break

        # Pain Type
        pain_type = "Aching"
        for pt in cls.PAIN_TYPES:
            if re.search(r'\b' + re.escape(pt) + r'\b', text_lower):
                pain_type = pt.capitalize()
                break

        # Associated Symptoms
        extracted_symptoms = []
        for sym in cls.SYMPTOMS_LIST:
            if re.search(r'\b' + re.escape(sym) + r'\b', text_lower):
                extracted_symptoms.append(sym.title())

        # Reported Medication
        reported_medications = []
        for med in cls.MEDICATION_KEYWORDS:
            if re.search(r'\b' + re.escape(med) + r'\b', text_lower):
                reported_medications.append(med.capitalize())

        # Reported Injury Trigger
        reported_injuries = []
        for inj in cls.INJURY_KEYWORDS:
            if re.search(r'\b' + re.escape(inj) + r'\b', text_lower):
                reported_injuries.append(inj.capitalize())

        return {
            "transcript": text if text else "No spoken statement provided.",
            "extracted_location": location,
            "extracted_severity": severity,
            "extracted_duration": duration,
            "extracted_pain_type": pain_type,
            "extracted_symptoms": extracted_symptoms,
            "reported_medications": reported_medications,
            "reported_injuries": reported_injuries
        }
