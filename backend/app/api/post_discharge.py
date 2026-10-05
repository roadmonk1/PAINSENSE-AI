"""
PAINSENSE-AI — Post-Discharge Care API
TYSIC 2026 | Health Sector

Implements the post-discharge rural care communication workflow.
This is a COMMUNICATION and DOCUMENTATION system.
PainSense AI does NOT diagnose, treat, or replace clinicians.
"""
import json
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.entities import PostDischargeCase, User, TimelineEvent
from backend.app.auth.deps import get_optional_user

router = APIRouter(prefix="/post-discharge", tags=["Post-Discharge Care"])

# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class PostDischargeCaseCreate(BaseModel):
    discharge_date: Optional[str] = None
    discharge_hospital: Optional[str] = None
    discharge_reason: Optional[str] = None
    pain_location: str = "Unspecified"
    severity_score: int = Field(0, ge=0, le=10)
    pain_type: str = "Unspecified"
    pain_duration: str = "Unspecified"
    symptoms: List[str] = []
    changes_since_discharge: Optional[str] = None
    patient_notes: Optional[str] = None
    caregiver_notes: Optional[str] = None
    communication_methods: str = "Self-Report (Text)"
    # AI observations (optional, supportive only)
    ai_observations: List[str] = []
    ai_observation_note: Optional[str] = None


class PostDischargeCaseResponse(BaseModel):
    id: int
    case_ref: str
    user_id: int
    status: str
    discharge_date: Optional[str]
    discharge_hospital: Optional[str]
    discharge_reason: Optional[str]
    pain_location: str
    severity_score: int
    pain_type: str
    pain_duration: str
    symptoms: List[str]
    changes_since_discharge: Optional[str]
    patient_notes: Optional[str]
    caregiver_notes: Optional[str]
    communication_methods: str
    ai_observations: List[str]
    ai_observation_note: Optional[str]
    assessment_id: Optional[int]
    is_demo: bool
    created_at: datetime.datetime
    disclaimer: str = (
        "PainSense AI is an AI-assisted communication and documentation tool "
        "and is not a medical diagnostic device. Clinical decisions must be made "
        "by a qualified healthcare professional."
    )


# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_case_ref(db: Session) -> str:
    """Generate the next PS-XXXX case reference."""
    count = db.query(PostDischargeCase).count()
    return f"PS-{1001 + count}"


def _to_response(case: PostDischargeCase) -> dict:
    return {
        "id": case.id,
        "case_ref": case.case_ref,
        "user_id": case.user_id,
        "status": case.status,
        "discharge_date": case.discharge_date,
        "discharge_hospital": case.discharge_hospital,
        "discharge_reason": case.discharge_reason,
        "pain_location": case.pain_location,
        "severity_score": case.severity_score,
        "pain_type": case.pain_type,
        "pain_duration": case.pain_duration,
        "symptoms": json.loads(case.symptoms_json or "[]"),
        "changes_since_discharge": case.changes_since_discharge,
        "patient_notes": case.patient_notes,
        "caregiver_notes": case.caregiver_notes,
        "communication_methods": case.communication_methods,
        "ai_observations": json.loads(case.ai_observations_json or "[]"),
        "ai_observation_note": case.ai_observation_note,
        "assessment_id": case.assessment_id,
        "is_demo": case.is_demo,
        "created_at": case.created_at,
        "disclaimer": (
            "PainSense AI is an AI-assisted communication and documentation tool "
            "and is not a medical diagnostic device. Clinical decisions must be made "
            "by a qualified healthcare professional."
        ),
    }


# ── Patient Endpoints ─────────────────────────────────────────────────────────

