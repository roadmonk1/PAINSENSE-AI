import pytest
from backend.app.schemas.schemas import FacialAnalysisResult, PainReportCreate, SignRecognitionResponse
from backend.app.services.fusion_service import fusion_service

def test_user_report_not_overridden_by_low_vision_confidence():
    # Camera observation is low tension / low confidence
    facial = FacialAnalysisResult(
        brow_furrowing=0.05,
        orbital_tightening=0.05,
        mouth_tension=0.05,
        grimace_score=0.05,
        tension_level="Low",
        confidence=0.35,
        observable_indicators=["Subtle baseline"]
    )
    # User reports severe chest pain
    self_report = PainReportCreate(
        pain_location="Chest",
        severity_score=9,
        pain_type="Sharp",
        duration="20 minutes",
        onset="Sudden",
        additional_symptoms=["difficulty breathing"]
    )

    fusion_result = fusion_service.fuse(
        facial=facial,
        self_report=self_report
    )

    # Core requirement: Severity must reflect the severe report and flag emergency triage
    assert fusion_result.severity == "severe"
    assert fusion_result.is_emergency is True
    assert fusion_result.triage_level == "emergency"
    # Modalities should retain both
    assert "Camera (Facial Analysis)" in fusion_result.communication_methods
    assert "Self-Reported Assessment" in fusion_result.communication_methods
    # Uncertainty score reflects divergence
    assert fusion_result.uncertainty > 0.2

def test_sign_language_fusion():
    sign = SignRecognitionResponse(
        recognized_signs=["pain", "stomach", "mild"],
        confidence=0.92,
        translated_phrase="Mild stomach discomfort",
        two_way_response_text="Mild stomach discomfort recorded.",
        two_way_response_speech="Mild stomach discomfort recorded."
    )
    fusion_result = fusion_service.fuse(sign=sign)
    assert fusion_result.severity == "mild"
    assert any("Sign Language Recognition" in m for m in fusion_result.communication_methods)
