import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.entities import (
    Assessment, User, AIObservation, PainReport, SignRecognitionRecord,
    VoiceAnalysisRecord, TimelineEvent, DoctorSummaryRecord
)
from backend.app.schemas.schemas import (
    MultimodalFusionRequest, MultimodalFusionResponse,
    PainReportCreate
)
from backend.app.services.fusion_service import fusion_service
from backend.app.services.doctor_service import doctor_service
from backend.app.services.fhir.fhir_exporter import FHIRExporter
from backend.app.auth.deps import get_optional_user

router = APIRouter(prefix="/assessment", tags=["Assessment"])

@router.post("/fuse-and-save", response_model=MultimodalFusionResponse)
def complete_assessment(
    req: MultimodalFusionRequest,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user)
):
    # Perform multimodal fusion
    fusion_result = fusion_service.fuse(
        facial=req.facial_result,
        body=req.body_result,
        voice=req.voice_result,
        sign=req.sign_result,
        self_report=req.self_report,
        notes=req.notes
    )

    # Resolve target user
    user_id = user.id if user else (req.user_id or 1)

    # Persist Assessment Record
    assessment = Assessment(
        user_id=user_id,
        status="completed",
        overall_severity=fusion_result.severity,
        overall_confidence=fusion_result.confidence,
        uncertainty_score=fusion_result.uncertainty,
        communication_methods=",".join(fusion_result.communication_methods),
        triage_level=fusion_result.triage_level,
        summary_text=fusion_result.summary_text
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    # Persist PainReport if self-reported
    if req.self_report:
        pr = PainReport(
            assessment_id=assessment.id,
            pain_location=req.self_report.pain_location,
            severity_score=req.self_report.severity_score,
            pain_type=req.self_report.pain_type,
            duration=req.self_report.duration,
            onset=req.self_report.onset,
            additional_symptoms_json=json.dumps(req.self_report.additional_symptoms),
            free_text=req.self_report.free_text
        )
        db.add(pr)

    # Persist Facial / Body Observations
    if req.facial_result:
        obs_f = AIObservation(
            assessment_id=assessment.id,
            modality="facial",
            tension_score=req.facial_result.mouth_tension,
            grimace_score=req.facial_result.grimace_score,
            confidence=req.facial_result.confidence,
            features_json=json.dumps({
                "brow_furrowing": req.facial_result.brow_furrowing,
                "orbital_tightening": req.facial_result.orbital_tightening,
                "mouth_tension": req.facial_result.mouth_tension
            }),
            notes="; ".join(req.facial_result.observable_indicators)
        )
        db.add(obs_f)

    if req.body_result:
        obs_b = AIObservation(
            assessment_id=assessment.id,
            modality="body",
            guarding_score=req.body_result.postural_guarding,
            confidence=req.body_result.confidence,
            features_json=json.dumps({
                "shoulder_tension": req.body_result.shoulder_tension,
                "movement_asymmetry": req.body_result.movement_asymmetry
            }),
            notes="; ".join(req.body_result.observable_indicators)
        )
        db.add(obs_b)

    # Persist Sign Recognition Record
    if req.sign_result and req.sign_result.recognized_signs:
        sr = SignRecognitionRecord(
            assessment_id=assessment.id,
            user_id=user_id,
            recognized_sequence_json=json.dumps(req.sign_result.recognized_signs),
            translated_phrase=req.sign_result.translated_phrase,
            confidence=req.sign_result.confidence
        )
        db.add(sr)

    # Persist Voice Record
    if req.voice_result:
        vr = VoiceAnalysisRecord(
            assessment_id=assessment.id,
            transcript=req.voice_result.transcript,
            extracted_location=req.voice_result.extracted_location,
            extracted_severity=req.voice_result.extracted_severity,
            extracted_duration=req.voice_result.extracted_duration,
            extracted_pain_type=req.voice_result.extracted_pain_type,
            acoustic_strain_score=req.voice_result.acoustic_strain_score,
            confidence=req.voice_result.confidence
        )
        db.add(vr)

    # Add to Timeline
    timeline_title = f"{fusion_result.severity.capitalize()} Pain Assessment ({', '.join(fusion_result.communication_methods[:2])})"
    te = TimelineEvent(
        user_id=user_id,
        assessment_id=assessment.id,
        event_type="assessment",
        title=timeline_title,
        description=fusion_result.summary_text,
        severity=fusion_result.severity,
        modality=",".join(fusion_result.communication_methods)
    )
    db.add(te)

    # Generate Clinical Doctor Handover Record
    patient_name = user.full_name if user else "Demo Patient"
    doc_summary_data = doctor_service.generate_clinical_summary(
        assessment_id=assessment.id,
        patient_name=patient_name,
        patient_id=user_id,
        communication_methods=fusion_result.communication_methods,
        reported_pain={
            "location": req.self_report.pain_location if req.self_report else "Communicated non-verbally",
            "severity": f"{req.self_report.severity_score}/10" if req.self_report else fusion_result.severity.capitalize(),
            "duration": req.self_report.duration if req.self_report else "Acute",
            "type": req.self_report.pain_type if req.self_report else "Aching",
            "symptoms": req.self_report.additional_symptoms if req.self_report else []
        },
        ai_observations={"indicators": fusion_result.observed_indicators},
        triage_level=fusion_result.triage_level
    )

    doc_record = DoctorSummaryRecord(
        assessment_id=assessment.id,
        patient_id=user_id,
        generated_summary=doc_summary_data["clinical_summary"],
        review_status="pending"
    )
    db.add(doc_record)

    db.commit()

    fusion_result.assessment_id = assessment.id
    return fusion_result

@router.get("/history")
def get_assessment_history(
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user)
):
    user_id = user.id if user else 1
    assessments = db.query(Assessment).filter(Assessment.user_id == user_id).order_by(Assessment.created_at.desc()).limit(20).all()

    results = []
    for a in assessments:
        results.append({
            "id": a.id,
            "created_at": a.created_at,
            "severity": a.overall_severity,
            "confidence": a.overall_confidence,
            "uncertainty": a.uncertainty_score,
            "communication_methods": a.communication_methods.split(",") if a.communication_methods else [],
            "triage_level": a.triage_level,
            "summary_text": a.summary_text
        })
    return results

