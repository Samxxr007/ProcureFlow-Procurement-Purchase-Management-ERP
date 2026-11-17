from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ChangedFileInfo(BaseModel):
    file_path: str
    change_type: str = "MODIFY"
    additions: int = 0
    deletions: int = 0

class TestCandidate(BaseModel):
    test_id: str
    module: str
    related_source_files: List[str]
    criticality: str = "HIGH"
    avg_duration_ms: int = 50
    historical_failure_rate: float = 0.0
    recent_failure_count: int = 0
    flakiness_score: float = 0.0

class PredictRequest(BaseModel):
    commit_hash: str
    changed_files: List[ChangedFileInfo]
    test_candidates: List[TestCandidate]
    model_version: Optional[str] = "latest"

class TestPredictionResult(BaseModel):
    test_id: str
    probability: float
    predicted_outcome: str  # "FAILED" or "PASSED"
    feature_score: float
    selection_decision: str  # "SELECTED" or "SKIPPED"
    confidence_score: float
    reason: str

class PredictResponse(BaseModel):
    commit_hash: str
    model_version: str
    model_available: bool
    mode_recommendation: str  # "FULL", "EXPANDED", "SELECTIVE"
    predictions: List[TestPredictionResult]
    total_candidates: int
    selected_count: int
    readiness_score: float

class ExecutionObservation(BaseModel):
    commit_hash: str
    test_id: str
    module: str
    changed_files: List[str]
    file_overlap_ratio: float
    lines_added: int = 0
    lines_deleted: int = 0
    criticality: str = "HIGH"
    historical_failure_rate: float = 0.0
    flakiness_score: float = 0.0
    avg_duration_ms: int = 50
    actual_outcome: str  # "FAILED" or "PASSED"

class TrainRequest(BaseModel):
    observations: List[ExecutionObservation]
    algorithm: Optional[str] = "RandomForest"  # "RandomForest" or "LogisticRegression"

class TrainResponse(BaseModel):
    model_version: str
    algorithm: str
    train_samples: int
    test_samples: int
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    metrics: Dict[str, Any]
    message: str

class ModelStatusResponse(BaseModel):
    model_available: bool
    current_version: Optional[str] = None
    algorithm: Optional[str] = None
    trained_at: Optional[str] = None
    train_samples: int = 0
    test_samples: int = 0
    metrics: Dict[str, Any] = {}
    readiness_score: float = 0.0
    readiness_factors: Dict[str, Any] = {}
