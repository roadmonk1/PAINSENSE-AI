import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.entities import ConsentRecord, User, Assessment, TimelineEvent
from backend.app.schemas.schemas import ConsentUpdate, ConsentResponse
from backend.app.auth.deps import get_optional_user

router = APIRouter(prefix="/privacy", tags=["Privacy & Consent"])

@router.get("/consent", response_model=ConsentResponse)
def get_user_consent(db: Session = Depends(get_db), user: User = Depends(get_optional_user)):
    user_id = user.id if user else 1
    consent = db.query(ConsentRecord).filter(ConsentRecord.user_id == user_id).first()
    if not consent:
        consent = ConsentRecord(user_id=user_id)
        db.add(consent)
        db.commit()
        db.refresh(consent)
    return consent

@router.put("/consent", response_model=ConsentResponse)
def update_user_consent(update: ConsentUpdate, db: Session = Depends(get_db), user: User = Depends(get_optional_user)):
    user_id = user.id if user else 1
    consent = db.query(ConsentRecord).filter(ConsentRecord.user_id == user_id).first()
    if not consent:
        consent = ConsentRecord(user_id=user_id)
        db.add(consent)

    consent.camera_consent = update.camera_consent
    consent.audio_consent = update.audio_consent
    consent.data_retention_consent = update.data_retention_consent
    consent.local_only_mode = update.local_only_mode
    db.commit()
    db.refresh(consent)
    return consent

@router.delete("/data")
def delete_user_telemetry(db: Session = Depends(get_db), user: User = Depends(get_optional_user)):
    """Allows patient to exercise Right to Be Forgotten / Data Deletion."""
    user_id = user.id if user else 1
    db.query(Assessment).filter(Assessment.user_id == user_id).delete()
    db.query(TimelineEvent).filter(TimelineEvent.user_id == user_id).delete()
    db.commit()
    return {"status": "success", "message": "All observational and assessment telemetry successfully deleted."}

@router.get("/export")
def export_user_data(db: Session = Depends(get_db), user: User = Depends(get_optional_user)):
    """Export complete patient data package in machine-readable JSON format."""
    user_id = user.id if user else 1
    u = db.query(User).filter(User.id == user_id).first()
    assessments = db.query(Assessment).filter(Assessment.user_id == user_id).all()
    events = db.query(TimelineEvent).filter(TimelineEvent.user_id == user_id).all()
    consent = db.query(ConsentRecord).filter(ConsentRecord.user_id == user_id).first()

    return {
        "export_metadata": {
            "system": "PAINSENSE-AI",
            "version": "1.2.0",
            "compliance": ["GDPR", "HIPAA Safeguards Prototype", "HL7 FHIR R4 Ready"],
            "exported_at": datetime.datetime.utcnow().isoformat() + "Z"
        },
        "user_profile": {
            "id": u.id if u else user_id,
            "full_name": u.full_name if u else "Alex Morgan",
            "email": u.email if u else "patient@painsense.ai",
            "role": u.role if u else "patient"
        },
        "consent_settings": {
            "camera_consent": consent.camera_consent if consent else True,
            "audio_consent": consent.audio_consent if consent else True,
            "data_retention_consent": consent.data_retention_consent if consent else True,
            "local_only_mode": consent.local_only_mode if consent else False
        },
        "assessments": [
            {
                "id": a.id,
                "created_at": a.created_at.isoformat() if a.created_at else None,
                "severity": a.overall_severity,
                "confidence": a.overall_confidence,
                "uncertainty": a.uncertainty_score,
                "triage_level": a.triage_level,
                "summary": a.summary_text
            }
            for a in assessments
        ],
        "timeline_events": [
            {
                "id": e.id,
                "timestamp": e.timestamp.isoformat() if e.timestamp else None,
                "event_type": e.event_type,
                "title": e.title,
                "description": e.description,
                "severity": e.severity,
                "modality": e.modality
            }
            for e in events
        ]
    }

