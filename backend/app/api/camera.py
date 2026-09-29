from fastapi import APIRouter
from backend.app.schemas.schemas import CameraAnalysisRequest, CameraAnalysisResponse, FacialAnalysisResult, BodyAnalysisResult
from backend.app.services.camera_service import facial_service, body_service

router = APIRouter(prefix="/camera", tags=["Camera & Vision"])

@router.post("/analyze", response_model=CameraAnalysisResponse)
def analyze_camera_frame(req: CameraAnalysisRequest):
    facial_dict = facial_service.analyze_features(req.client_features)
    body_dict = body_service.analyze_body_signals(req.client_features)

    combined_score = round((facial_dict["grimace_score"] * 0.6) + (body_dict["postural_guarding"] * 0.4), 2)
    confidence = round((facial_dict["confidence"] + body_dict["confidence"]) / 2, 2)

    summary = (
        f"Facial tension: {facial_dict['tension_level']} (score: {facial_dict['grimace_score']}). "
        f"Musculoskeletal posture: {'Protective posture noted' if body_dict['protective_posture_detected'] else 'Neutral'}."
    )

    return CameraAnalysisResponse(
        facial=FacialAnalysisResult(**facial_dict),
        body=BodyAnalysisResult(**body_dict),
        combined_tension_score=combined_score,
        confidence=confidence,
        summary=summary,
        disclaimer="AI observation only — does not constitute a medical diagnosis."
    )

@router.get("/status")
def camera_model_status():
    return {
        "status": "online",
        "pipeline": "FacialPainAnalysis (PSPI) + BodySignalAnalysis",
        "client_inference_supported": True,
        "supported_landmarks": ["MediaPipe FaceMesh", "MediaPipe Pose"]
    }
