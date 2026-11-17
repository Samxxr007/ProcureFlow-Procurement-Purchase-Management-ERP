from fastapi import APIRouter, HTTPException
from ..schemas.models import TrainRequest, TrainResponse
from ..models.trainer import ModelTrainer

router = APIRouter(prefix="/train", tags=["training"])

@router.post("", response_model=TrainResponse)
async def train_model(request: TrainRequest):
    try:
        bundle = ModelTrainer.train_and_evaluate(
            request.observations,
            algorithm=request.algorithm or "RandomForest"
        )
        return TrainResponse(
            model_version=bundle["version"],
            algorithm=bundle["algorithm"],
            train_samples=bundle["train_samples"],
            test_samples=bundle["test_samples"],
            accuracy=bundle["metrics"]["accuracy"],
            precision=bundle["metrics"]["precision"],
            recall=bundle["metrics"]["recall"],
            f1_score=bundle["metrics"]["f1_score"],
            roc_auc=bundle["metrics"]["roc_auc"],
            metrics=bundle["metrics"],
            message="Model successfully trained and evaluated on chronological split."
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training error: {str(e)}")
