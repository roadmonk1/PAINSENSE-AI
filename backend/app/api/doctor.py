from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.entities import Assessment, User, DoctorSummaryRecord
from backend.app.schemas.schemas import DoctorSummaryResponse, CallRequest, CallResponse
from backend.app.services.doctor_service import doctor_service
from backend.app.services.call_service import call_service
from backend.app.auth.deps import get_optional_user

router = APIRouter(prefix="/doctor", tags=["Doctor Assistance"])

@router.get("/summary/{assessment_id}", response_model=DoctorSummaryResponse)
def get_or_generate_summary(assessment_id: int, db: Session = Depends(get_db)):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    user = assessment.user
    patient_name = user.full_name if user else "Patient"

    # Prepare pain details
    reported_pain = {}
    if assessment.pain_report:
        reported_pain = {
            "location": assessment.pain_report.pain_location,
            "severity": f"{assessment.pain_report.severity_score}/10",
            "type": assessment.pain_report.pain_type,
            "duration": assessment.pain_report.duration
        }
    else:
        reported_pain = {
            "location": "Communicated via non-verbal channels",
            "severity": assessment.overall_severity.capitalize(),
            "type": "Acute presentation",
            "duration": "Current episode"
        }

    ai_obs = {
        "indicators": [obs.notes for obs in assessment.ai_observations if obs.notes]
    }

    comm_methods = assessment.communication_methods.split(",") if assessment.communication_methods else ["Multimodal"]

    summary_data = doctor_service.generate_clinical_summary(
        assessment_id=assessment.id,
        patient_name=patient_name,
        patient_id=assessment.user_id,
        communication_methods=comm_methods,
        reported_pain=reported_pain,
        ai_observations=ai_obs,
        triage_level=assessment.triage_level
    )

    return DoctorSummaryResponse(**summary_data)

@router.post("/call", response_model=CallResponse)
def request_call(req: CallRequest, db: Session = Depends(get_db)):
    summary_text = "Clinical Handover: Patient has an active multimodal pain assessment requiring clinical attention."
    if req.assessment_id:
        assessment = db.query(Assessment).filter(Assessment.id == req.assessment_id).first()
        if assessment and assessment.summary_text:
            summary_text = assessment.summary_text

    result = call_service.request_call(
        target=req.target,
        summary_text=summary_text,
        phone_number=req.phone_number
    )
    return CallResponse(**result)
