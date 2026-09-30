from typing import Dict, Any, List, Optional
from backend.app.schemas.schemas import (
    FacialAnalysisResult, BodyAnalysisResult, VoiceAnalysisResponse,
    SignRecognitionResponse, PainReportCreate, MultimodalFusionResponse,
    FusionExplanation
)
from backend.app.services.safety_service import safety_service

class MultimodalFusionService:
    """
    Multimodal Fusion & Explainable Evidential Reasoning Engine:
    Integrates facial expressions, somatic body posture, vocal acoustic strain,
    speech transcription, sign language translation, and self-reported pain.

    Key Principles:
    1. Distinguishes USER REPORT (Ground Truth) from AI OBSERVATION (Supportive).
    2. User's explicit report is NEVER discarded due to low vision confidence.
    3. Calculates explicit uncertainty metrics when modalities diverge.
    4. Provides transparent Explainable AI (FusionExplanation).
    5. Never outputs a definitive clinical diagnosis.
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
        primary_evidence: List[str] = []
        supporting_evidence: List[str] = []
        conflicting_evidence: List[str] = []
        missing_evidence: List[str] = []
        observed_indicators: List[str] = []
        reported_symptoms: List[str] = []
        comm_methods: List[str] = []
        confidences: List[float] = []

        # 1. Self-Report (Patient Ground Truth - Primary Evidence)
        reported_numeric_severity = 0
        reported_location = "Unspecified"
        if self_report:
            comm_methods.append("Self-Reported Assessment")
            confidences.append(0.95)
            reported_numeric_severity = self_report.severity_score
            reported_location = self_report.pain_location

            report_item = f"User reported {self_report.severity_score}/10 pain in {self_report.pain_location} ({self_report.pain_type}, {self_report.duration})"
            primary_evidence.append(report_item)
            reported_symptoms.append(f"[Self-Report] Location: {self_report.pain_location}")
            reported_symptoms.append(f"[Self-Report] Severity: {self_report.severity_score}/10")
            reported_symptoms.append(f"[Self-Report] Character: {self_report.pain_type}")
            reported_symptoms.append(f"[Self-Report] Duration: {self_report.duration} (Onset: {self_report.onset})")

            for sym in self_report.additional_symptoms:
                primary_evidence.append(f"Reported symptom: {sym}")
                reported_symptoms.append(f"[Self-Report Symptom] {sym}")

            if self_report.free_text:
                reported_symptoms.append(f"[Patient Note] \"{self_report.free_text}\"")
        else:
            missing_evidence.append("Direct numeric self-report form was not filled.")

        # 2. Sign Language (Direct Patient Linguistic Communication - Primary Evidence)
        sign_severity_val = 0.0
        if sign and sign.recognized_signs:
            comm_methods.append(f"Sign Language Recognition ({sign.language_name or 'ASL'})")
            confidences.append(sign.confidence)
            primary_evidence.append(f"Patient communicated via sign language: '{sign.translated_phrase}'")
            reported_symptoms.append(f"[Sign Language] Communicated: '{sign.translated_phrase}'")

            if any(s in ["severe", "emergency", "help"] for s in sign.recognized_signs):
                sign_severity_val = 0.8
            elif any(s in ["mild", "less"] for s in sign.recognized_signs):
                sign_severity_val = 0.3
            else:
                sign_severity_val = 0.5
        else:
            missing_evidence.append("Sign language channel inactive / no gestures detected.")

        # 3. Vision Telemetry (Optical Face + Body - Supportive Evidence)
        facial_severity_val = 0.0
        if facial:
            comm_methods.append("Camera (Facial Analysis)")
            confidences.append(facial.confidence)
            facial_severity_val = facial.grimace_score

            for ind in facial.observable_indicators:
                observed_indicators.append(f"[Facial Observation] {ind}")

            if facial.grimace_score > 0.40:
                supporting_evidence.append(f"Facial action units indicated marked tension (AU4/AU7 score: {facial.grimace_score})")
            elif self_report and self_report.severity_score >= 7 and facial.grimace_score < 0.25:
                conflicting_evidence.append(
                    f"Low facial tension (score: {facial.grimace_score}) despite high self-reported pain ({self_report.severity_score}/10). "
                    "System retained user's explicit report without lowering severity."
                )

        body_guarding_val = 0.0
        if body:
            if "Camera (Facial Analysis)" not in comm_methods:
                comm_methods.append("Camera (Body Posture)")
            confidences.append(body.confidence)
            body_guarding_val = body.postural_guarding

            for ind in body.observable_indicators:
                observed_indicators.append(f"[Body Observation] {ind}")

            if body.protective_posture_detected:
                supporting_evidence.append("Protective somatic guarding posture observed on camera.")

        if not facial and not body:
            missing_evidence.append("Optical camera telemetry was not enabled.")

        # 4. Voice Telemetry (Acoustic + Spoken NLP - Supportive / Communicative)
        voice_severity_val = 0.0
        if voice:
            comm_methods.append("Voice Analysis & Speech")
            confidences.append(voice.confidence)
            voice_severity_val = voice.acoustic_strain_score

            if voice.vocal_tremor_detected:
                supporting_evidence.append("Elevated acoustic vocal tremor / strain detected during phonation.")
                observed_indicators.append("[Acoustic Observation] Elevated vocal tremor / strain detected")

            if voice.extracted_location and voice.extracted_location != "Unspecified":
                reported_symptoms.append(f"[Speech] Location: {voice.extracted_location}")
            if voice.extracted_severity:
                reported_symptoms.append(f"[Speech] Severity statement: {voice.extracted_severity}")
            if voice.extracted_duration and voice.extracted_duration != "Recent":
                reported_symptoms.append(f"[Speech] Duration: {voice.extracted_duration}")
            for sym in voice.extracted_symptoms:
                reported_symptoms.append(f"[Speech Symptom] {sym}")
        else:
            missing_evidence.append("Voice recording channel was not used.")

        # 5. Evidential Reasoning & Severity Determination
        user_reported_norm = reported_numeric_severity / 10.0 if self_report else (sign_severity_val or 0.0)

        ai_obs_components = []
        if facial: ai_obs_components.append(facial_severity_val)
        if body: ai_obs_components.append(body_guarding_val)
        if voice: ai_obs_components.append(voice_severity_val)

        ai_observed_norm = sum(ai_obs_components) / len(ai_obs_components) if ai_obs_components else user_reported_norm

        # Evidential Rule: Patient self-report / sign report strictly anchors clinical severity
        if self_report or (sign and sign.recognized_signs):
            final_severity_val = max(user_reported_norm, (user_reported_norm * 0.75) + (ai_observed_norm * 0.25))
        else:
            final_severity_val = ai_observed_norm

        # Divergence / Uncertainty Metric
        divergence = abs(user_reported_norm - ai_observed_norm) if (self_report and ai_obs_components) else 0.10
        sensor_uncertainty = (1.0 - (sum(confidences) / len(confidences))) if confidences else 0.25
        uncertainty = round(min(0.95, max(0.05, (divergence * 0.65) + (sensor_uncertainty * 0.35))), 2)

        # Discrete Severity Label
        if final_severity_val >= 0.70 or reported_numeric_severity >= 7:
            severity_label = "severe"
        elif final_severity_val >= 0.40 or reported_numeric_severity >= 4:
            severity_label = "moderate"
        elif final_severity_val >= 0.15 or reported_numeric_severity >= 1:
            severity_label = "mild"
        else:
            severity_label = "none"

        # 6. Safety Triage Evaluation
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

        # 7. Synthesize Explainable AI Rationale
        why_this_result = (
            f"Result derived primarily from patient's direct report ({reported_numeric_severity}/10 in {reported_location}) "
            f"with supportive multi-channel telemetry from {', '.join(comm_methods)}. "
            f"Triage recommendation: {safety_eval['triage_level'].upper()}."
        )

        explanation = FusionExplanation(
            primary_evidence=primary_evidence if primary_evidence else ["No direct self-report submitted."],
            supporting_evidence=supporting_evidence if supporting_evidence else ["No marked observational tension detected."],
            conflicting_evidence=conflicting_evidence if conflicting_evidence else ["All active channels showed harmonious agreement."],
            missing_evidence=missing_evidence,
            confidence_rationale=f"Cross-channel agreement with average sensor confidence of {int(overall_conf*100)}%.",
            uncertainty_breakdown=f"Calculated uncertainty is {int(uncertainty*100)}% based on modality divergence and noise parameters.",
            why_this_result=why_this_result
        )

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
            explanation=explanation,
            disclaimer="AI-generated assessment — not a medical diagnosis. A qualified healthcare professional must evaluate medical conditions."
        )

fusion_service = MultimodalFusionService()
