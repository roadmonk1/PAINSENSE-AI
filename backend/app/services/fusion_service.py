from typing import Dict, Any, List, Optional
from backend.app.schemas.schemas import (
    FacialAnalysisResult, BodyAnalysisResult, VoiceAnalysisResponse,
    SignRecognitionResponse, PainReportCreate, MultimodalFusionResponse
)
from backend.app.services.safety_service import safety_service

class MultimodalFusionService:
    """
    Multimodal Fusion Engine:
    Integrates facial expressions, somatic body posture, vocal acoustic strain,
    speech transcription, sign language translation, and self-reported pain.

    Key Principles:
    1. Distinguishes AI Observation from User Report.
    2. User's explicit report is NEVER discarded due to low vision confidence.
    3. Calculates explicit uncertainty metrics when modalities diverge.
    4. Never outputs a definitive clinical diagnosis.
    """

    def fuse(
        self,
        facial: Optional[FacialAnalysisResult] = None,
        body: Optional[BodyAnalysisResult] = None,
        voice: Optional[VoiceAnalysisResponse] = None,
        sign: Optional[SignRecognitionResponse] = None,
        self_report: Optional[PainReportCreate] = None,
        notes: Optional[str] = None
    ) -> MultimodalFusionResponse:
        observed_indicators: List[str] = []
        reported_symptoms: List[str] = []
        comm_methods: List[str] = []
        confidences: List[float] = []

        # 1. Process Vision (Face + Body)
        facial_severity_val = 0.0
        if facial:
            comm_methods.append("Camera (Facial Analysis)")
            confidences.append(facial.confidence)
            facial_severity_val = facial.grimace_score
            for ind in facial.observable_indicators:
                observed_indicators.append(f"[Facial Observation] {ind}")

        body_guarding_val = 0.0
        if body:
            if "Camera (Facial Analysis)" not in comm_methods:
                comm_methods.append("Camera (Body Posture)")
            confidences.append(body.confidence)
            body_guarding_val = body.postural_guarding
            for ind in body.observable_indicators:
                observed_indicators.append(f"[Body Observation] {ind}")

        # 2. Process Voice & Acoustic
        voice_severity_val = 0.0
        if voice:
            comm_methods.append("Voice Analysis & Speech")
            confidences.append(voice.confidence)
            voice_severity_val = voice.acoustic_strain_score
            if voice.vocal_tremor_detected:
                observed_indicators.append("[Acoustic Observation] Elevated vocal tremor / strain detected")
            if voice.extracted_location and voice.extracted_location != "Unspecified":
                reported_symptoms.append(f"[Speech] Location: {voice.extracted_location}")
            if voice.extracted_severity:
                reported_symptoms.append(f"[Speech] Severity statement: {voice.extracted_severity}")
            if voice.extracted_duration and voice.extracted_duration != "Recent":
                reported_symptoms.append(f"[Speech] Duration: {voice.extracted_duration}")
            for sym in voice.extracted_symptoms:
                reported_symptoms.append(f"[Speech Symptom] {sym}")

        # 3. Process Sign Language
        sign_severity_val = 0.0
        if sign and sign.recognized_signs:
            comm_methods.append("Sign Language Recognition")
            confidences.append(sign.confidence)
            reported_symptoms.append(f"[Sign Language] Communicated: '{sign.translated_phrase}'")
            if any(s in ["severe", "emergency", "help"] for s in sign.recognized_signs):
                sign_severity_val = 0.8
            elif any(s in ["mild", "less"] for s in sign.recognized_signs):
                sign_severity_val = 0.3
            else:
                sign_severity_val = 0.5

        # 4. Process Self-Reported Pain (Patient's Ground Truth Voice)
        reported_numeric_severity = 0
        reported_location = "Unspecified"
        if self_report:
            comm_methods.append("Self-Reported Assessment")
            confidences.append(0.98)  # High confidence in patient direct subjective report
            reported_numeric_severity = self_report.severity_score
            reported_location = self_report.pain_location
            reported_symptoms.append(f"[Self-Report] Location: {self_report.pain_location}")
            reported_symptoms.append(f"[Self-Report] Severity: {self_report.severity_score}/10")
            reported_symptoms.append(f"[Self-Report] Character: {self_report.pain_type}")
            reported_symptoms.append(f"[Self-Report] Duration: {self_report.duration} (Onset: {self_report.onset})")
            for sym in self_report.additional_symptoms:
                reported_symptoms.append(f"[Self-Report Symptom] {sym}")
            if self_report.free_text:
                reported_symptoms.append(f"[Patient Note] \"{self_report.free_text}\"")

        # 5. Multimodal Severity Fusion
        # Normalized reported severity (0 to 1)
        user_reported_norm = reported_numeric_severity / 10.0 if self_report else (sign_severity_val or 0.0)

        # AI observed composite (0 to 1)
        ai_obs_components = []
        if facial:
            ai_obs_components.append(facial_severity_val)
        if body:
            ai_obs_components.append(body_guarding_val)
        if voice:
            ai_obs_components.append(voice_severity_val)

        ai_observed_norm = sum(ai_obs_components) / len(ai_obs_components) if ai_obs_components else user_reported_norm

        # Fusion weighting: Prioritize direct patient reporting (70%) over passive AI observation (30%)
        # This guarantees user reports are never erased by quiet facial expression.
        if self_report or sign:
            final_severity_val = (user_reported_norm * 0.70) + (ai_observed_norm * 0.30)
        else:
            final_severity_val = ai_observed_norm

        # Compute Divergence / Uncertainty
        divergence = abs(user_reported_norm - ai_observed_norm) if (self_report and ai_obs_components) else 0.15
        uncertainty = round(min(1.0, max(0.05, divergence * 0.7 + (1.0 - (sum(confidences)/len(confidences) if confidences else 0.5)) * 0.3)), 2)

        # Map to discrete severity label
        if final_severity_val >= 0.70 or reported_numeric_severity >= 7:
            severity_label = "severe"
        elif final_severity_val >= 0.40 or reported_numeric_severity >= 4:
            severity_label = "moderate"
        elif final_severity_val >= 0.15 or reported_numeric_severity >= 1:
            severity_label = "mild"
        else:
            severity_label = "none"

        # 6. Safety Triage & Red Flag Evaluation
        all_symptoms_for_safety = [s for s in reported_symptoms]
        if notes:
            all_symptoms_for_safety.append(notes)

        safety_eval = safety_service.evaluate_safety(
            reported_symptoms=all_symptoms_for_safety,
            pain_location=reported_location,
            severity_score=reported_numeric_severity,
            ai_grimace_score=facial_severity_val
        )

        overall_conf = round(sum(confidences) / len(confidences), 2) if confidences else 0.75

        # 7. Construct Summary Description
        if not comm_methods:
            comm_methods = ["Initial Multi-Channel Check"]

        summary = (
            f"Assessment completed across {len(comm_methods)} modality channel(s): {', '.join(comm_methods)}. "
            f"Overall perceived severity: {severity_label.capitalize()} (Uncertainty: {int(uncertainty*100)}%). "
            f"{safety_eval['recommended_action']}"
        )

        return MultimodalFusionResponse(
            assessment_id=None,
            observed_indicators=observed_indicators if observed_indicators else ["No marked tension or distress patterns observed."],
            reported_symptoms=reported_symptoms if reported_symptoms else ["No specific symptoms reported."],
            severity=severity_label,
            confidence=overall_conf,
            communication_methods=comm_methods,
            uncertainty=uncertainty,
            triage_level=safety_eval["triage_level"],
            recommended_next_step=safety_eval["recommended_action"],
            summary_text=summary,
            is_emergency=safety_eval["is_emergency"],
            disclaimer="AI-generated assessment — not a medical diagnosis. A qualified healthcare professional must evaluate medical conditions."
        )

fusion_service = MultimodalFusionService()
