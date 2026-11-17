import os
import joblib
from typing import List, Optional, Dict, Any
from ..schemas.models import (
    PredictRequest,
    PredictResponse,
    TestPredictionResult,
    ModelStatusResponse
)
from ..utils.feature_engineering import extract_prediction_features, build_feature_dataframe

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "stored_models")

class ModelPredictor:
    @staticmethod
    def get_latest_model() -> Optional[Dict[str, Any]]:
        latest_path = os.path.join(MODEL_DIR, "latest.joblib")
        if os.path.exists(latest_path):
            try:
                return joblib.load(latest_path)
            except Exception:
                return None
        return None

    @staticmethod
    def get_model_status() -> ModelStatusResponse:
        bundle = ModelPredictor.get_latest_model()
        if not bundle:
            return ModelStatusResponse(
                model_available=False,
                readiness_score=0.15,
                readiness_factors={
                    "evidence_level": "insufficient_data",
                    "observation_count": 0,
                    "mode_fallback": "FULL",
                    "message": "No model has been trained yet. Historical execution data needed."
                }
            )
            
        metrics = bundle.get("metrics", {})
        train_samples = bundle.get("train_samples", 0)
        
        # Calculate transparent readiness score based on empirical evidence
        evidence_factor = min(1.0, train_samples / 50.0)
        eval_factor = metrics.get("f1_score", 0.5)
        readiness = float(round(0.6 * evidence_factor + 0.4 * eval_factor, 3))
        
        return ModelStatusResponse(
            model_available=True,
            current_version=bundle.get("version"),
            algorithm=bundle.get("algorithm"),
            trained_at=bundle.get("trained_at"),
            train_samples=train_samples,
            test_samples=bundle.get("test_samples", 0),
            metrics=metrics,
            readiness_score=readiness,
            readiness_factors={
                "evidence_factor": round(evidence_factor, 2),
                "evaluation_factor": round(eval_factor, 2),
                "samples_count": train_samples
            }
        )

    @staticmethod
    def predict_regression_suite(request: PredictRequest) -> PredictResponse:
        bundle = ModelPredictor.get_latest_model()
        status = ModelPredictor.get_model_status()
        
        # If model is unavailable or readiness < 0.4, fall back to FULL suite
        if not bundle or status.readiness_score < 0.35:
            predictions = []
            for tc in request.test_candidates:
                # Heuristic file overlap for fallback explanation
                from ..utils.feature_engineering import compute_file_overlap
                overlap = compute_file_overlap(tc.related_source_files, request.changed_files)
                is_selected = True  # In full fallback, all are selected
                
                predictions.append(TestPredictionResult(
                    test_id=tc.test_id,
                    probability=round(max(0.1, overlap * 0.9), 3),
                    predicted_outcome="PASSED",
                    feature_score=round(overlap, 3),
                    selection_decision="SELECTED",
                    confidence_score=round(status.readiness_score, 3),
                    reason="Model readiness below threshold or cold start - executing FULL regression suite for safety."
                ))
                
            return PredictResponse(
                commit_hash=request.commit_hash,
                model_version=bundle.get("version") if bundle else "fallback_heuristic",
                model_available=bool(bundle),
                mode_recommendation="FULL",
                predictions=predictions,
                total_candidates=len(request.test_candidates),
                selected_count=len(predictions),
                readiness_score=status.readiness_score
            )
            
        # Model is available! Extract features for each candidate
        features_list = [
            extract_prediction_features(request.changed_files, tc)
            for tc in request.test_candidates
        ]
        df_features = build_feature_dataframe(features_list)
        
        model = bundle["model"]
        probabilities = model.predict_proba(df_features)[:, 1] if hasattr(model, "predict_proba") else [0.2] * len(df_features)
        
        predictions = []
        selected_count = 0
        
        # Mode recommendation based on readiness
        if status.readiness_score >= 0.70:
            recommended_mode = "SELECTIVE"
            prob_threshold = 0.25
        elif status.readiness_score >= 0.45:
            recommended_mode = "EXPANDED"
            prob_threshold = 0.15
        else:
            recommended_mode = "FULL"
            prob_threshold = 0.0
            
        for i, tc in enumerate(request.test_candidates):
            prob = float(round(probabilities[i], 3))
            feat = features_list[i]
            
            # Selection rules:
            # 1. High probability >= threshold
            # 2. Direct file overlap > 0
            # 3. Criticality == CRITICAL in expanded/selective
            is_critical = tc.criticality.upper() == "CRITICAL"
            has_overlap = feat["file_overlap_ratio"] > 0
            
            if recommended_mode == "FULL":
                selected = True
                reason = "FULL mode active: all tests executed."
            elif recommended_mode == "EXPANDED":
                selected = (prob >= prob_threshold) or has_overlap or is_critical
                reason = f"EXPANDED mode: overlap={has_overlap}, crit={is_critical}, prob={prob}"
            else: # SELECTIVE
                selected = (prob >= prob_threshold) or has_overlap or (is_critical and feat["file_overlap_ratio"] > 0)
                reason = f"SELECTIVE mode: risk probability={prob:.2f}, overlap={feat['file_overlap_ratio']:.2f}"
                
            if selected:
                selected_count += 1
                
            pred_outcome = "FAILED" if prob >= 0.5 else "PASSED"
            
            predictions.append(TestPredictionResult(
                test_id=tc.test_id,
                probability=prob,
                predicted_outcome=pred_outcome,
                feature_score=round(feat["file_overlap_ratio"], 3),
                selection_decision="SELECTED" if selected else "SKIPPED",
                confidence_score=round(status.readiness_score, 3),
                reason=reason
            ))
            
        # Sort predictions in descending order of failure risk probability
        predictions.sort(key=lambda x: x.probability, reverse=True)
        
        return PredictResponse(
            commit_hash=request.commit_hash,
            model_version=bundle.get("version", "v_latest"),
            model_available=True,
            mode_recommendation=recommended_mode,
            predictions=predictions,
            total_candidates=len(request.test_candidates),
            selected_count=selected_count,
            readiness_score=status.readiness_score
        )
