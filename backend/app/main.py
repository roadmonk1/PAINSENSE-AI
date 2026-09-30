import os
import json
import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.app.config import settings
from backend.app.database import init_db, SessionLocal
from backend.app.models.entities import (
    User, Assessment, TimelineEvent, ConsentRecord,
    CaregiverAlertRecord, PainReport, AIObservation, CaregiverPatientLink
)
from backend.app.auth.security import get_password_hash

# Import routers
from backend.app.api.auth import router as auth_router
from backend.app.api.assessment import router as assessment_router
from backend.app.api.camera import router as camera_router
from backend.app.api.voice import router as voice_router
from backend.app.api.sign_language import router as sign_router
from backend.app.api.fusion import router as fusion_router
from backend.app.api.timeline import router as timeline_router
from backend.app.api.doctor import router as doctor_router
from backend.app.api.caregiver import router as caregiver_router
from backend.app.api.safety import router as safety_router
from backend.app.api.privacy import router as privacy_router

def seed_demo_data():
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.email == "patient@painsense.ai").first():
            # 1. Patient
            patient = User(
                email="patient@painsense.ai",
                hashed_password=get_password_hash("patient123"),
                full_name="Alex Morgan",
                role="patient",
                phone_number="+1 (555) 234-5678",
                emergency_contact_name="Elena Morgan (Sister)",
                emergency_contact_phone="+1 (555) 987-6543"
            )
            # 2. Caregiver
            caregiver = User(
                email="caregiver@painsense.ai",
                hashed_password=get_password_hash("caregiver123"),
                full_name="Elena Morgan",
                role="caregiver",
                phone_number="+1 (555) 987-6543"
            )
            # 3. Doctor
            doctor = User(
                email="doctor@painsense.ai",
                hashed_password=get_password_hash("doctor123"),
                full_name="Dr. Marcus Vance, MD",
                role="doctor",
                phone_number="+1 (555) 456-7890"
            )
            db.add_all([patient, caregiver, doctor])
            db.commit()
            db.refresh(patient)

            consent = ConsentRecord(user_id=patient.id)
            db.add(consent)

            now = datetime.datetime.utcnow()
            t1 = now - datetime.timedelta(hours=4)
            t2 = now - datetime.timedelta(hours=2)

            a1 = Assessment(
                user_id=patient.id,
                created_at=t1,
                overall_severity="mild",
                overall_confidence=0.88,
                uncertainty_score=0.12,
                communication_methods="Camera (Facial Analysis),Voice Analysis & Speech",
                triage_level="routine",
                summary_text="Mild lower back stiffness reported. Subtle facial tension noted."
            )
            db.add(a1)
            db.commit()
            db.refresh(a1)

            e1 = TimelineEvent(
                user_id=patient.id,
                assessment_id=a1.id,
                timestamp=t1,
                event_type="assessment",
                title="Routine Check - Mild Discomfort",
                description="Patient reported mild lumbar tightness. Practice stretching.",
                severity="mild",
                modality="Camera,Voice"
            )

            a2 = Assessment(
                user_id=patient.id,
                created_at=t2,
                overall_severity="moderate",
                overall_confidence=0.85,
                uncertainty_score=0.18,
                communication_methods="Sign Language Recognition,Camera (Facial Analysis)",
                triage_level="caution",
                summary_text="Moderate thoracic / chest discomfort signed via ASL. Brow lowering and orbital tension."
            )
            db.add(a2)
            db.commit()
            db.refresh(a2)

            e2 = TimelineEvent(
                user_id=patient.id,
                assessment_id=a2.id,
                timestamp=t2,
                event_type="assessment",
                title="Moderate Pain Progression",
                description="Sign communication translated: 'Pain Chest Moderate'. Clinician notified.",
                severity="moderate",
                modality="Sign Language,Camera"
            )

            alert = CaregiverAlertRecord(
                user_id=patient.id,
                assessment_id=a2.id,
                alert_level="warning",
                message="Alex reported moderate discomfort via sign language. System recommended monitoring.",
                sent_at=t2
            )
            # Create active link between demo caregiver and patient
            caregiver_link = CaregiverPatientLink(
                caregiver_id=caregiver.id,
                patient_id=patient.id,
                status="active",
                permissions_json=json.dumps(["view_timeline", "receive_alerts", "request_call"])
            )
            db.add_all([e1, e2, alert, caregiver_link])
            db.commit()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed_demo_data()
    yield

app = FastAPI(
    title="PAINSENSE-AI API",
    description="Multimodal Pain Detection, Sign-Language Communication & Healthcare Assistance System",
    version="1.2.0-Enterprise",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handler to protect users from raw stack traces
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "A server error occurred. Please try again or consult your caregiver/healthcare provider.",
            "detail": str(exc) if settings.DEBUG else "Internal server error"
        }
    )

def _build_health_status():
    db_status = "connected"
    try:
        db = SessionLocal()
        db.execute(json.loads('"SELECT 1"') if False else "SELECT 1")  # safe ping
    except Exception:
        # Fallback query if raw sql string isn't wrapped
        try:
            from sqlalchemy import text
            db = SessionLocal()
            db.execute(text("SELECT 1"))
        except Exception as e:
            db_status = f"degraded: {str(e)[:50]}"
        finally:
            db.close()
    else:
        db.close()

    return {
        "status": "healthy" if "degraded" not in db_status else "degraded",
        "version": "1.2.0-Enterprise",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "database": db_status,
        "subsystems": {
            "database": db_status,
            "facial_pspi_engine": "ready",
            "voice_acoustic_engine": "ready",
            "sign_language_engine": "ready",
            "multimodal_fusion": "ready",
            "safety_triage": "active",
            "fhir_exporter": "ready"
        },
        "demo_mode": settings.ENABLE_DEMO_MODE,
        "supported_modalities": [
            "camera_facial",
            "camera_body",
            "voice_acoustic",
            "speech_transcription",
            "sign_language_asl_isl",
            "self_report"
        ],
        "disclaimer": "Assistive communication tool. NOT a certified medical diagnostic system."
    }

# Root and health endpoints
@app.get("/")
def root():
    return {
        "system": "PAINSENSE-AI",
        "description": "Multimodal Pain Detection, Sign-Language Communication & Healthcare Assistance System",
        "version": "1.2.0-Enterprise",
        "status": "online",
        "documentation": "/docs",
        "health_check": "/health",
        "disclaimer": "AI-generated assessment — assistive communication, not a medical diagnosis."
    }

@app.get("/health")
def health():
    """Liveness & readiness probe endpoint for Docker, Kubernetes, and cloud monitors."""
    return _build_health_status()

@app.get("/api/health")
def health_check():
    """API health check endpoint."""
    return _build_health_status()

# Register API routers
app.include_router(auth_router, prefix="/api")
app.include_router(assessment_router, prefix="/api")
app.include_router(camera_router, prefix="/api")
app.include_router(voice_router, prefix="/api")
app.include_router(sign_router, prefix="/api")
app.include_router(fusion_router, prefix="/api")
app.include_router(timeline_router, prefix="/api")
app.include_router(doctor_router, prefix="/api")
app.include_router(caregiver_router, prefix="/api")
app.include_router(safety_router, prefix="/api")
app.include_router(privacy_router, prefix="/api")
