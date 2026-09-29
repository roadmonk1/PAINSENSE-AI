from typing import List, Dict, Any, Optional

class SignLanguageRecognitionService:
    """
    Modular sign language recognition pipeline focused on pain & healthcare communication.
    Initial supported dialect: American Sign Language (ASL) core emergency vocabulary.
    Architecture supports adding regional dialects (BSL, ISL, LSF).
    """

    SUPPORTED_VOCABULARY = {
        "pain": {"concept": "Pain / Hurt", "category": "symptom"},
        "help": {"concept": "Request Assistance", "category": "action"},
        "doctor": {"concept": "Healthcare Professional", "category": "entity"},
        "emergency": {"concept": "Immediate Urgent Danger", "category": "urgency"},
        "yes": {"concept": "Affirmative", "category": "response"},
        "no": {"concept": "Negative", "category": "response"},
        "where": {"concept": "Location Query", "category": "query"},
        "severe": {"concept": "High Intensity", "category": "intensity"},
        "mild": {"concept": "Low Intensity", "category": "intensity"},
        "head": {"concept": "Head / Cranial", "category": "anatomy"},
        "chest": {"concept": "Chest / Thoracic", "category": "anatomy"},
        "stomach": {"concept": "Stomach / Abdominal", "category": "anatomy"},
        "back": {"concept": "Back / Spinal", "category": "anatomy"},
        "arm": {"concept": "Arm / Upper Extremity", "category": "anatomy"},
        "leg": {"concept": "Leg / Lower Extremity", "category": "anatomy"},
        "stop": {"concept": "Halt / Cease", "category": "action"},
        "more": {"concept": "Increasing", "category": "modifier"},
        "less": {"concept": "Decreasing", "category": "modifier"}
    }

    PHRASE_PATTERNS = [
        # (Pattern set, Template string, Suggested Action)
        ({"pain", "chest", "severe"}, "Severe chest pain", "urgent_attention"),
        ({"pain", "chest", "mild"}, "Mild chest pain", "monitor"),
        ({"pain", "head", "severe"}, "Severe head pain", "urgent_attention"),
        ({"pain", "head", "mild"}, "Mild headache", "comfort"),
        ({"pain", "stomach", "severe"}, "Severe stomach pain", "urgent_attention"),
        ({"pain", "stomach", "mild"}, "Mild stomach discomfort", "comfort"),
        ({"pain", "back", "severe"}, "Severe back pain", "assessment"),
        ({"pain", "back", "mild"}, "Mild back pain", "comfort"),
        ({"pain", "arm"}, "Arm pain reported", "assessment"),
        ({"pain", "leg"}, "Leg pain reported", "assessment"),
        ({"help", "emergency"}, "Emergency assistance requested immediately", "emergency"),
        ({"help", "doctor"}, "Requesting healthcare professional consultation", "call_doctor"),
        ({"doctor", "where"}, "Inquiring about healthcare provider location", "info"),
        ({"pain", "more"}, "Pain is increasing in intensity", "escalation"),
        ({"pain", "less"}, "Pain is decreasing", "improvement"),
        ({"pain", "stop"}, "Request to halt current movement or procedure", "pause"),
    ]

    def translate_sequence(self, signs: List[str], confidence_scores: Optional[List[float]] = None) -> Dict[str, Any]:
        normalized = [s.strip().lower() for s in signs if s.strip()]
        if not normalized:
            return {
                "recognized_signs": [],
                "confidence": 0.0,
                "translated_phrase": "No signs detected",
                "concept_breakdown": {},
                "two_way_response_text": "Please sign or select a concept to communicate.",
                "two_way_response_speech": "Please sign or select a concept to communicate."
            }

        # Calculate average confidence
        if confidence_scores and len(confidence_scores) > 0:
            avg_conf = round(sum(confidence_scores) / len(confidence_scores), 2)
        else:
            avg_conf = 0.88  # Heuristic confidence baseline for recognized patterns

        sign_set = set(normalized)
        matched_phrase = None
        action_hint = None

        # Check matched patterns
        for pattern, template, hint in self.PHRASE_PATTERNS:
            if pattern.issubset(sign_set):
                matched_phrase = template
                action_hint = hint
                break

        # Fallback compositional syntax
        if not matched_phrase:
            intensity = next((s.capitalize() for s in normalized if s in ["severe", "mild"]), "")
            location = next((s.capitalize() for s in normalized if s in ["chest", "head", "stomach", "back", "arm", "leg"]), "")
            is_pain = "pain" in normalized
            is_help = "help" in normalized

            parts = []
            if intensity:
                parts.append(intensity)
            if location:
                parts.append(location)
            if is_pain:
                parts.append("pain")
            elif is_help:
                parts.append("help request")
            else:
                parts.extend([s.capitalize() for s in normalized])

            matched_phrase = " ".join(parts) if parts else "Communicated sequence: " + ", ".join(normalized)

        concept_breakdown = {
            s: self.SUPPORTED_VOCABULARY.get(s, {}).get("concept", "Recognized Sign")
            for s in normalized
        }

        # Two-way accessible response formulation
        response_text = f"{matched_phrase} recorded."
        if action_hint == "emergency" or "severe chest" in matched_phrase.lower():
            response_text += " This may be urgent. Would you like us to contact emergency services or your doctor?"
        elif action_hint == "call_doctor" or "pain" in matched_phrase.lower():
            response_text += " Would you like to contact a healthcare professional or caregiver?"

        response_speech = response_text

        return {
            "recognized_signs": normalized,
            "confidence": avg_conf,
            "translated_phrase": matched_phrase,
            "concept_breakdown": concept_breakdown,
            "two_way_response_text": response_text,
            "two_way_response_speech": response_speech
        }

sign_service = SignLanguageRecognitionService()
