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
