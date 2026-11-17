import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Cpu,
  GitCommit,
  FileCode,
  RefreshCw,
  AlertCircle,
  Play,
  Sliders,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

export const RegressionIntelligence: React.FC = () => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [modelStatus, setModelStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('RandomForest');
  const [selectedMode, setSelectedMode] = useState<string>('');

  const fetchRegressionData = async (mode?: string) => {
    setLoading(true);
    try {
      const [regRes, modelRes] = await Promise.all([
        api.get('/qa/regression/analyze', { params: { mode: mode || selectedMode || undefined } }),
        api.get('/qa/model/status'),
      ]);
      setAnalysis(regRes.data);
      setModelStatus(modelRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegressionData();
  }, [selectedMode]);

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      await api.post('/qa/model/train', { algorithm: selectedAlgorithm });
      await fetchRegressionData();
      alert(`Model successfully trained using ${selectedAlgorithm} on chronological validation split.`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Retraining failed. Historical observation records needed.');
    } finally {
      setRetraining(false);
    }
  };

  if (loading && !analysis) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 font-mono text-sm text-[#727D75]">
          <RefreshCw className="w-4 h-4 animate-spin text-[#426B53]" />
          <span>Analyzing Git changes & computing regression test risks...</span>
        </div>
      </div>
    );
  }

  const { commitHash, recommendedMode, readinessScore, readinessFactors, predictions, totalSuiteCount, selectedCount } =
    analysis || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Predictive Regression Test Intelligence"
        subtitle="Git diff impact analysis & confidence-aware adaptive test selection driven by empirical test history."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={selectedAlgorithm}
              onChange={(e) => setSelectedAlgorithm(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-[#E0E5DF] rounded bg-white font-mono"
            >
              <option value="RandomForest">Random Forest (Primary)</option>
              <option value="LogisticRegression">Logistic Regression (Baseline)</option>
            </select>
            <button
              disabled={retraining}
              onClick={handleRetrain}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#426B53] hover:bg-[#31523F] text-white rounded text-xs font-medium transition shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${retraining ? 'animate-spin' : ''}`} />
              <span>{retraining ? 'Retraining...' : 'Retrain ML Model'}</span>
            </button>
          </div>
        }
      />

      {/* Model Readiness & Adaptive Mode Recommendation Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Readiness Card */}
        <div className="bg-white border border-[#E0E5DF] rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#727D75]">Evidence Readiness Score</span>
            <span className="font-mono text-xs font-bold text-[#426B53]">
              {Math.round((readinessScore || 0.15) * 100)}%
            </span>
          </div>

          <div className="w-full h-2 bg-[#F3F5F1] rounded-full overflow-hidden mb-3">
            <div
              className={`h-full transition-all duration-500 ${
                readinessScore >= 0.7 ? 'bg-[#397754]' : readinessScore >= 0.4 ? 'bg-[#B78337]' : 'bg-[#B64C43]'
              }`}
              style={{ width: `${Math.max(10, (readinessScore || 0.15) * 100)}%` }}
            />
          </div>

          <div className="space-y-1 font-mono text-[10px] text-[#727D75]">
            <div className="flex justify-between">
              <span>Observed Commits:</span>
              <span className="font-bold text-[#252D28]">{readinessFactors?.observedCommits || 1}</span>
            </div>
            <div className="flex justify-between">
              <span>Execution Observations:</span>
              <span className="font-bold text-[#252D28]">{readinessFactors?.totalObservations || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Recorded Failures:</span>
              <span className="font-bold text-[#B64C43]">{readinessFactors?.failureExamples || 0}</span>
            </div>
          </div>
        </div>

        {/* Adaptive Mode Card */}
        <div className="bg-white border border-[#E0E5DF] rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#727D75]">Recommended Scope</span>
              <StatusBadge status={recommendedMode || 'FULL'} size="sm" />
            </div>

            <div className="text-xs text-[#252D28] mb-3">
              {recommendedMode === 'SELECTIVE' && (
                <p>Sufficient empirical evidence exists. Executing high-risk predictions and directly affected source paths.</p>
              )}
              {recommendedMode === 'EXPANDED' && (
                <p>Moderate evidence collected. Executing affected tests, high-risk candidates, and critical security suites.</p>
              )}
              {recommendedMode === 'FULL' && (
                <p>Cold start or safety threshold active. Running 100% full regression suite to prevent regression leakage.</p>
              )}
            </div>
          </div>

          {/* Mode Override Buttons */}
          <div className="flex items-center gap-1.5 pt-2 border-t border-[#E0E5DF] text-[11px] font-mono">
            <span className="text-[#727D75]">Scope:</span>
            {['', 'FULL', 'EXPANDED', 'SELECTIVE'].map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMode(m)}
                className={`px-2 py-0.5 rounded border transition ${
                  selectedMode === m
                    ? 'bg-[#426B53] text-white border-[#426B53]'
                    : 'bg-[#F3F5F1] text-[#727D75] border-[#E0E5DF] hover:bg-white'
                }`}
              >
                {m || 'Auto'}
              </button>
            ))}
          </div>
        </div>

        {/* Suite Reduction Summary */}
        <div className="bg-white border border-[#E0E5DF] rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-[#727D75] block mb-2">Execution Reduction Ratio</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-[#397754]">
                {selectedCount || totalSuiteCount || 16} / {totalSuiteCount || 16}
              </span>
              <span className="text-xs text-[#727D75]">tests targeted</span>
            </div>
            <p className="text-xs text-[#727D75] mt-2">
              Skipping {Math.max(0, (totalSuiteCount || 16) - (selectedCount || 0))} non-relevant tests saves ~
              {Math.max(0, Math.round((1 - (selectedCount / (totalSuiteCount || 16))) * 100))}% runtime.
            </p>
          </div>

          <div className="font-mono text-[10px] text-[#727D75] pt-2 border-t border-[#E0E5DF]">
            Commit Target: <span className="text-[#252D28] font-bold">{commitHash?.substring(0, 12)}</span>
          </div>
        </div>
      </div>

      {/* Predictions & Risk Table */}
      <div className="bg-white border border-[#E0E5DF] rounded-lg shadow-sm overflow-hidden">
        <div className="p-3 bg-[#F3F5F1] border-b border-[#E0E5DF] flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-[#252D28] uppercase">
            Test Case Regression Risk Predictions (Ranked Descending by Failure Likelihood)
          </span>
          <span className="text-[11px] font-mono text-[#727D75]">
            Targeting Commit: {commitHash?.substring(0, 10)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E0E5DF] text-[#727D75] font-mono text-[11px] bg-[#FDFEFC]">
                <th className="py-3 px-4 font-medium">TEST ID</th>
                <th className="py-3 px-4 font-medium">TEST SUITE NAME</th>
                <th className="py-3 px-4 font-medium">MODULE</th>
                <th className="py-3 px-4 font-medium">CRITICALITY</th>
                <th className="py-3 px-4 font-medium text-center">FAILURE PROBABILITY</th>
                <th className="py-3 px-4 font-medium">PREDICTED OUTCOME</th>
                <th className="py-3 px-4 font-medium">RATIONALE / SELECTION REASON</th>
                <th className="py-3 px-4 font-medium text-right">DECISION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0E5DF]">
              {predictions?.map((pred: any) => {
                const probPct = Math.round(pred.probability * 100);
                return (
                  <tr
                    key={pred.testId}
                    className={`hover:bg-[#F3F5F1]/50 transition ${
                      pred.selectionDecision === 'SELECTED' ? 'bg-white' : 'bg-[#FDFEFC]/60 opacity-60'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[#426B53]">
                      {pred.testId}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#252D28] max-w-xs truncate">
                      {pred.testName}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#727D75]">
                      {pred.module}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={pred.criticality} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 font-mono font-bold">
                        <span
                          className={
                            probPct >= 50
                              ? 'text-[#B64C43]'
                              : probPct >= 25
                              ? 'text-[#B78337]'
                              : 'text-[#397754]'
                          }
                        >
                          {probPct}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          pred.predictedOutcome === 'FAILED'
                            ? 'bg-[#F9ECEB] text-[#B64C43]'
                            : 'bg-[#EAF1EB] text-[#397754]'
                        }`}
                      >
                        {pred.predictedOutcome}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#727D75] text-[11px] max-w-xs truncate" title={pred.reason}>
                      {pred.reason}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold ${
                          pred.selectionDecision === 'SELECTED'
                            ? 'bg-[#EAF1EB] text-[#397754] border border-[#397754]/30'
                            : 'bg-[#F3F5F1] text-[#727D75]'
                        }`}
                      >
                        {pred.selectionDecision}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
