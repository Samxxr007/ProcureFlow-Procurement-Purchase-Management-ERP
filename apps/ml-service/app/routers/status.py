from fastapi import APIRouter
from ..schemas.models import ModelStatusResponse
from ..models.predictor import ModelPredictor

router = APIRouter(prefix="/status", tags=["status"])

@router.get("", response_model=ModelStatusResponse)
async def get_status():
    return ModelPredictor.get_model_status()
