import pytest
from fastapi.testclient import TestClient
from backend.app.main import app, seed_demo_data
from backend.app.database import init_db, SessionLocal
from backend.app.models.entities import User, Assessment, CaregiverPatientLink
from backend.app.auth.security import create_access_token, get_password_hash

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    init_db()
    seed_demo_data()

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def db_session():
    db = SessionLocal()
    yield db
    db.close()

def test_health_endpoints_and_information_leakage(client):
    """Verify /health and /api/health report healthy status without leaking internal secrets."""
    for path in ["/health", "/api/health"]:
        res = client.get(path)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] in ["healthy", "degraded"]
        assert data["version"] == "1.2.0-Enterprise"
        assert "subsystems" in data
        assert "password" not in str(data).lower()
        assert "secret" not in str(data).lower()
        assert "token" not in str(data).lower()

def test_patient_isolation_forbidden_access(client, db_session):
    """Verify Patient A cannot view Patient B's assessment detail or export their FHIR bundle."""
    # Create Patient B and an assessment for Patient B
    p2 = db_session.query(User).filter(User.email == "patient_b@painsense.ai").first()
    if not p2:
        p2 = User(
            email="patient_b@painsense.ai",
            hashed_password=get_password_hash("password123"),
            full_name="Patient B",
            role="patient"
        )
        db_session.add(p2)
        db_session.commit()
        db_session.refresh(p2)

    p2_assessment = Assessment(
        user_id=p2.id,
        overall_severity="severe",
        overall_confidence=0.92,
        triage_level="urgent",
        summary_text="Patient B severe pain record"
    )
    db_session.add(p2_assessment)
    db_session.commit()
    db_session.refresh(p2_assessment)

    # Token for Patient A (Alex Morgan, id=1)
    patient_a = db_session.query(User).filter(User.email == "patient@painsense.ai").first()
    token_a = create_access_token(data={"sub": patient_a.email, "role": patient_a.role})
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Patient A tries to access Patient B's assessment detail
    res_detail = client.get(f"/api/assessment/{p2_assessment.id}", headers=headers_a)
    assert res_detail.status_code == 403
    assert "Forbidden" in res_detail.json()["detail"]

    # Patient A tries to export Patient B's FHIR bundle
    res_fhir = client.get(f"/api/assessment/{p2_assessment.id}/fhir", headers=headers_a)
    assert res_fhir.status_code == 403
    assert "Forbidden" in res_fhir.json()["detail"]

def test_caregiver_dashboard_forbidden_for_patient(client, db_session):
    """Verify that a patient account cannot access the caregiver dashboard."""
    patient = db_session.query(User).filter(User.email == "patient@painsense.ai").first()
    token = create_access_token(data={"sub": patient.email, "role": patient.role})
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/caregiver/dashboard", headers=headers)
    assert res.status_code == 403
    assert "Patient accounts cannot access the caregiver dashboard" in res.json()["detail"]

def test_authorized_caregiver_access(client, db_session):
    """Verify that an authorized caregiver with active link can access their linked patient."""
    caregiver = db_session.query(User).filter(User.email == "caregiver@painsense.ai").first()
    patient = db_session.query(User).filter(User.email == "patient@painsense.ai").first()
    
    # Ensure active link exists
    link = db_session.query(CaregiverPatientLink).filter(
        CaregiverPatientLink.caregiver_id == caregiver.id,
        CaregiverPatientLink.patient_id == patient.id
    ).first()
    if not link:
        link = CaregiverPatientLink(caregiver_id=caregiver.id, patient_id=patient.id, status="active")
        db_session.add(link)
        db_session.commit()

    token = create_access_token(data={"sub": caregiver.email, "role": caregiver.role})
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/caregiver/dashboard", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "linked_patients" in data
    linked_ids = [p["patient_id"] for p in data["linked_patients"]]
    assert patient.id in linked_ids

def test_doctor_clinical_access(client, db_session):
    """Verify that a clinician (doctor) can access summaries for triage and clinical oversight."""
    doctor = db_session.query(User).filter(User.email == "doctor@painsense.ai").first()
    token = create_access_token(data={"sub": doctor.email, "role": doctor.role})
    headers = {"Authorization": f"Bearer {token}"}

    # Assessment 1
    res = client.get("/api/doctor/summary/1", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "clinical_summary" in data
    assert "triage_level" in data