@router.post("/cases", summary="Submit a new post-discharge care case")
def create_case(
    body: PostDischargeCaseCreate,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    user_id = user.id if user else 1
    case_ref = _make_case_ref(db)

    case = PostDischargeCase(
        case_ref=case_ref,
        user_id=user_id,
        status="pending_review",
        discharge_date=body.discharge_date,
        discharge_hospital=body.discharge_hospital,
        discharge_reason=body.discharge_reason,
        pain_location=body.pain_location,
        severity_score=body.severity_score,
        pain_type=body.pain_type,
        pain_duration=body.pain_duration,
        symptoms_json=json.dumps(body.symptoms),
        changes_since_discharge=body.changes_since_discharge,
        patient_notes=body.patient_notes,
        caregiver_notes=body.caregiver_notes,
        communication_methods=body.communication_methods,
        ai_observations_json=json.dumps(body.ai_observations),
        ai_observation_note=body.ai_observation_note,
        is_demo=False,
    )
    db.add(case)
    db.commit()
    db.refresh(case)

    # Add to timeline
    severity_label = (
        "severe" if body.severity_score >= 8
        else "moderate" if body.severity_score >= 5
        else "mild"
    )
    te = TimelineEvent(
        user_id=user_id,
        event_type="post_discharge_case",
        title=f"Post-Discharge Report — {body.pain_location} ({body.severity_score}/10)",
        description=f"Case {case_ref}: {body.changes_since_discharge or body.patient_notes or 'Case submitted.'}",
        severity=severity_label,
        modality=body.communication_methods,
    )
    db.add(te)
    db.commit()

    return _to_response(case)


@router.get("/cases", summary="List post-discharge cases for current patient")
def list_patient_cases(
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    user_id = user.id if user else 1
    cases = (
        db.query(PostDischargeCase)
        .filter(PostDischargeCase.user_id == user_id)
        .order_by(PostDischargeCase.created_at.desc())
        .all()
    )
    return [_to_response(c) for c in cases]


@router.get("/cases/{case_id}", summary="Get a specific post-discharge case")
def get_case(
    case_id: int,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    case = db.query(PostDischargeCase).filter(PostDischargeCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return _to_response(case)


# ── Healthcare Professional Endpoints ─────────────────────────────────────────

@router.get(
    "/doctor/all-cases",
    summary="[Healthcare] List all post-discharge cases across patients",
)
def list_all_cases_for_doctor(
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    """
    Returns all cases.  In production this would be restricted to
    doctors/caregivers; for the demo it is open.
    """
    cases = (
        db.query(PostDischargeCase)
        .order_by(PostDischargeCase.created_at.desc())
        .all()
    )
    result = []
    for c in cases:
        row = _to_response(c)
        # Attach patient name for the doctor view
        pt = db.query(User).filter(User.id == c.user_id).first()
        row["patient_name"] = pt.full_name if pt else f"Patient #{c.user_id}"
        row["patient_email"] = pt.email if pt else ""
        result.append(row)
    return result


@router.put(
    "/doctor/cases/{case_id}/status",
    summary="[Healthcare] Update case review status",
)
def update_case_status(
    case_id: int,
    status: str,
    clinical_notes: Optional[str] = None,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    case = db.query(PostDischargeCase).filter(PostDischargeCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    case.status = status
    if clinical_notes:
        case.caregiver_notes = clinical_notes
    case.updated_at = datetime.datetime.utcnow()
    db.commit()
    return {"success": True, "case_id": case_id, "new_status": status}


# ── Report Data Endpoint ──────────────────────────────────────────────────────

@router.get(
    "/cases/{case_id}/report-data",
    summary="Get structured report data for PDF generation",
)
def get_report_data(
    case_id: int,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    """
    Returns all data needed to render a PDF report on the frontend.
    The PDF is generated client-side (browser) to avoid server-side PDF dependencies.
    """
    case = db.query(PostDischargeCase).filter(PostDischargeCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    pt = db.query(User).filter(User.id == case.user_id).first()
    patient_name = pt.full_name if pt else f"Patient #{case.user_id}"

    # Recent timeline for this patient
    timeline = (
        db.query(TimelineEvent)
        .filter(TimelineEvent.user_id == case.user_id)
        .order_by(TimelineEvent.timestamp.desc())
        .limit(5)
        .all()
    )

    timeline_data = [
        {
            "timestamp": str(e.timestamp),
            "title": e.title,
            "severity": e.severity,
            "modality": e.modality,
        }
        for e in timeline
    ]

    return {
        "report_type": "PainSense AI — Post-Discharge Care Report",
        "generated_at": datetime.datetime.utcnow().isoformat(),
        "case": _to_response(case),
        "patient_name": patient_name,
        "timeline_summary": timeline_data,
        "disclaimer": (
            "PainSense AI is an AI-assisted communication and documentation tool "
            "and is not a medical diagnostic device. Clinical decisions must be made "
            "by a qualified healthcare professional.\n\n"
            "This report uses clearly labelled demo / simulated data for demonstration purposes."
        ),
        "safety_notice": (
            "If the patient reports severe or worsening symptoms, please seek "
            "immediate professional medical attention. Do not rely solely on this "
            "report for clinical decisions."
        ),
    }
