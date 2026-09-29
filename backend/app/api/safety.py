from fastapi import APIRouter
from backend.app.schemas.schemas import SafetyAssessmentRequest, SafetyAssessmentResponse
from backend.app.services.safety_service import safety_service

router = APIRouter(prefix="/safety", tags=["Safety Engine"])

@router.post("/check", response_model=SafetyAssessmentResponse)
def evaluate_symptoms_safety(req: SafetyAssessmentRequest):
    result = safety_service.evaluate_safety(
        reported_symptoms=req.reported_symptoms,
        pain_location=req.pain_location,
        severity_score=req.severity_score or 0
    )
    return SafetyAssessmentResponse(**result)
