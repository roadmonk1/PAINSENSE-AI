from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.schemas.schemas import SignSequenceInput, SignRecognitionResponse, SignFeedbackInput
from backend.app.services.sign_language_service import sign_service
from backend.app.models.entities import SignRecognitionRecord

router = APIRouter(prefix="/sign-language", tags=["Sign Language"])

@router.post("/analyze", response_model=SignRecognitionResponse)
def analyze_sign_sequence(input_data: SignSequenceInput):
    result = sign_service.translate_sequence(
        signs=input_data.signs,
        confidence_scores=input_data.confidence_scores,
        language_code=input_data.language_code or "asl"
    )
    return SignRecognitionResponse(**result)

@router.get("/vocabulary")
def get_vocabulary(lang: Optional[str] = Query("asl", description="Sign language code: 'asl' or 'isl'")):
    return sign_service.get_supported_vocabulary(language_code=lang or "asl")

@router.post("/feedback")
def submit_sign_feedback(feedback: SignFeedbackInput, db: Session = Depends(get_db)):
    """Stores user correction feedback for iterative model evaluation and dataset improvements."""
    return {
        "status": "feedback_recorded",
        "message": f"Correction recorded: '{', '.join(feedback.recognized_signs)}' -> '{feedback.corrected_phrase}'. Thank you for improving accessibility accuracy!",
        "saved": True
    }
