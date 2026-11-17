import axios from 'axios';
import { prisma } from '../prisma';
import { ENV } from '../config/env';
import { GitAnalysisService } from './GitAnalysisService';
import { TEST_CATALOG } from '@procureflow/test-catalog';
import { ExecutionMode, TestOutcome } from '@procureflow/shared';

export interface TestSelectionResult {
  commitHash: string;
  recommendedMode: ExecutionMode;
  readinessScore: number;
  readinessFactors: {
    observedCommits: number;
    totalObservations: number;
    failureExamples: number;
    modelAvailable: boolean;
  };
  totalSuiteCount: number;
  selectedCount: number;
  predictions: {
    testId: string;
    testName: string;
    module: string;
    criticality: string;
    probability: number;
    predictedOutcome: string;
    featureScore: number;
    selectionDecision: 'SELECTED' | 'SKIPPED';
    confidenceScore: number;
    reason: string;
  }[];
}

export class RegressionIntelligenceService {
  /**
   * Calculates a transparent Model Readiness Score (0.0 to 1.0)
   * based on actual empirical evidence in the database.
   */
  static async calculateModelReadiness(): Promise<{
    score: number;
    factors: {
      observedCommits: number;
      totalObservations: number;
      failureExamples: number;
      modelAvailable: boolean;
      historicalAccuracy: number;
    };
  }> {
    const [commitsCount, observationsCount, failuresCount, latestTrainingRun] = await Promise.all([
      prisma.gitCommit.count(),
      prisma.testExecutionHistory.count(),
      prisma.testExecutionHistory.count({ where: { outcome: TestOutcome.FAILED } }),
      prisma.modelTrainingRun.findFirst({ orderBy: { trainedAt: 'desc' } }),
    ]);

    // Check ML service availability
    let mlOnline = false;
    try {
      const resp = await axios.get(`${ENV.ML_SERVICE_URL}/status`, { timeout: 1500 });
      mlOnline = resp.data.model_available || resp.status === 200;
    } catch {
      mlOnline = false;
    }

    // Transparent multi-factor evidence readiness formula:
    // Factor 1: Observation volume (up to 40% weight at 50 observations)
    const observationFactor = Math.min(1.0, observationsCount / 50.0) * 0.4;
    // Factor 2: Failure diversity (up to 30% weight at 10 failures observed)
    const failureFactor = Math.min(1.0, failuresCount / 10.0) * 0.3;
    // Factor 3: Model training accuracy/eval (up to 30% weight)
    const modelFactor = (latestTrainingRun ? latestTrainingRun.f1Score : 0.4) * 0.3;

    const rawScore = mlOnline ? (observationFactor + failureFactor + modelFactor) : 0.2;
    const score = Math.round(Math.max(0.15, Math.min(0.99, rawScore)) * 100) / 100;

    return {
      score,
      factors: {
        observedCommits: commitsCount,
        totalObservations: observationsCount,
        failureExamples: failuresCount,
        modelAvailable: mlOnline,
        historicalAccuracy: latestTrainingRun ? latestTrainingRun.accuracy : 0.0,
      },
    };
  }

