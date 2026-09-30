from typing import List, Dict, Any, Optional
from ml.sign_language.profiles import get_profile, SUPPORTED_PROFILES
from ml.sign_language.sequence_model import SignSequenceAssembler

class SignLanguageRecognitionService:
    """
    Multi-language sign communication service supporting distinct profiles:
    - American Sign Language (ASL)
    - Indian Sign Language (ISL)
    Architecture explicitly avoids conflating distinct regional sign languages.
    """

    def translate_sequence(
        self,
        signs: List[str],
        confidence_scores: Optional[List[float]] = None,
        language_code: str = "asl",
        language: Optional[str] = None
    ) -> Dict[str, Any]:
        target_lang = language or language_code or "asl"
        result = SignSequenceAssembler.assemble_phrase(
            tokens=signs,
            language_code=target_lang,
            confidence_scores=confidence_scores
        )

        profile = get_profile(target_lang)
        concept_breakdown = {}
        for s in result["recognized_signs"]:
            item = profile.vocabulary.get(s)
            concept_breakdown[s] = item.concept if item else s.capitalize()

        result["concept_breakdown"] = concept_breakdown
        result["language"] = target_lang
        result["language_code"] = target_lang
        return result

    def get_vocabulary(self, language: str = "asl", language_code: Optional[str] = None) -> List[Dict[str, Any]]:
        target_lang = language_code or language or "asl"
        profile = get_profile(target_lang)
        return [
            {
                "token": k,
                "concept": v.concept,
                "category": v.category,
                "handshape": v.handshape,
                "movement_description": v.movement_description,
                "one_handed": v.one_handed
            }
            for k, v in profile.vocabulary.items()
        ]

    def get_supported_vocabulary(self, language_code: str = "asl", language: Optional[str] = None) -> Dict[str, Any]:
        target_lang = language or language_code or "asl"
        profile = get_profile(target_lang)
        vocab_dict = {
            k: {
                "concept": v.concept,
                "category": v.category,
                "handshape": v.handshape,
                "movement": v.movement_description,
                "one_handed": v.one_handed
            }
            for k, v in profile.vocabulary.items()
        }

        sample_seqs = []
        for pat, phrase, hint in profile.phrase_patterns[:5]:
            sample_seqs.append({"sequence": list(pat), "meaning": phrase, "urgency": hint})

        return {
            "language_code": profile.language_code,
            "language_name": profile.language_name,
            "region": profile.region,
            "cultural_context": profile.cultural_context,
            "version": profile.version,
            "vocabulary": vocab_dict,
            "sample_sequences": sample_seqs,
            "available_profiles": list(SUPPORTED_PROFILES.keys())
        }

sign_service = SignLanguageRecognitionService()
