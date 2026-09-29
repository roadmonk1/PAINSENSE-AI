import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

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
