import pytest
from backend.app.services.sign_language_service import sign_service

def test_sign_sequence_translation():
    res = sign_service.translate_sequence(["pain", "chest", "severe"], language="asl")
    assert res["translated_phrase"] == "Severe chest pain"
    assert "severe chest pain" in res["two_way_response_text"].lower()
    assert "doctor" in res["two_way_response_text"].lower() or "emergency" in res["two_way_response_text"].lower()

def test_isl_sign_sequence_translation():
    res = sign_service.translate_sequence(["pain", "chest", "severe"], language="isl")
    assert "Severe chest pain (ISL)" in res["translated_phrase"]
    assert res["language"] == "isl"

def test_isl_vocabulary_distinction():
    vocab_isl = sign_service.get_vocabulary(language="isl")
    vocab_asl = sign_service.get_vocabulary(language="asl")
    # Verify doctor definition reflects dialect distinction (stethoscope mimic in ISL vs radial tap in ASL)
    doc_isl = next(v for v in vocab_isl if v["token"] == "doctor")
    doc_asl = next(v for v in vocab_asl if v["token"] == "doctor")
    assert "stethoscope" in doc_isl["concept"].lower()
    assert "radial pulse" in doc_asl["movement_description"].lower()

def test_emergency_sign_request():
    res = sign_service.translate_sequence(["help", "emergency"], language="asl")
    assert res["translated_phrase"] == "Emergency assistance requested immediately"

def test_unknown_or_compositional_sign():
    res = sign_service.translate_sequence(["pain", "arm"])
    assert "Arm" in res["translated_phrase"] or "arm" in res["translated_phrase"]

