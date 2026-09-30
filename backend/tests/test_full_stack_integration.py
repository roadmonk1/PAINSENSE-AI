"""
PAINSENSE-AI Full-Stack End-to-End Integration Test
Verifies the complete real workflow across all layers:
LOGIN -> DASHBOARD -> CAMERA -> VOICE -> SIGN -> SAFETY -> FUSION -> SAVE -> TIMELINE -> DOCTOR -> FHIR -> PRIVACY
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app, seed_demo_data
from backend.app.database import init_db, SessionLocal
from backend.app.models.entities import User, Assessment, TimelineEvent, DoctorSummaryRecord, CaregiverPatientLink

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    init_db()
    seed_demo_data()

@pytest.fixture
def client():
    return TestClient(app)

def test_complete_end_to_end_multimodal_workflow(client):
    """
    Executes the complete clinical lifecycle from login through multimodal fusion,
    safety checks, timeline persistence, doctor handover, FHIR export, and privacy export.
    """

    # ----------------------------------------------------
    # Step 1: LOGIN (Patient Authentication)
    # ----------------------------------------------------
    login_res = client.post("/api/auth/login", json={
        "email": "patient@painsense.ai",
        "password": "patient123"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    auth_data = login_res.json()
    assert "access_token" in auth_data
    token = auth_data["access_token"]
    patient_id = auth_data["user"]["id"]
    headers = {"Authorization": f"Bearer {token}"}

    # ----------------------------------------------------
    # Step 2: DASHBOARD (History & Telemetry)
    # ----------------------------------------------------
    dash_res = client.get("/api/assessment/history", headers=headers)
    assert dash_res.status_code == 200
    initial_history = dash_res.json()
    assert isinstance(initial_history, list)

    timeline_res = client.get("/api/timeline", headers=headers)
    assert timeline_res.status_code == 200
    initial_timeline = timeline_res.json()
    assert isinstance(initial_timeline, list)

    # ----------------------------------------------------
    # Step 3: CAMERA MODALITY INFERENCE (Facial PSPI)
    # ----------------------------------------------------
    cam_res = client.post("/api/camera/analyze", headers=headers, json={
        "client_features": {
            "brow_furrowing": 0.82,
            "orbital_tightening": 0.74,
            "mouth_tension": 0.65
        }
    })
    assert cam_res.status_code == 200
    cam_data = cam_res.json()
    facial_data = cam_data["facial"]
    assert facial_data["tension_level"] in ["Mild", "Moderate", "High"]
    assert "brow_furrowing" in facial_data

    # ----------------------------------------------------
    # Step 4: VOICE MODALITY INFERENCE (Acoustics & NLP)
    # ----------------------------------------------------
    voice_res = client.post("/api/voice/analyze", headers=headers, json={
        "transcript": "Severe sharp shooting pain in my chest for the past 2 hours",
        "acoustic_features": {
            "jitter": 0.075,
            "shimmer": 0.112,
            "f0_mean": 210.0
        }
    })
    assert voice_res.status_code == 200
    voice_data = voice_res.json()
    assert voice_data["extracted_location"].lower() == "chest"
    assert voice_data["acoustic_strain_score"] > 0.0

    # ----------------------------------------------------
    # Step 5: SIGN LANGUAGE MODALITY INFERENCE (ASL)
    # ----------------------------------------------------
    sign_res = client.post("/api/sign-language/analyze", headers=headers, json={
        "signs": ["pain", "chest", "severe"],
        "confidence_scores": [0.92, 0.88, 0.95],
        "language_code": "asl"
    })
    assert sign_res.status_code == 200
    sign_data = sign_res.json()
    assert "chest" in sign_data["translated_phrase"].lower()
    assert sign_data["confidence"] > 0.80

    # ----------------------------------------------------
    # Step 6: SAFETY TRIAGE RULE ENGINE
    # ----------------------------------------------------
    safety_res = client.post("/api/safety/check", headers=headers, json={
        "reported_symptoms": ["chest pain", "shortness of breath"],
        "pain_location": "Chest",
        "severity_score": 8
    })
    assert safety_res.status_code == 200
    safety_data = safety_res.json()
    assert safety_data["is_emergency"] or safety_data["is_urgent"]
    assert len(safety_data["flagged_concerns"]) > 0

    # ----------------------------------------------------
    # Step 7: MULTIMODAL FUSION & SAVE TO DATABASE
    # ----------------------------------------------------
    fusion_payload = {
        "user_id": patient_id,
        "self_report": {
            "pain_location": "Chest",
            "severity_score": 8,
            "pain_type": "sharp",
            "duration": "2 hours",
            "onset": "sudden",
            "additional_symptoms": ["shortness of breath"],
            "free_text": "Sudden onset sharp chest discomfort while sitting."
        },
        "facial_result": {
            "brow_furrowing": facial_data["brow_furrowing"],
            "orbital_tightening": facial_data["orbital_tightening"],
            "mouth_tension": facial_data["mouth_tension"],
            "grimace_score": facial_data["grimace_score"],
            "confidence": facial_data["confidence"],
            "observable_indicators": facial_data["observable_indicators"]
        },
        "voice_result": {
            "transcript": voice_data["transcript"],
            "extracted_location": voice_data["extracted_location"],
            "extracted_severity": voice_data["extracted_severity"],
            "extracted_duration": voice_data["extracted_duration"],
            "extracted_pain_type": voice_data["extracted_pain_type"],
            "acoustic_strain_score": voice_data["acoustic_strain_score"],
            "confidence": voice_data["confidence"]
        },
        "sign_result": sign_data,
        "notes": "Multimodal E2E Integration Assessment"
    }

    save_res = client.post("/api/assessment/fuse-and-save", headers=headers, json=fusion_payload)
    assert save_res.status_code == 200, f"Assessment save failed: {save_res.text}"
    saved_assessment = save_res.json()
    assessment_id = saved_assessment["assessment_id"]
    assert assessment_id is not None
    assert saved_assessment["severity"] in ["moderate", "severe"]
    assert saved_assessment["triage_level"] in ["urgent", "emergency"]

    # ----------------------------------------------------
    # Step 8: TIMELINE RECORD PERSISTENCE VERIFICATION
    # ----------------------------------------------------
    timeline_after = client.get("/api/timeline", headers=headers)
    assert timeline_after.status_code == 200
    timeline_items = timeline_after.json()
    assert len(timeline_items) > len(initial_timeline)
    matching_events = [e for e in timeline_items if e.get("assessment_id") == assessment_id]
    assert len(matching_events) >= 1

    # ----------------------------------------------------
    # Step 9: DOCTOR CLINICAL HANDOVER SUMMARY
    # ----------------------------------------------------
    doc_res = client.get(f"/api/doctor/summary/{assessment_id}", headers=headers)
    assert doc_res.status_code == 200
    doc_summary = doc_res.json()
    assert "clinical_summary" in doc_summary
    assert "triage_level" in doc_summary
    assert "Chest" in str(doc_summary)

    # ----------------------------------------------------
    # Step 10: HL7 FHIR R4 BUNDLE EXPORT
    # ----------------------------------------------------
    fhir_res = client.get(f"/api/assessment/{assessment_id}/fhir", headers=headers)
    assert fhir_res.status_code == 200
    bundle = fhir_res.json()
    assert bundle["resourceType"] == "Bundle"
    assert bundle["type"] == "collection"
    assert len(bundle["entry"]) == 4

    resource_types = [entry["resource"]["resourceType"] for entry in bundle["entry"]]
    assert "Patient" in resource_types
    assert "Observation" in resource_types
    assert "Condition" in resource_types

    # Verify LOINC 72514-3 Pain observation
    pain_obs = next(
        e["resource"] for e in bundle["entry"]
        if e["resource"]["resourceType"] == "Observation" and "72514-3" in str(e["resource"])
    )
    assert pain_obs["valueInteger"] == 8
    assert "Chest" in pain_obs["bodySite"]["text"]

    # Verify Condition verificationStatus is strictly "unconfirmed"
    condition_res = next(
        e["resource"] for e in bundle["entry"]
        if e["resource"]["resourceType"] == "Condition"
    )
    assert condition_res["verificationStatus"]["coding"][0]["code"] == "unconfirmed"

    # ----------------------------------------------------
    # Step 11: PRIVACY DATA EXPORT (GDPR Art. 20)
    # ----------------------------------------------------
    privacy_res = client.get("/api/privacy/export", headers=headers)
    assert privacy_res.status_code == 200
    archive = privacy_res.json()
    assert "user_profile" in archive
    assert archive["user_profile"]["email"] == "patient@painsense.ai"
    assert "assessments" in archive
    assert any(a["id"] == assessment_id for a in archive["assessments"])
