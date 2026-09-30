import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# --- User & Auth ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "patient"
    phone_number: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# --- Camera / Facial / Body ---
class LandmarkPoint(BaseModel):
    x: float
    y: float
    z: Optional[float] = 0.0
    visibility: Optional[float] = 1.0

class CameraAnalysisRequest(BaseModel):
    image_base64: Optional[str] = None
    landmarks: Optional[List[Dict[str, float]]] = None
    client_features: Optional[Dict[str, float]] = None
    mode: str = "face_and_body"  # face, body, or face_and_body

class FacialAnalysisResult(BaseModel):
    brow_furrowing: float = Field(0.0, ge=0.0, le=1.0)
    orbital_tightening: float = Field(0.0, ge=0.0, le=1.0)
    mouth_tension: float = Field(0.0, ge=0.0, le=1.0)
    grimace_score: float = Field(0.0, ge=0.0, le=1.0)
    tension_level: str = "Low"  # Low, Moderate, High
    confidence: float = Field(0.0, ge=0.0, le=1.0)
    observable_indicators: List[str] = []
    model_status: str = "active"  # active, heuristic_prototype, unavailable

class BodyAnalysisResult(BaseModel):
    postural_guarding: float = Field(0.0, ge=0.0, le=1.0)
    shoulder_tension: float = Field(0.0, ge=0.0, le=1.0)
    movement_asymmetry: float = Field(0.0, ge=0.0, le=1.0)
    protective_posture_detected: bool = False
    confidence: float = Field(0.0, ge=0.0, le=1.0)
    observable_indicators: List[str] = []

class CameraAnalysisResponse(BaseModel):
    facial: FacialAnalysisResult
    body: BodyAnalysisResult
    combined_tension_score: float
    confidence: float
    summary: str
    disclaimer: str = "AI observation only — does not constitute a medical diagnosis."

# --- Voice / Audio ---
class VoiceAnalysisRequest(BaseModel):
    transcript: Optional[str] = None
    audio_base64: Optional[str] = None
    acoustic_features: Optional[Dict[str, float]] = None

class VoiceAnalysisResponse(BaseModel):
    transcript: str
    extracted_location: Optional[str] = "Unspecified"
    extracted_severity: Optional[str] = "Moderate"
    extracted_duration: Optional[str] = "Recent"
    extracted_pain_type: Optional[str] = "Unspecified"
    extracted_symptoms: List[str] = []
    acoustic_strain_score: float = 0.0
    vocal_tremor_detected: bool = False
    confidence: float = 0.0
    provider_used: str = "local_heuristic"
    disclaimer: str = "Voice analysis is supportive observation only."

# --- Sign Language ---
class SignSequenceInput(BaseModel):
    signs: List[str]
    confidence_scores: Optional[List[float]] = None
    language_code: Optional[str] = "asl"
    user_id: Optional[int] = None
    timestamp: Optional[datetime.datetime] = None

class SignRecognitionResponse(BaseModel):
    language_code: Optional[str] = "asl"
    language_name: Optional[str] = "American Sign Language"
    region: Optional[str] = None
    recognized_signs: List[str]
    confidence: float
    translated_phrase: str
    concept_breakdown: Dict[str, str] = {}
    suggested_clarification: Optional[str] = None
    two_way_response_text: str
    two_way_response_speech: str
    action_hint: Optional[str] = "routine"

class SignFeedbackInput(BaseModel):
    recognized_signs: List[str]
    suggested_phrase: str
    corrected_phrase: str
    notes: Optional[str] = None

# --- Self-Reported Pain ---
class PainReportCreate(BaseModel):
    pain_location: str
    severity_score: int = Field(..., ge=0, le=10)
    pain_type: str = "Aching"  # Sharp, Dull, Burning, Pressure, Throbbing, Cramping, Aching, Other
    duration: str = "Less than 24 hours"
    onset: str = "Gradual"
    additional_symptoms: List[str] = []
    free_text: Optional[str] = None

