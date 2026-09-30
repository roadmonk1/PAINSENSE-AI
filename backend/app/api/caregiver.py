from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.entities import CaregiverAlertRecord, Assessment, User, CaregiverPatientLink
from backend.app.schemas.schemas import CaregiverAlertCreate, CaregiverAlertResponse
from backend.app.auth.deps import get_optional_user

router = APIRouter(prefix="/caregiver", tags=["Caregiver Assistance"])

@router.get("/dashboard")
def get_caregiver_dashboard(
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user)
):
    # RBAC: Patient accounts cannot access caregiver dashboard
    if user and user.role == "patient":
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Patient accounts cannot access the caregiver dashboard"
        )

    # Filter patients by active link for authenticated caregivers
    if user and user.role == "caregiver":
        links = db.query(CaregiverPatientLink).filter(
            CaregiverPatientLink.caregiver_id == user.id,
            CaregiverPatientLink.status == "active"
        ).all()
        linked_ids = [l.patient_id for l in links]
        if linked_ids:
            patients = db.query(User).filter(User.id.in_(linked_ids)).all()
            recent_alerts = db.query(CaregiverAlertRecord).filter(
                CaregiverAlertRecord.user_id.in_(linked_ids)
            ).order_by(CaregiverAlertRecord.sent_at.desc()).limit(10).all()
        else:
            patients = []
            recent_alerts = []
    else:
        # Default unauthenticated demo view
        patients = db.query(User).filter(User.role == "patient").all()
        recent_alerts = db.query(CaregiverAlertRecord).order_by(CaregiverAlertRecord.sent_at.desc()).limit(10).all()

    patient_cards = []
    for p in patients[:5]:
        latest_assessment = db.query(Assessment).filter(Assessment.user_id == p.id).order_by(Assessment.created_at.desc()).first()
        patient_cards.append({
            "patient_id": p.id,
            "name": p.full_name,
            "status": "Monitored",
            "last_active": latest_assessment.created_at if latest_assessment else p.created_at,
            "last_severity": latest_assessment.overall_severity if latest_assessment else "none",
            "triage_level": latest_assessment.triage_level if latest_assessment else "routine",
            "communication_channels": latest_assessment.communication_methods.split(",") if latest_assessment and latest_assessment.communication_methods else ["Camera", "Sign Language"],
            "emergency_phone": p.emergency_contact_phone or "Configured"
        })

    return {
        "status": "active",
        "linked_patients": patient_cards,
        "recent_alerts": [
            {
                "id": a.id,
                "patient_id": a.user_id,
                "level": a.alert_level,
                "message": a.message,
                "sent_at": a.sent_at,
                "acknowledged": a.acknowledged
            }
            for a in recent_alerts
        ],
        "emergency_contacts": [
            {"name": "Primary Nurse On-Call", "phone": "+1 (555) 019-2831"},
            {"name": "Urgent Care Dispatch", "phone": "+1 (800) 555-0199"}
        ]
    }

@router.post("/alert", response_model=CaregiverAlertResponse)
def trigger_caregiver_alert(alert_in: CaregiverAlertCreate, db: Session = Depends(get_db)):
    alert = CaregiverAlertRecord(
        user_id=alert_in.patient_id,
        assessment_id=alert_in.assessment_id,
        alert_level=alert_in.alert_level,
        message=alert_in.message
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert
