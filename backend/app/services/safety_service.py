from typing import List, Dict, Any, Optional
from backend.app.config import settings

class SafetyAssessmentService:
    """
    Evaluates clinical red flags in reported symptoms and AI observations.
    CRITICAL: Does NOT diagnose medical conditions; identifies urgent risk indicators
    and safely triages user to appropriate human care pathways.

    Explicitly separates:
    - Reported Symptom (User input)
    - Safety Rule Triggered (Audit trail)
    - Matched User Text
    - Actionable Recommendation
    """

    CRITICAL_EMERGENCY_RULES = [
        {"rule_id": "RULE_CRITICAL_CHEST_PAIN", "keyword": "chest pain", "desc": "Acute chest pain or pressure"},
        {"rule_id": "RULE_CRITICAL_CHEST_PAIN", "keyword": "pressure in chest", "desc": "Acute chest pain or pressure"},
        {"rule_id": "RULE_RADIATING_PAIN", "keyword": "radiating to arm", "desc": "Discomfort radiating to upper extremity"},
        {"rule_id": "RULE_RESPIRATORY_DISTRESS", "keyword": "difficulty breathing", "desc": "Severe respiratory distress / dyspnea"},
        {"rule_id": "RULE_RESPIRATORY_DISTRESS", "keyword": "shortness of breath", "desc": "Severe respiratory distress / dyspnea"},
        {"rule_id": "RULE_SYNCOPE", "keyword": "loss of consciousness", "desc": "Sudden loss of consciousness or fainting"},
        {"rule_id": "RULE_STROKE_INDICATOR", "keyword": "facial drooping", "desc": "Unilateral facial weakness or drooping"},
        {"rule_id": "RULE_STROKE_INDICATOR", "keyword": "slurred speech", "desc": "Sudden onset speech disturbance"},
        {"rule_id": "RULE_THUNDERCLAP_HEADACHE", "keyword": "thunderclap headache", "desc": "Sudden peak-intensity cranial pain"},
        {"rule_id": "RULE_HEMORRHAGE", "keyword": "coughing blood", "desc": "Hemoptysis / acute hemorrhage"},
        {"rule_id": "RULE_ANAPHYLAXIS", "keyword": "throat swelling", "desc": "Airway compromise / severe allergic response"},
        {"rule_id": "RULE_ACUTE_ABDOMEN", "keyword": "unbearable abdominal pain", "desc": "Acute rigid abdomen"}
    ]

    URGENT_CONCERN_RULES = [
        {"rule_id": "RULE_HIGH_FEVER_MENINGEAL", "keyword": "stiff neck", "desc": "Nuchal rigidity / possible central infection"},
        {"rule_id": "RULE_HIGH_FEVER", "keyword": "high fever", "desc": "Significantly elevated body temperature"},
        {"rule_id": "RULE_DEHYDRATION_RISK", "keyword": "persistent vomiting", "desc": "Inability to maintain hydration"},
        {"rule_id": "RULE_NEUROPATHIC_SPREAD", "keyword": "numbness", "desc": "Paresthesia or spreading sensory loss"},
        {"rule_id": "RULE_VISUAL_DISTURBANCE", "keyword": "vision changes", "desc": "Sudden onset visual changes"}
    ]

    def evaluate_safety(
        self,
        reported_symptoms: List[str],
        pain_location: Optional[str] = None,
        severity_score: int = 0,
        ai_grimace_score: float = 0.0
    ) -> Dict[str, Any]:
        triggered_rules: List[str] = []
        matched_user_text: List[str] = []
        flagged_concerns: List[str] = []
        is_emergency = False
        is_urgent = False

        normalized_symptoms = [s.lower().strip() for s in reported_symptoms]
        loc_lower = (pain_location or "").lower().strip()

        # 1. Evaluate Critical Emergency Rules
        for r in self.CRITICAL_EMERGENCY_RULES:
            kw = r["keyword"]
            matching_syms = [s for s in normalized_symptoms if kw in s]
            if matching_syms or kw in loc_lower:
                triggered_rules.append(r["rule_id"])
                matched_user_text.extend(matching_syms if matching_syms else [f"Location: {loc_lower}"])
                flagged_concerns.append(f"Critical risk indicator noted: '{r['desc']}'")
                is_emergency = True

        # 2. Evaluate Severity Thresholds with Critical Anatomy
        if severity_score >= 8:
            if "chest" in loc_lower or "heart" in loc_lower:
                triggered_rules.append("RULE_SEVERE_THORACIC_PAIN")
                matched_user_text.append(f"Severity: {severity_score}/10 in {pain_location}")
                flagged_concerns.append("Severe acute thoracic / chest discomfort reported (Severity >= 8/10)")
                is_emergency = True
            elif "head" in loc_lower:
                triggered_rules.append("RULE_SEVERE_CRANIAL_PAIN")
                matched_user_text.append(f"Severity: {severity_score}/10 in {pain_location}")
                flagged_concerns.append("Severe sudden head pain reported (Severity >= 8/10)")
                is_urgent = True
            elif "abdomen" in loc_lower or "stomach" in loc_lower:
                triggered_rules.append("RULE_SEVERE_ABDOMINAL_PAIN")
                matched_user_text.append(f"Severity: {severity_score}/10 in {pain_location}")
                flagged_concerns.append("Severe acute abdominal pain reported (Severity >= 8/10)")
                is_urgent = True
            else:
                triggered_rules.append("RULE_HIGH_PAIN_SEVERITY")
                matched_user_text.append(f"Severity: {severity_score}/10")
                flagged_concerns.append(f"High pain severity reported ({severity_score}/10)")
                is_urgent = True

        # 3. Evaluate Urgent Concern Rules
        for r in self.URGENT_CONCERN_RULES:
            kw = r["keyword"]
            matching_syms = [s for s in normalized_symptoms if kw in s]
            if matching_syms:
                triggered_rules.append(r["rule_id"])
                matched_user_text.extend(matching_syms)
                flagged_concerns.append(f"Urgent clinical indicator noted: '{r['desc']}'")
                is_urgent = True

        # Deduplicate
        triggered_rules = list(dict.fromkeys(triggered_rules))
        matched_user_text = list(dict.fromkeys(matched_user_text))

        # Triage determination
        if is_emergency:
            triage_level = "emergency"
            recommended_action = "Seek immediate emergency medical attention (call local emergency dispatch or go to the nearest emergency department)."
            reason = "Reported symptoms contain one or more critical flags associated with time-sensitive acute conditions."
        elif is_urgent:
            triage_level = "urgent"
            recommended_action = "Contact a healthcare professional, urgent care center, or your primary doctor promptly."
            reason = "Reported indicators reflect acute distress or severe pain that warrants prompt clinical review."
        elif severity_score >= 5 or ai_grimace_score > 0.6:
            triage_level = "caution"
            recommended_action = "Monitor symptoms closely and consult a medical professional if pain persists or worsens."
            reason = "Moderate discomfort detected; practice comfort measures and consult a provider as needed."
        else:
            triage_level = "routine"
            recommended_action = "Record symptom changes and practice standard comfort measures; consult healthcare provider as needed."
            reason = "No acute red-flag symptoms detected in reported information."

        suggested_contacts = [
            {"label": "Local Emergency Services", "phone": "911 / 112 / local dispatch"},
            {"label": "Configured Emergency Line", "phone": settings.EMERGENCY_DISPATCH_PHONE},
            {"label": "Primary Doctor / Clinic", "phone": "Via Doctor Assistance"}
        ]

        return {
            "triage_level": triage_level,
            "is_emergency": is_emergency,
            "is_urgent": is_urgent,
            "triggered_rules": triggered_rules,
            "matched_user_text": matched_user_text,
            "flagged_concerns": flagged_concerns,
            "recommended_action": recommended_action,
            "reason": reason,
            "suggested_contacts": suggested_contacts,
            "disclaimer": (
                "AI-generated safety triage — not a medical diagnosis. "
                "The system identifies concerning symptom patterns to facilitate timely clinical handover. "
                "In case of life-threatening emergencies, always dial local emergency dispatch immediately."
            )
        }

safety_service = SafetyAssessmentService()
