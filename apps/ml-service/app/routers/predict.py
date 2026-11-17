from fastapi import APIRouter, HTTPException
from ..schemas.models import PredictRequest, PredictResponse
from ..models.predictor import ModelPredictor

router = APIRouter(prefix="/predict", tags=["prediction"])

@router.post("", response_model=PredictResponse)
async def predict_regression_suite(request: PredictRequest):
    try:
        return ModelPredictor.predict_regression_suite(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")
