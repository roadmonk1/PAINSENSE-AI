import pytest
from fastapi.testclient import TestClient
from backend.app.main import app, seed_demo_data
from backend.app.database import init_db

init_db()
seed_demo_data()
client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "supported_modalities" in data

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["system"] == "PAINSENSE-AI"

def test_sign_language_vocabulary():
    response = client.get("/api/sign-language/vocabulary")
    assert response.status_code == 200
    data = response.json()
    assert "vocabulary" in data
    assert "pain" in data["vocabulary"]

def test_voice_analysis_endpoint():
    response = client.post("/api/voice/analyze", json={
        "transcript": "I have severe lower back pain since this morning"
    })
    assert response.status_code == 200
    data = response.json()
    assert "Lower Back" in data["extracted_location"]
    assert "Severe" in data["extracted_severity"]

def test_camera_analysis_endpoint():
    response = client.post("/api/camera/analyze", json={
        "client_features": {
            "brow_furrowing": 0.6,
            "orbital_tightening": 0.5,
            "postural_guarding": 0.7
        }
    })
    assert response.status_code == 200
    data = response.json()
    assert data["facial"]["tension_level"] in ["Moderate", "High"]
    assert data["combined_tension_score"] > 0.4

def test_assessment_fusion_and_fhir_export():
    fuse_payload = {
        "user_id": 1,
        "self_report": {
            "pain_location": "Chest",
            "severity_score": 7,
            "pain_type": "pressure",
            "duration": "2 hours",
            "onset": "sudden",
            "additional_symptoms": ["shortness of breath"]
        },
        "facial_result": {
            "brow_furrowing": 0.7,
            "orbital_tightening": 0.6,
            "mouth_tension": 0.5,
            "grimace_score": 0.65,
            "observable_indicators": ["Brow lowering", "Cheek raising"],
            "confidence": 0.85
        }
    }
    response = client.post("/api/assessment/fuse-and-save", json=fuse_payload)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["severity"] in ["moderate", "severe"]
    assert res_data["assessment_id"] is not None

    # Test FHIR endpoint
    assessment_id = res_data["assessment_id"]
    fhir_res = client.get(f"/api/assessment/{assessment_id}/fhir")
    assert fhir_res.status_code == 200
    fhir_bundle = fhir_res.json()
    assert fhir_bundle["resourceType"] == "Bundle"
    assert fhir_bundle["type"] == "collection"
    assert len(fhir_bundle["entry"]) >= 3

