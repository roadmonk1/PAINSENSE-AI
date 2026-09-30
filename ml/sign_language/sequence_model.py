"""
PAINSENSE-AI Sequence Model & Phrase Assembler
Translates temporal sign sequences into natural clinical phrases
using selected SignLanguageProfile (ASL / ISL).
"""

from typing import List, Dict, Any, Optional
from ml.sign_language.profiles import get_profile, SignLanguageProfile
from ml.sign_language.temporal_buffer import TemporalGestureBuffer

class SignSequenceAssembler:
    """Assembles temporal sign tokens into natural language statements using dialect profiles."""

    @staticmethod
    def assemble_phrase(
        tokens: List[str],
        language_code: str = "asl",
        confidence_scores: Optional[List[float]] = None
    ) -> Dict[str, Any]:
        profile = get_profile(language_code)
        normalized = [t.lower().strip() for t in tokens if t.strip()]

        if not normalized:
            return {
                "language_code": profile.language_code,
                "language_name": profile.language_name,
                "recognized_signs": [],
                "confidence": 0.0,
                "translated_phrase": "No active gesture",
                "two_way_response_text": "Please sign or select a concept to communicate.",
                "two_way_response_speech": "Please sign or select a concept to communicate.",
                "action_hint": "none"
            }

        avg_conf = round(sum(confidence_scores) / len(confidence_scores), 2) if confidence_scores else 0.88
        sign_set = set(normalized)
        matched_phrase = None
        action_hint = "routine"

        # Check matched phrase patterns defined specifically for this language profile
        for pattern_set, template, hint in profile.phrase_patterns:
            if pattern_set.issubset(sign_set):
                matched_phrase = template
                action_hint = hint
                break

        # Fallback compositional syntax respecting profile vocabulary
        if not matched_phrase:
            parts = []
            for t in normalized:
                defn = profile.vocabulary.get(t)
                if defn:
                    parts.append(defn.concept)
                else:
                    parts.append(t.capitalize())
            matched_phrase = " + ".join(parts)

        # Formulate two-way accessible text and audio prompt
        if action_hint == "emergency" or "chest" in normalized and "severe" in normalized:
            response_text = f"{matched_phrase} recorded. This may be urgent. Would you like us to contact emergency services or your doctor?"
        elif action_hint == "call_doctor" or "pain" in normalized:
            response_text = f"{matched_phrase} recorded. Would you like to consult a healthcare professional or contact your caregiver?"
        else:
            response_text = f"{matched_phrase} recorded."

        return {
            "language_code": profile.language_code,
            "language_name": profile.language_name,
            "region": profile.region,
            "recognized_signs": normalized,
            "confidence": avg_conf,
            "translated_phrase": matched_phrase,
            "two_way_response_text": response_text,
            "two_way_response_speech": response_text,
            "action_hint": action_hint
        }