@router.get("/{id}")
def get_assessment_detail(id: int, db: Session = Depends(get_db)):
    a = db.query(Assessment).filter(Assessment.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assessment not found")

    pain_rep = None
    if a.pain_report:
        pain_rep = {
            "location": a.pain_report.pain_location,
            "severity": a.pain_report.severity_score,
            "type": a.pain_report.pain_type,
            "duration": a.pain_report.duration,
            "onset": a.pain_report.onset,
            "symptoms": json.loads(a.pain_report.additional_symptoms_json or "[]"),
            "free_text": a.pain_report.free_text
        }

    return {
        "id": a.id,
        "created_at": a.created_at,
        "severity": a.overall_severity,
        "confidence": a.overall_confidence,
        "uncertainty": a.uncertainty_score,
        "communication_methods": a.communication_methods.split(",") if a.communication_methods else [],
        "triage_level": a.triage_level,
        "summary_text": a.summary_text,
        "pain_report": pain_rep,
        "ai_observations": [
            {
                "modality": obs.modality,
                "notes": obs.notes,
                "confidence": obs.confidence
            }
            for obs in a.ai_observations
        ]
    }

@router.get("/{id}/fhir")
def get_assessment_fhir_bundle(id: int, db: Session = Depends(get_db)):
    """Exports assessment as an HL7 FHIR R4 standard JSON collection Bundle."""
    a = db.query(Assessment).filter(Assessment.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assessment not found")

    user = db.query(User).filter(User.id == a.user_id).first()
    patient_name = user.full_name if user else f"Patient #{a.user_id}"

    severity_score = 0
    pain_loc = "Unspecified"
    pain_type = "Unspecified"
    if a.pain_report:
        severity_score = a.pain_report.severity_score or 0
        pain_loc = a.pain_report.pain_location or "Unspecified"
        pain_type = a.pain_report.pain_type or "Unspecified"
    else:
        # Map qualitative severity to 0-10 scale if no report exists
        sev_map = {"none": 0, "mild": 3, "moderate": 6, "severe": 9, "emergency": 10}
        severity_score = sev_map.get(str(a.overall_severity).lower(), 5)

    bundle = FHIRExporter.export_assessment_to_fhir(
        assessment_id=a.id,
        patient_id=a.user_id,
        patient_name=patient_name,
        severity_score=severity_score,
        pain_location=pain_loc,
        pain_type=pain_type,
        summary_text=a.summary_text or f"Assessment #{a.id}",
        triage_level=a.triage_level or "routine",
        timestamp=a.created_at
    )
    return bundle

