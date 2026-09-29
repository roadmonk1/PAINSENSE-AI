from fastapi import APIRouter
from backend.app.schemas.schemas import MultimodalFusionRequest, MultimodalFusionResponse
from backend.app.services.fusion_service import fusion_service

router = APIRouter(prefix="/fusion", tags=["Multimodal Fusion"])

@router.post("/analyze", response_model=MultimodalFusionResponse)
def analyze_multimodal(req: MultimodalFusionRequest):
    return fusion_service.fuse(
        facial=req.facial_result,
        body=req.body_result,
        voice=req.voice_result,
        sign=req.sign_result,
        self_report=req.self_report,
        notes=req.notes
    )
