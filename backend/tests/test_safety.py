import pytest
from backend.app.services.safety_service import safety_service

def test_emergency_chest_pain_flagged():
    result = safety_service.evaluate_safety(
        reported_symptoms=["severe chest pain", "difficulty breathing"],
        pain_location="Chest",
        severity_score=9
    )
    assert result["is_emergency"] is True
    assert result["triage_level"] == "emergency"
    assert any("chest pain" in c.lower() for c in result["flagged_concerns"])

def test_routine_mild_pain():
    result = safety_service.evaluate_safety(
        reported_symptoms=["mild wrist ache after typing"],
        pain_location="Wrist",
        severity_score=2
    )
    assert result["is_emergency"] is False
    assert result["triage_level"] == "routine"

def test_urgent_high_severity():
    result = safety_service.evaluate_safety(
        reported_symptoms=["painful knee swelling"],
        pain_location="Knee",
        severity_score=8
    )
    assert result["is_urgent"] is True
    assert result["triage_level"] == "urgent"