class PainReportResponse(PainReportCreate):
    id: int
    assessment_id: Optional[int] = None
    created_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

# --- Multimodal Fusion ---
class MultimodalFusionRequest(BaseModel):
    user_id: Optional[int] = None
    facial_result: Optional[FacialAnalysisResult] = None
    body_result: Optional[BodyAnalysisResult] = None
    voice_result: Optional[VoiceAnalysisResponse] = None
    sign_result: Optional[SignRecognitionResponse] = None
    self_report: Optional[PainReportCreate] = None
    notes: Optional[str] = None

class FusionExplanation(BaseModel):
    primary_evidence: List[str] = []
    supporting_evidence: List[str] = []
    conflicting_evidence: List[str] = []
    missing_evidence: List[str] = []
    confidence_rationale: str = "High concordance"
    uncertainty_breakdown: str = "Normal sensor variance"
    why_this_result: str = "User self-report confirmed by supportive telemetry."

class MultimodalFusionResponse(BaseModel):
    assessment_id: Optional[int] = None
    observed_indicators: List[str]
    reported_symptoms: List[str]
    severity: str  # none, mild, moderate, severe
    confidence: float
    communication_methods: List[str]
    uncertainty: float
    triage_level: str  # routine, caution, urgent, emergency
    recommended_next_step: str
    summary_text: str
    is_emergency: bool = False
    explanation: Optional[FusionExplanation] = None
    disclaimer: str = "AI-generated assessment — not a medical diagnosis. A qualified healthcare professional must evaluate medical conditions."

# --- Timeline ---
class TimelineEventResponse(BaseModel):
    id: int
    user_id: int
    assessment_id: Optional[int] = None
    event_type: str
    title: str
    description: Optional[str] = None
    severity: str
    modality: str
    timestamp: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

# --- Safety & Red Flags ---
class SafetyAssessmentRequest(BaseModel):
    reported_symptoms: List[str]
    pain_location: Optional[str] = None
    severity_score: Optional[int] = 0
    duration: Optional[str] = None

class SafetyAssessmentResponse(BaseModel):
    is_urgent: bool
    is_emergency: bool
    flagged_concerns: List[str]
    recommended_action: str
    suggested_contacts: List[Dict[str, str]]
    disclaimer: str

# --- Doctor Assistance ---
class DoctorSummaryResponse(BaseModel):
    assessment_id: int
    patient_id: int
    patient_name: str
    timestamp: datetime.datetime
    communication_methods: List[str]
    reported_pain: Dict[str, Any]
    ai_observations: Dict[str, Any]
    clinical_summary: str
    triage_level: str
    confidence_assessment: str
    recommendations_for_clinician: List[str]
    disclaimer: str = "AI-generated clinical handover summary. Not a diagnosis. Doctor retains full independent clinical responsibility."

# --- Calling Service ---
class CallRequest(BaseModel):
    target: str = "doctor"  # doctor, caregiver, emergency
    assessment_id: Optional[int] = None
    phone_number: Optional[str] = None

class CallResponse(BaseModel):
    session_id: int
    target: str
    provider: str  # 'demo' or 'telephony'
    status: str
    message: str
    summary_text: str
    telemetry: Dict[str, Any]

# --- Caregiver ---
class CaregiverAlertCreate(BaseModel):
    patient_id: int
    alert_level: str  # info, warning, urgent
    message: str
    assessment_id: Optional[int] = None

class CaregiverAlertResponse(BaseModel):
    id: int
    patient_id: int
    alert_level: str
    message: str
    acknowledged: bool
    sent_at: datetime.datetime

# --- Privacy & Consent ---
class ConsentUpdate(BaseModel):
    camera_consent: bool = True
    audio_consent: bool = True
    data_retention_consent: bool = True
    local_only_mode: bool = False

class ConsentResponse(ConsentUpdate):
    user_id: int
    updated_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)
