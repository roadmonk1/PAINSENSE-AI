import pytest
from backend.app.services.sign_language_service import sign_service

def test_sign_sequence_translation():
    res = sign_service.translate_sequence(["pain", "chest", "severe"])
    assert res["translated_phrase"] == "Severe chest pain"
    assert "severe chest pain" in res["two_way_response_text"].lower()
    assert "doctor" in res["two_way_response_text"].lower() or "emergency" in res["two_way_response_text"].lower()

def test_emergency_sign_request():
    res = sign_service.translate_sequence(["help", "emergency"])
    assert res["translated_phrase"] == "Emergency assistance requested immediately"

def test_unknown_or_compositional_sign():
    res = sign_service.translate_sequence(["pain", "arm"])
    assert "Arm" in res["translated_phrase"] or "arm" in res["translated_phrase"]
