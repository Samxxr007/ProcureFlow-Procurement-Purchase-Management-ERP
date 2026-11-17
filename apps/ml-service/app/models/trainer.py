import os
import joblib
import datetime
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from ..schemas.models import ExecutionObservation
from ..utils.feature_engineering import CRITICALITY_MAP

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "stored_models")
os.makedirs(MODEL_DIR, exist_ok=True)

class ModelTrainer:
    @staticmethod
    def prepare_dataset(observations: List[ExecutionObservation]) -> Tuple[pd.DataFrame, np.ndarray, List[str]]:
        rows = []
        labels = []
        commit_hashes = []
        
        for obs in observations:
            crit_val = CRITICALITY_MAP.get(obs.criticality.upper(), 1.0)
            change_mag = np.log1p(obs.lines_added + obs.lines_deleted)
            
            row = {
                "file_overlap_ratio": float(obs.file_overlap_ratio),
                "num_changed_files": float(len(obs.changed_files)),
                "change_magnitude": float(change_mag),
                "criticality_score": float(crit_val),
                "historical_failure_rate": float(obs.historical_failure_rate),
                "recent_failure_count": 1.0 if obs.historical_failure_rate > 0.2 else 0.0,
                "flakiness_score": float(obs.flakiness_score),
                "avg_duration_sec": float(obs.avg_duration_ms) / 1000.0,
            }
            rows.append(row)
            labels.append(1 if obs.actual_outcome.upper() in ["FAILED", "FAILURE"] else 0)
            commit_hashes.append(obs.commit_hash)
            
        df = pd.DataFrame(rows)
        y = np.array(labels)
        return df, y, commit_hashes

    @staticmethod
    def train_and_evaluate(
        observations: List[ExecutionObservation],
        algorithm: str = "RandomForest"
    ) -> Dict[str, Any]:
        if len(observations) < 5:
            raise ValueError(f"Insufficient observations to train: {len(observations)} provided, minimum 5 required.")

        X, y, commits = ModelTrainer.prepare_dataset(observations)
        
        # Chronological / ordered train-test split (80% train, 20% test)
        split_idx = max(int(len(X) * 0.8), len(X) - max(1, int(len(X) * 0.2)))
        X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]
        
        # Ensure at least 1 sample in test if possible
        if len(X_test) == 0:
            X_test, y_test = X_train, y_train

        if algorithm.lower() == "logisticregression":
            model = LogisticRegression(class_weight="balanced", max_iter=500, random_state=42)
        else:
            model = RandomForestClassifier(
                n_estimators=50,
                max_depth=5,
                class_weight="balanced",
                random_state=42
            )
            
        model.fit(X_train, y_train)
        
        # Evaluation
        preds = model.predict(X_test)
        
        # Check if predict_proba is supported
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(X_test)
            if probs.shape[1] > 1:
                prob_pos = probs[:, 1]
            else:
                prob_pos = np.zeros(len(X_test))
        else:
            prob_pos = preds.astype(float)
            
        acc = float(accuracy_score(y_test, preds))
        
        # Calculate precision, recall, f1 with zero_division handling
        prec = float(precision_score(y_test, preds, zero_division=0))
        rec = float(recall_score(y_test, preds, zero_division=0))
        f1 = float(f1_score(y_test, preds, zero_division=0))
        
        # ROC-AUC calculation
        try:
            if len(np.unique(y_test)) > 1:
                roc_auc = float(roc_auc_score(y_test, prob_pos))
            else:
                roc_auc = 0.5
        except Exception:
            roc_auc = 0.5
            
        timestamp_str = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d_%H%M%S")
        version = f"v_{algorithm.lower()}_{timestamp_str}"
        model_path = os.path.join(MODEL_DIR, f"{version}.joblib")
        
        bundle = {
            "version": version,
            "algorithm": algorithm,
            "model": model,
            "feature_names": list(X.columns),
            "metrics": {
                "accuracy": acc,
                "precision": prec,
                "recall": rec,
                "f1_score": f1,
                "roc_auc": roc_auc,
            },
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "trained_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        
        joblib.dump(bundle, model_path)
        joblib.dump(bundle, os.path.join(MODEL_DIR, "latest.joblib"))
        
        return bundle
