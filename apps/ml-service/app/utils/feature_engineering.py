import numpy as np
import pandas as pd
from typing import List, Dict, Any
from ..schemas.models import ChangedFileInfo, TestCandidate

CRITICALITY_MAP = {
    "CRITICAL": 3.0,
    "HIGH": 2.0,
    "MEDIUM": 1.0,
    "LOW": 0.5
}

def compute_file_overlap(test_files: List[str], changed_files: List[ChangedFileInfo]) -> float:
    if not test_files or not changed_files:
        return 0.0
    
    changed_paths = [cf.file_path.replace("\\", "/").lower() for cf in changed_files]
    matches = 0
    
    for tf in test_files:
        tf_norm = tf.replace("\\", "/").lower()
        for cp in changed_paths:
            if cp in tf_norm or tf_norm in cp:
                matches += 1
                break
                
    return min(1.0, matches / max(1, len(test_files)))

def extract_prediction_features(
    changed_files: List[ChangedFileInfo],
    candidate: TestCandidate
) -> Dict[str, float]:
    file_overlap = compute_file_overlap(candidate.related_source_files, changed_files)
    
    total_additions = sum(cf.additions for cf in changed_files)
    total_deletions = sum(cf.deletions for cf in changed_files)
    change_magnitude = np.log1p(total_additions + total_deletions)
    
    num_changed_files = len(changed_files)
    crit_val = CRITICALITY_MAP.get(candidate.criticality.upper(), 1.0)
    
    features = {
        "file_overlap_ratio": float(file_overlap),
        "num_changed_files": float(num_changed_files),
        "change_magnitude": float(change_magnitude),
        "criticality_score": float(crit_val),
        "historical_failure_rate": float(candidate.historical_failure_rate),
        "recent_failure_count": float(candidate.recent_failure_count),
        "flakiness_score": float(candidate.flakiness_score),
        "avg_duration_sec": float(candidate.avg_duration_ms) / 1000.0,
    }
    
    return features

def build_feature_dataframe(feature_list: List[Dict[str, float]]) -> pd.DataFrame:
    df = pd.DataFrame(feature_list)
    expected_cols = [
        "file_overlap_ratio",
        "num_changed_files",
        "change_magnitude",
        "criticality_score",
        "historical_failure_rate",
        "recent_failure_count",
        "flakiness_score",
        "avg_duration_sec",
    ]
    for col in expected_cols:
        if col not in df.columns:
            df[col] = 0.0
    return df[expected_cols]
