import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_post_discharge_workflow():
    # 1. Create a post-discharge case
    case_payload = {
        "discharge_date": "2026-03-25",
        "discharge_hospital": "District Civil Hospital, Dharwad",
        "discharge_reason": "Post-operative appendectomy recovery",
        "pain_location": "Lower right abdomen",
        "severity_score": 6,
        "pain_type": "Throbbing and sharp",
        "pain_duration": "Last 4 hours",
        "symptoms": ["Swelling near incision", "Mild fever sensation", "Difficulty bending"],
        "changes_since_discharge": "Pain increased compared to discharge day; dressing slightly damp.",
        "patient_notes": "Finding it hard to walk around the house.",
        "caregiver_notes": "Father helped change clothes, noted slight warmth at incision site.",
        "communication_methods": "Multimodal (Self-report + Voice)",
        "ai_observations": [
            "Voice acoustic analysis: Mild elevated pitch indicating distress",
            "Facial grimace score: 0.62 (moderate discomfort detected)"
        ],
        "ai_observation_note": "Facial and vocal markers are supportive documentation only, not a diagnostic finding."
    }

    create_res = client.post("/api/post-discharge/cases", json=case_payload)
    assert create_res.status_code == 200, create_res.text
    created_data = create_res.json()
    
    assert "case_ref" in created_data
    assert created_data["case_ref"].startswith("PS-")
    assert created_data["pain_location"] == "Lower right abdomen"
    assert created_data["severity_score"] == 6
    assert created_data["status"] == "pending_review"
    assert "disclaimer" in created_data
    assert "not a medical diagnostic device" in created_data["disclaimer"]
    case_id = created_data["id"]

    # 2. Get case by ID
    get_res = client.get(f"/api/post-discharge/cases/{case_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == case_id
    assert get_res.json()["case_ref"] == created_data["case_ref"]

    # 3. List patient cases
    list_res = client.get("/api/post-discharge/cases")
    assert list_res.status_code == 200
    cases = list_res.json()
    assert isinstance(cases, list)
    assert any(c["id"] == case_id for c in cases)

    # 4. Doctor view: list all cases
    doc_res = client.get("/api/post-discharge/doctor/all-cases")
    assert doc_res.status_code == 200
    doc_cases = doc_res.json()
    assert isinstance(doc_cases, list)
    matching_doc_case = next((c for c in doc_cases if c["id"] == case_id), None)
    assert matching_doc_case is not None
    assert "patient_name" in matching_doc_case

    # 5. Doctor updates status
    status_update_res = client.put(
        f"/api/post-discharge/doctor/cases/{case_id}/status?status=reviewed&clinical_notes=Advise+warm+compress+and+tele-consult"
    )
    assert status_update_res.status_code == 200
    assert status_update_res.json()["success"] is True
    assert status_update_res.json()["new_status"] == "reviewed"

    # Verify updated status
    updated_case_res = client.get(f"/api/post-discharge/cases/{case_id}")
    assert updated_case_res.json()["status"] == "reviewed"
    assert "Advise warm compress" in updated_case_res.json()["caregiver_notes"]

    # 6. Report data endpoint for PDF/clinical handover
    report_res = client.get(f"/api/post-discharge/cases/{case_id}/report-data")
    assert report_res.status_code == 200
    report_data = report_res.json()
    assert report_data["report_type"] == "PainSense AI — Post-Discharge Care Report"
    assert "case" in report_data
    assert "patient_name" in report_data
    assert "timeline_summary" in report_data
    assert "disclaimer" in report_data
    assert "safety_notice" in report_data

    # 7. Non-existent case 404 test
    not_found_res = client.get("/api/post-discharge/cases/999999")
    assert not_found_res.status_code == 404
