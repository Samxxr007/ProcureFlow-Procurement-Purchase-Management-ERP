# ProcureFlow — Regression Test Selection Methodology

## 1. Git Change Impact Analysis
Using `simple-git`, ProcureFlow inspects the changes between the base commit and target commit:
- Changed file paths
- Lines added and lines deleted
- Commit author, message, and timestamp

## 2. Feature Vector Engineering
For every candidate test case in the test catalog, a feature vector is extracted:
1. `file_overlap_ratio`: Jaccard-style path overlap between test's declared source files and Git diff paths.
2. `num_changed_files`: Total number of altered source files.
3. `change_magnitude`: Log-normalized count of lines added and deleted (`log1p(additions + deletions)`).
4. `criticality_score`: Numerical encoding of criticality (`CRITICAL` = 3.0, `HIGH` = 2.0, `MEDIUM` = 1.0, `LOW` = 0.5).
5. `historical_failure_rate`: Ratio of observed historical failures for this test case.
6. `flakiness_score`: Variance across consecutive executions.
7. `avg_duration_sec`: Execution cost in seconds.

## 3. Confidence-Aware Adaptive Scope
The system calculates an **Evidence Readiness Score** based on observed commits, total execution observations, and failure examples. Testing scope is routed as follows:

| Mode | Condition | Execution Scope |
|---|---|---|
| `FULL` | Readiness < 0.35 or cold start | 100% of test suites executed |
| `EXPANDED` | 0.35 <= Readiness < 0.70 | Affected tests + high risk + critical security suites |
| `SELECTIVE` | Readiness >= 0.70 | High risk candidates + directly modified paths |
| `SHADOW` | Background verification | Full suite runs while evaluating selective predictions |
