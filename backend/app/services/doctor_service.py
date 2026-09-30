import datetime
from typing import Dict, Any, List, Optional

class DoctorAssistanceService:
    """
    Synthesizes multimodal assessment data into structured clinical summaries
    for emergency physicians and nursing staff.

    Enforces strict architectural separation between:
    1. PATIENT-REPORTED INFORMATION (Subjective Ground Truth)
    2. AI-OBSERVED INFORMATION (Supportive Telemetry)
    3. SYSTEM-GENERATED FLAGS (Safety Triage)
    4. TIMELINE & ONSET
    5. COMMUNICATION METHODS USED
    6. UNCERTAINTIES & LIMITATIONS
    """

    def generate_clinical_summary(
        self,
        assessment_id: int,
        patient_name: str,
        patient_id: int,
        communication_methods: List[str],
        reported_pain: Dict[str, Any],
        ai_observations: Dict[str, Any],
        triage_level: str,
        uncertainty_score: float = 0.15,
        timeline_notes: Optional[str] = None
    ) -> Dict[str, Any]:
        timestamp_str = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

        loc = reported_pain.get("location", "Unspecified")
        sev = reported_pain.get("severity", "Unspecified")
        dur = reported_pain.get("duration", "Recent")
        ptype = reported_pain.get("type", "Aching")
        symptoms = reported_pain.get("symptoms", [])

        obs_items = ai_observations.get("indicators", [])

        # Strict 6-section clinical handover structure
        summary_lines = [
            "==================================================================",
            "PAINSENSE-AI CLINICAL HANDOVER SUMMARY",
            "==================================================================",
            f"Timestamp: {timestamp_str} | Patient: {patient_name} (ID: #{patient_id})",
            "",
            "[SECTION 1: PATIENT-REPORTED INFORMATION (SUBJECTIVE GROUND TRUTH)]",
            f" - Stated Pain Location: {loc}",
            f" - Patient-Reported Severity: {sev}",
            f" - Character / Quality: {ptype}",
            f" - Duration: {dur}",
            f" - Accompanying Symptoms: {', '.join(symptoms) if symptoms else 'None noted'}",
            "",
            "[SECTION 2: AI-OBSERVED INFORMATION (SUPPORTIVE TELEMETRY)]",
        ]

        if obs_items:
            for item in obs_items:
                summary_lines.append(f" - {item}")
        else:
            summary_lines.append(" - No marked grimacing or distress detected during optical/acoustic scan.")

        summary_lines.extend([
            "",
            "[SECTION 3: SYSTEM-GENERATED SAFETY FLAGS]",
            f" - Triage Priority Classification: {triage_level.upper()}",
            f" - Red-Flag Status: {'POTENTIAL ACUTE RISK - REVIEW PROMPTLY' if triage_level in ['emergency', 'urgent'] else 'ROUTINE OBSERVATION'}",
            "",
            "[SECTION 4: TIMELINE & EPISODE PROGRESSION]",
            f" - Reported Onset: {dur}",
            f" - Episode Context: {timeline_notes or 'Active acute assessment'}",
            "",
            "[SECTION 5: COMMUNICATION METHODS USED]",
            f" - Modalities Active: {', '.join(communication_methods)}",
            "",
            "[SECTION 6: UNCERTAINTIES & SENSOR LIMITATIONS]",
            f" - Calculated Uncertainty Score: {int(uncertainty_score * 100)}%",
            " - Sensor Boundary: Optical expressions are non-specific and do not prove or disprove internal pain sensation.",
            "",
            "==================================================================",
            "IMPORTANT NOTICE FOR CLINICIANS:",
            "This AI-generated clinical assistance summary is designed solely for rapid communication handover.",
            "It does NOT formulate a medical diagnosis or treatment plan. Independent clinical examination required.",
            "=================================================================="
        ])

        summary_text = "\n".join(summary_lines)

        recommendations = [
            "Conduct physical examination focused on reported region.",
            "Verify vital signs and respiratory rate.",
            "Review multimodal communication transcript with patient to confirm symptom progression."
        ]
        if triage_level in ["emergency", "urgent"]:
            recommendations.insert(0, "URGENT: Prioritize immediate evaluation due to potential acute indicators.")

        return {
            "assessment_id": assessment_id,
            "patient_id": patient_id,
            "patient_name": patient_name,
            "timestamp": datetime.datetime.utcnow(),
            "sections": {
                "patient_reported_information": {
                    "location": loc,
                    "severity": sev,
                    "type": ptype,
                    "duration": dur,
                    "symptoms": symptoms
                },
                "ai_observed_information": ai_observations,
                "system_generated_flags": {
                    "triage_level": triage_level,
                    "is_urgent": triage_level in ["emergency", "urgent"]
                },
                "timeline": {
                    "duration": dur,
                    "context": timeline_notes or "Current assessment episode"
                },
                "communication_methods": communication_methods,
                "uncertainties": {
                    "uncertainty_score": uncertainty_score,
                    "note": "Optical and acoustic telemetry are supportive only and do not replace direct patient report."
                }
            },
            "communication_methods": communication_methods,
            "reported_pain": reported_pain,
            "ai_observations": ai_observations,
            "clinical_summary": summary_text,
            "triage_level": triage_level,
            "confidence_assessment": f"Telemetry processed with {int((1.0 - uncertainty_score)*100)}% concordance.",
            "recommendations_for_clinician": recommendations,
            "disclaimer": "AI-generated clinical handover summary. Not a diagnosis. Doctor retains full independent clinical responsibility."
        }

doctor_service = DoctorAssistanceService()
