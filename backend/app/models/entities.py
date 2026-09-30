import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="patient")  # patient, caregiver, doctor, admin
    phone_number = Column(String(50), nullable=True)
    emergency_contact_name = Column(String(255), nullable=True)
    emergency_contact_phone = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    assessments = relationship("Assessment", back_populates="user", cascade="all, delete-orphan")
    timeline_events = relationship("TimelineEvent", back_populates="user", cascade="all, delete-orphan")
    consent = relationship("ConsentRecord", back_populates="user", uselist=False, cascade="all, delete-orphan")

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(50), default="completed")  # in_progress, completed, flagged
    overall_severity = Column(String(50), default="none")  # none, mild, moderate, severe
    overall_confidence = Column(Float, default=0.0)
    uncertainty_score = Column(Float, default=0.0)
    communication_methods = Column(String(255), default="")  # e.g., "camera,voice,sign_language,self_report"
    triage_level = Column(String(50), default="routine")  # routine, caution, urgent, emergency
    summary_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="assessments")
    ai_observations = relationship("AIObservation", back_populates="assessment", cascade="all, delete-orphan")
    pain_report = relationship("PainReport", back_populates="assessment", uselist=False, cascade="all, delete-orphan")
    sign_records = relationship("SignRecognitionRecord", back_populates="assessment", cascade="all, delete-orphan")
    voice_records = relationship("VoiceAnalysisRecord", back_populates="assessment", cascade="all, delete-orphan")
    doctor_summaries = relationship("DoctorSummaryRecord", back_populates="assessment", cascade="all, delete-orphan")
    timeline_events = relationship("TimelineEvent", back_populates="assessment", cascade="all, delete-orphan")

class AIObservation(Base):
    __tablename__ = "ai_observations"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    modality = Column(String(50), nullable=False)  # facial, body, acoustic
    tension_score = Column(Float, default=0.0)
    grimace_score = Column(Float, default=0.0)
    guarding_score = Column(Float, default=0.0)
    vocal_strain_score = Column(Float, default=0.0)
    features_json = Column(Text, default="{}")
    confidence = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    assessment = relationship("Assessment", back_populates="ai_observations")

class PainReport(Base):
    """User-reported subjective information. Explicitly distinguished from AI observations."""
    __tablename__ = "pain_reports"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    pain_location = Column(String(100), default="Unspecified")
    severity_score = Column(Integer, default=0)  # 0 to 10
    pain_type = Column(String(50), default="Unspecified")  # sharp, dull, burning, pressure, throbbing, cramping, other
    duration = Column(String(100), default="Recent")
    onset = Column(String(100), default="Gradual")
    additional_symptoms_json = Column(Text, default="[]")
    free_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    assessment = relationship("Assessment", back_populates="pain_report")

class SignRecognitionRecord(Base):
    __tablename__ = "sign_recognition_records"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    recognized_sequence_json = Column(Text, default="[]")
    translated_phrase = Column(String(255), nullable=False)
    user_corrected_phrase = Column(String(255), nullable=True)
    confidence = Column(Float, default=0.0)
    feedback_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    assessment = relationship("Assessment", back_populates="sign_records")

class VoiceAnalysisRecord(Base):
    __tablename__ = "voice_analysis_records"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=True)
    audio_duration_sec = Column(Float, default=0.0)
    transcript = Column(Text, nullable=False)
    extracted_location = Column(String(100), nullable=True)
    extracted_severity = Column(String(50), nullable=True)
    extracted_duration = Column(String(100), nullable=True)
    extracted_pain_type = Column(String(50), nullable=True)
    acoustic_strain_score = Column(Float, default=0.0)
    confidence = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    assessment = relationship("Assessment", back_populates="voice_records")

class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=True)
    event_type = Column(String(50), default="observation")  # observation, report, alert, note
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(50), default="routine")  # none, mild, moderate, severe, emergency
    modality = Column(String(50), default="multimodal")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    user = relationship("User", back_populates="timeline_events")
    assessment = relationship("Assessment", back_populates="timeline_events")

class DoctorSummaryRecord(Base):
    __tablename__ = "doctor_summaries"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    generated_summary = Column(Text, nullable=False)
    clinical_notes = Column(Text, nullable=True)
    review_status = Column(String(50), default="pending")  # pending, reviewed, actioned
    reviewed_by_doctor_id = Column(Integer, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    assessment = relationship("Assessment", back_populates="doctor_summaries")

class CaregiverAlertRecord(Base):
    __tablename__ = "caregiver_alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=True)
    caregiver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    alert_level = Column(String(50), default="info")  # info, warning, urgent
    message = Column(Text, nullable=False)
    acknowledged = Column(Boolean, default=False)
    acknowledged_at = Column(DateTime, nullable=True)
    sent_at = Column(DateTime, default=datetime.datetime.utcnow)

class CaregiverPatientLink(Base):
    __tablename__ = "caregiver_patient_links"

    id = Column(Integer, primary_key=True, index=True)
    caregiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(50), default="active")  # active, pending, revoked
    permissions_json = Column(Text, default='["view_timeline", "receive_alerts", "request_call"]')
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class CallSession(Base):
    __tablename__ = "call_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=True)
    call_type = Column(String(50), default="doctor")  # doctor, caregiver, emergency
    provider = Column(String(50), default="demo")     # demo, twilio, webtrc
    status = Column(String(50), default="initiated")   # initiated, ringing, connected, completed, failed
    notes = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)

class ConsentRecord(Base):
    __tablename__ = "consent_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    camera_consent = Column(Boolean, default=True)
    audio_consent = Column(Boolean, default=True)
    data_retention_consent = Column(Boolean, default=True)
    local_only_mode = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="consent")

class SafetyAuditRecord(Base):
    """Audit log of safety rule triggers, emergency escalations, and system recommendations."""
    __tablename__ = "safety_audit_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=True)
    severity = Column(String(50), default="routine")  # routine, caution, urgent, emergency
    confidence = Column(Float, default=1.0)
    triggered_rules_json = Column(Text, default="[]")
    matched_text = Column(Text, nullable=True)
    recommended_action = Column(String(255), nullable=False)
    action_taken = Column(String(100), default="logged")  # logged, user_notified, doctor_escalated
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

