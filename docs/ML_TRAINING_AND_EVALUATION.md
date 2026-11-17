# ProcureFlow — Machine Learning Training & Evaluation

## 1. Machine Learning Stack
- **Runtimes**: Python 3.13, FastAPI, scikit-learn, pandas, numpy, joblib.
- **Algorithms**:
  - `RandomForestClassifier`: 50 estimators, max depth 5, balanced class weighting. Primary candidate model.
  - `LogisticRegression`: max iterations 500, balanced class weighting. Baseline model.

## 2. Chronological Split (Information Leakage Prevention)
To prevent temporal data leakage, observations are sorted chronologically:
- 80% oldest commits form the training set ($X_{train}, y_{train}$).
- 20% newest commits form the holdout test set ($X_{test}, y_{test}$).

## 3. Evaluation Metrics Recorded
Upon training via `POST /api/qa/model/train`, the model records:
- Classification Accuracy
- Precision (handling zero-division)
- Recall
- F1-Score
- Area Under ROC Curve (ROC-AUC)

## 4. Cold-Start Handling
If fewer than 5 observations exist, the API cleanly returns HTTP 400 Bad Request stating that insufficient historical observations have been logged. The selector automatically falls back to `FULL` regression mode with safety explanations.
