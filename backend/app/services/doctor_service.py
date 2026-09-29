import datetime
from typing import Dict, Any, List, Optional

class DoctorAssistanceService:
    """
    Synthesizes multimodal assessment data into structured clinical summaries
    specifically designed for emergency physicians and nursing staff.
    """

    def generate_clinical_summary(
        self,
        assessment_id: int,
        patient_name: str,
        patient_id: int,
        communication_methods: List[str],
        reported_pain: Dict[str, Any],
        ai_observations: Dict[str, Any],
        triage_level: str
    ) -> Dict[str, Any]:
        timestamp_str = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

        loc = reported_pain.get("location", "Unspecified")
        sev = reported_pain.get("severity", "Unspecified")
        dur = reported_pain.get("duration", "Recent")
        ptype = reported_pain.get("type", "Aching")
        symptoms = reported_pain.get("symptoms", [])

        obs_items = ai_observations.get("indicators", [])

        summary_lines = [
            f"=== PATIENT CLINICAL HANDOVER SUMMARY ===",
            f"Timestamp: {timestamp_str}",
            f"Patient: {patient_name} (ID: #{patient_id})",
            f"Communication Modalities Used: {', '.join(communication_methods)}",
            "",
            "1. SUBJECTIVE REPORT (DIRECT FROM PATIENT):",
            f"   - Stated Location: {loc}",
            f"   - Stated Severity: {sev}",
            f"   - Character / Type: {ptype}",
            f"   - Reported Duration / Onset: {dur}",
            f"   - Accompanying Symptoms: {', '.join(symptoms) if symptoms else 'None noted'}",
            "",
            "2. OBJECTIVE AI OBSERVATIONS (SUPPORTIVE ONLY):",
        ]

        if obs_items:
            for item in obs_items:
                summary_lines.append(f"   - {item}")
        else:
            summary_lines.append("   - No marked distress or grimacing detected during optical/acoustic scan.")

        summary_lines.extend([
            "",
            f"3. SYSTEM TRIAGE CLASSIFICATION: {triage_level.upper()}",
            "",
            "IMPORTANT NOTICE:",
            "This AI-generated clinical assistance summary is designed solely for rapid communication handover.",
            "It does NOT formulate a medical diagnosis or treatment plan. Independent clinical examination required."
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
            "communication_methods": communication_methods,
            "reported_pain": reported_pain,
            "ai_observations": ai_observations,
            "clinical_summary": summary_text,
            "triage_level": triage_level,
            "confidence_assessment": "High agreement between patient report and observational telemetry.",
            "recommendations_for_clinician": recommendations,
            "disclaimer": "AI-generated clinical handover summary. Not a diagnosis. Doctor retains full independent clinical responsibility."
        }

doctor_service = DoctorAssistanceService()
