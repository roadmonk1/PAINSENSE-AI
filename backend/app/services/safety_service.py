from typing import List, Dict, Any, Optional
from backend.app.config import settings

class SafetyAssessmentService:
    """
    Evaluates clinical red flags in reported symptoms and AI observations.
    CRITICAL: Does NOT diagnose medical conditions; identifies urgent risk indicators
    and safely triages user to appropriate human care pathways.
    """

    CRITICAL_EMERGENCY_KEYWORDS = [
        "chest pain", "pressure in chest", "radiating to arm", "difficulty breathing",
        "shortness of breath", "loss of consciousness", "sudden weakness", "facial drooping",
        "slurred speech", "thunderclap headache", "coughing blood", "severe allergic reaction",
        "throat swelling", "unbearable abdominal pain", "vomiting blood"
    ]

    URGENT_CONCERN_KEYWORDS = [
        "high fever", "stiff neck", "persistent vomiting", "inability to keep fluids down",
        "spreading rash", "numbness", "tingling", "severe burn", "deep laceration",
        "uncontrolled bleeding", "vision changes"
    ]

    def evaluate_safety(
        self,
        reported_symptoms: List[str],
        pain_location: Optional[str] = None,
        severity_score: int = 0,
        ai_grimace_score: float = 0.0
    ) -> Dict[str, Any]:
        flagged_concerns = []
        is_emergency = False
        is_urgent = False

        normalized_symptoms = [s.lower().strip() for s in reported_symptoms]
        loc_lower = (pain_location or "").lower().strip()

        # Check emergency keywords
        for keyword in self.CRITICAL_EMERGENCY_KEYWORDS:
            if any(keyword in s for s in normalized_symptoms) or keyword in loc_lower:
                flagged_concerns.append(f"Potential critical symptom detected: '{keyword}'")
                is_emergency = True

        # High severity with sensitive locations
        if severity_score >= 8:
            if "chest" in loc_lower or "heart" in loc_lower:
                flagged_concerns.append("Severe acute chest discomfort reported (Severity >= 8/10)")
                is_emergency = True
            elif "head" in loc_lower:
                flagged_concerns.append("Severe sudden head pain reported (Severity >= 8/10)")
                is_urgent = True
            elif "abdomen" in loc_lower or "stomach" in loc_lower:
                flagged_concerns.append("Severe acute abdominal pain reported (Severity >= 8/10)")
                is_urgent = True
            else:
                flagged_concerns.append(f"High pain severity reported ({severity_score}/10)")
                is_urgent = True

        # Check urgent keywords
        for keyword in self.URGENT_CONCERN_KEYWORDS:
            if any(keyword in s for s in normalized_symptoms):
                flagged_concerns.append(f"Urgent clinical indicator noted: '{keyword}'")
                is_urgent = True

        # Triage determination
        if is_emergency:
            triage_level = "emergency"
            recommended_action = "Seek immediate emergency medical attention (call local emergency dispatch or go to the nearest emergency department)."
        elif is_urgent:
            triage_level = "urgent"
            recommended_action = "Contact a healthcare professional, urgent care center, or your primary doctor promptly."
        elif severity_score >= 5 or ai_grimace_score > 0.6:
            triage_level = "caution"
            recommended_action = "Monitor symptoms closely and consult a medical professional if pain persists or worsens."
        else:
            triage_level = "routine"
            recommended_action = "Record symptom changes and practice standard comfort measures; consult healthcare provider as needed."

        suggested_contacts = [
            {"label": "Local Emergency Services", "phone": "911 / 112 / local dispatch"},
            {"label": "Configured Emergency Line", "phone": settings.EMERGENCY_DISPATCH_PHONE},
            {"label": "Primary Doctor / Clinic", "phone": "Via Doctor Assistance"}
        ]

        return {
            "triage_level": triage_level,
            "is_emergency": is_emergency,
            "is_urgent": is_urgent,
            "flagged_concerns": flagged_concerns,
            "recommended_action": recommended_action,
            "suggested_contacts": suggested_contacts,
            "disclaimer": "AI-generated safety triage — not a medical diagnosis. In case of life-threatening emergencies, always dial local emergency services immediately."
        }

safety_service = SafetyAssessmentService()