  /**
   * Predicts test risks and selects test suite for the current Git changes.
   */
  static async selectRegressionTests(commitHash?: string, forceMode?: ExecutionMode): Promise<TestSelectionResult> {
    const gitAnalysis = await GitAnalysisService.analyzeRecentChanges(commitHash);
    const readiness = await this.calculateModelReadiness();

    // Query test history to calculate historical failure rates per test
    const allHistory = await prisma.testExecutionHistory.findMany();
    const historyByTest: Record<string, { total: number; failures: number }> = {};
    for (const h of allHistory) {
      if (!historyByTest[h.testId]) historyByTest[h.testId] = { total: 0, failures: 0 };
      historyByTest[h.testId].total += 1;
      if (h.outcome === TestOutcome.FAILED) historyByTest[h.testId].failures += 1;
    }

    // Build test candidates payload
    const testCandidates = TEST_CATALOG.map((tc) => {
      const stats = historyByTest[tc.testId] || { total: 0, failures: 0 };
      const failRate = stats.total > 0 ? stats.failures / stats.total : 0.0;
      return {
        test_id: tc.testId,
        module: tc.module,
        related_source_files: tc.relatedSourceFiles,
        criticality: tc.criticality,
        avg_duration_ms: tc.avgDurationMs,
        historical_failure_rate: failRate,
        recent_failure_count: stats.failures,
        flakiness_score: 0.0,
      };
    });

    const changedFilesPayload = gitAnalysis.changedFiles.map((cf) => ({
      file_path: cf.filePath,
      change_type: cf.changeType,
      additions: cf.additions,
      deletions: cf.deletions,
    }));

    let mlResponse: any = null;
    try {
      const resp = await axios.post(
        `${ENV.ML_SERVICE_URL}/predict`,
        {
          commit_hash: gitAnalysis.commitHash,
          changed_files: changedFilesPayload,
          test_candidates: testCandidates,
        },
        { timeout: 3000 }
      );
      mlResponse = resp.data;
    } catch (err) {
      // ML Service unreachable or cold start - graceful fallback
    }

    let mode = forceMode || (mlResponse ? mlResponse.mode_recommendation as ExecutionMode : ExecutionMode.FULL);
    if (readiness.score < 0.35 && !forceMode) {
      mode = ExecutionMode.FULL;
    }

    const predictions: TestSelectionResult['predictions'] = [];
    let selectedCount = 0;

    for (const tc of TEST_CATALOG) {
      const mlPred = mlResponse?.predictions?.find((p: any) => p.test_id === tc.testId);

      // Check direct file overlap
      const hasDirectOverlap = tc.relatedSourceFiles.some((sf) =>
        gitAnalysis.changedFiles.some((cf) => cf.filePath.includes(sf) || sf.includes(cf.filePath))
      );

      let probability = mlPred ? mlPred.probability : (hasDirectOverlap ? 0.75 : 0.15);
      let isSelected = false;
      let reason = '';

      if (mode === ExecutionMode.FULL || mode === ExecutionMode.SHADOW) {
        isSelected = true;
        reason = 'FULL execution mode active: all regression tests selected for maximum coverage.';
      } else if (mode === ExecutionMode.EXPANDED) {
        isSelected = hasDirectOverlap || tc.criticality === 'CRITICAL' || probability >= 0.20;
        reason = isSelected
          ? `EXPANDED mode: selected due to ${hasDirectOverlap ? 'direct code overlap' : tc.criticality === 'CRITICAL' ? 'critical security tier' : 'predicted risk'}.`
          : 'EXPANDED mode: test skipped (low predicted regression risk, non-critical).';
      } else {
        // SELECTIVE
        isSelected = hasDirectOverlap || probability >= 0.35 || (tc.criticality === 'CRITICAL' && hasDirectOverlap);
        reason = isSelected
          ? `SELECTIVE mode: test targeted for execution based on high risk factor (${(probability * 100).toFixed(0)}%).`
          : 'SELECTIVE mode: excluded based on historical stability and unaffected code paths.';
      }

      if (isSelected) selectedCount++;

      predictions.push({
        testId: tc.testId,
        testName: tc.name,
        module: tc.module,
        criticality: tc.criticality,
        probability,
        predictedOutcome: probability >= 0.5 ? 'FAILED' : 'PASSED',
        featureScore: hasDirectOverlap ? 1.0 : 0.0,
        selectionDecision: isSelected ? 'SELECTED' : 'SKIPPED',
        confidenceScore: readiness.score,
        reason,
      });

      // Save prediction & selection decision to DB
      await prisma.testPrediction.create({
        data: {
          commitHash: gitAnalysis.commitHash,
          testId: tc.testId,
          probability,
          predictedOutcome: probability >= 0.5 ? 'FAILED' : 'PASSED',
          featureScore: hasDirectOverlap ? 1.0 : 0.0,
          selectionDecision: isSelected ? 'SELECTED' : 'SKIPPED',
          confidenceScore: readiness.score,
        },
      }).catch(() => {});

      await prisma.selectionDecision.create({
        data: {
          commitHash: gitAnalysis.commitHash,
          testId: tc.testId,
          mode,
          isSelected,
          selectionReason: reason,
        },
      }).catch(() => {});
    }

    // Order descending by failure risk
    predictions.sort((a, b) => b.probability - a.probability);

    return {
      commitHash: gitAnalysis.commitHash,
      recommendedMode: mode,
      readinessScore: readiness.score,
      readinessFactors: readiness.factors,
      totalSuiteCount: TEST_CATALOG.length,
      selectedCount,
      predictions,
    };
  }

  /**
   * Retrains the ML model using all recorded test observations in the database.
   */
  static async triggerModelRetraining(algorithm = 'RandomForest') {
    const history = await prisma.testExecutionHistory.findMany({
      include: { testCase: true },
    });

    if (history.length < 5) {
      throw {
        status: 400,
        message: `Insufficient training data: Found ${history.length} observations. Minimum 5 required. Run test executions to collect empirical records first.`,
      };
    }

    const observations = history.map((h) => {
      let files: string[] = [];
      try {
        files = JSON.parse(h.testCase.relatedSourceFiles);
      } catch {}

      return {
        commit_hash: h.commitHash,
        test_id: h.testId,
        module: h.testCase.module,
        changed_files: files,
        file_overlap_ratio: files.length > 0 ? 0.5 : 0.0,
        lines_added: 20,
        lines_deleted: 5,
        criticality: h.testCase.criticality,
        historical_failure_rate: h.outcome === TestOutcome.FAILED ? 1.0 : 0.0,
        flakiness_score: 0.0,
        avg_duration_ms: h.durationMs,
        actual_outcome: h.outcome,
      };
    });

    const response = await axios.post(`${ENV.ML_SERVICE_URL}/train`, {
      observations,
      algorithm,
    });

    const data = response.data;

    // Record training run in DB
    await prisma.modelTrainingRun.create({
      data: {
        modelVersion: data.model_version,
        algorithm: data.algorithm,
        trainSamples: data.train_samples,
        testSamples: data.test_samples,
        accuracy: data.accuracy,
        precision: data.precision,
        recall: data.recall,
        f1Score: data.f1_score,
        rocAuc: data.roc_auc,
        metricsJson: JSON.stringify(data.metrics),
      },
    });

    return data;
  }
}
