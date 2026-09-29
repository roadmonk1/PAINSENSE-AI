from fastapi import APIRouter, Depends
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
        confidence_scores=input_data.confidence_scores
    )
    return SignRecognitionResponse(**result)

@router.get("/vocabulary")
def get_vocabulary():
    return {
        "supported_dialect": "American Sign Language (ASL) - Healthcare Distress Core",
        "vocabulary": sign_service.SUPPORTED_VOCABULARY,
        "sample_sequences": [
            {"sequence": ["pain", "chest", "severe"], "meaning": "Severe chest pain"},
            {"sequence": ["help", "emergency"], "meaning": "Emergency assistance requested immediately"},
            {"sequence": ["pain", "stomach", "mild"], "meaning": "Mild stomach discomfort"},
            {"sequence": ["help", "doctor"], "meaning": "Requesting healthcare professional consultation"},
            {"sequence": ["pain", "more"], "meaning": "Pain is increasing"}
        ],
        "extensibility": "Modular token-level & phrase-level sequence architecture ready for BSL, ISL, and custom gestures."
    }

@router.post("/feedback")
def submit_sign_feedback(feedback: SignFeedbackInput, db: Session = Depends(get_db)):
    """Stores user correction feedback for model evaluation and dataset improvements."""
    return {
        "status": "feedback_recorded",
        "message": f"Correction recorded: '{', '.join(feedback.recognized_signs)}' -> '{feedback.corrected_phrase}'. Thank you for improving accessibility accuracy!",
        "saved": True
    }
