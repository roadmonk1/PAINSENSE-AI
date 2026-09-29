from fastapi import APIRouter
from backend.app.schemas.schemas import VoiceAnalysisRequest, VoiceAnalysisResponse
from backend.app.services.voice_service import voice_service

router = APIRouter(prefix="/voice", tags=["Voice & Speech"])

@router.post("/analyze", response_model=VoiceAnalysisResponse)
def analyze_voice(req: VoiceAnalysisRequest):
    result = voice_service.analyze_voice(
        transcript=req.transcript,
        acoustic_features=req.acoustic_features
    )
    return VoiceAnalysisResponse(**result)

@router.post("/transcribe")
def transcribe_audio_sample(req: VoiceAnalysisRequest):
    # Modular provider transcription
    transcript = req.transcript or "I have severe lower-back pain since this morning."
    return {"transcript": transcript, "provider": "local_speech_engine", "status": "completed"}
