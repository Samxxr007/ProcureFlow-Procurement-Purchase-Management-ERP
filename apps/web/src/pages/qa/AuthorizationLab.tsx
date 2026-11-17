import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Terminal,
  Play,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronRight,
  Database,
  Layers,
  FileCode,
} from 'lucide-react';

export const AuthorizationLab: React.FC = () => {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [environment, setEnvironment] = useState<'standard' | 'vulnerable'>('standard');
  const [selectedScenario, setSelectedScenario] = useState<any | null>(null);
  const [runResult, setRunResult] = useState<any | null>(null);

  const fetchScenarios = async () => {
    setLoading(true);
    try {
      const res = await api.get('/qa/scenarios');
      setScenarios(res.data);
      if (res.data.length > 0 && !selectedScenario) {
        setSelectedScenario(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScenarios();
  }, []);

  const handleRunAll = async () => {
    setRunning(true);
    try {
      const res = await api.post('/qa/scenarios/run', {
        scenarioId: 'ALL',
        environment,
      });
      setRunResult(res.data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Scenario execution failed.');
    } finally {
      setRunning(false);
    }
  };

  const handleRunSingle = async (scenarioId: string) => {
    setRunning(true);
    try {
      const res = await api.post('/qa/scenarios/run', {
        scenarioId,
        environment,
      });
      setRunResult(res.data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Single scenario execution failed.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stateful Authorization Testing Lab"
        subtitle="Automated API security testing across Role State, Session State, Resource Ownership, and Workflow Lifecycle."
        actions={
          <div className="flex items-center gap-3">
            {/* Environment Toggle */}
            <div className="flex items-center gap-1.5 p-1 bg-white border border-[#E0E5DF] rounded-md text-xs">
              <button
                onClick={() => setEnvironment('standard')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded font-mono text-[11px] transition ${
                  environment === 'standard'
                    ? 'bg-[#EAF1EB] text-[#397754] font-bold border border-[#397754]/30'
                    : 'text-[#727D75] hover:text-[#252D28]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Standard (Secure)</span>
              </button>
              <button
                onClick={() => setEnvironment('vulnerable')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded font-mono text-[11px] transition ${
                  environment === 'vulnerable'
                    ? 'bg-[#F9ECEB] text-[#B64C43] font-bold border border-[#B64C43]/30'
                    : 'text-[#727D75] hover:text-[#252D28]'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Vulnerable (Fault Injection)</span>
              </button>
            </div>

            <button
              disabled={running}
              onClick={handleRunAll}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#426B53] hover:bg-[#31523F] text-white rounded text-xs font-medium transition shadow-sm disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{running ? 'Executing Scenarios...' : 'Run All 15 Scenarios'}</span>
            </button>
          </div>
        }
      />

      {/* Execution Results Banner */}
      {runResult && (
        <div
          className={`p-4 rounded-lg border shadow-sm transition ${
            runResult.failed === 0
              ? 'bg-[#EAF1EB]/50 border-[#397754]/30'
              : 'bg-[#F9ECEB]/50 border-[#B64C43]/30'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase text-[#252D28]">
                  Test Run Execution ID: {runResult.testRunId}
                </span>
                <StatusBadge status={runResult.environment} size="sm" />
              </div>
              <p className="text-xs text-[#727D75] mt-1">
                Completed in {runResult.durationMs}ms across {runResult.totalScenarios} test scenarios.
                {runResult.defectsLogged > 0 && (
                  <span className="text-[#B64C43] font-bold ml-1">
                    ({runResult.defectsLogged} defect records logged to Defect Repository)
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-4 font-mono text-xs">
              <div className="flex items-center gap-1.5 text-[#397754]">
                <CheckCircle2 className="w-4 h-4" />
                <span>{runResult.passed} Passed</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#B64C43]">
                <XCircle className="w-4 h-4" />
                <span>{runResult.failed} Failed</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Scenarios List (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-[#E0E5DF] rounded-lg shadow-sm overflow-hidden flex flex-col h-[700px]">
          <div className="p-3 border-b border-[#E0E5DF] bg-[#F3F5F1] flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold text-[#252D28] uppercase">
              Authorization Test Catalog ({scenarios.length})
            </span>
            <span className="text-[10px] font-mono text-[#727D75]">AUTH-001 to AUTH-015</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#E0E5DF]">
            {scenarios.map((sc) => {
              const runStatus = runResult?.results?.find((r: any) => r.scenarioId === sc.scenarioId);
              const isSelected = selectedScenario?.scenarioId === sc.scenarioId;

              return (
                <div
                  key={sc.scenarioId}
                  onClick={() => setSelectedScenario(sc)}
                  className={`p-3.5 cursor-pointer transition text-xs flex items-center justify-between ${
                    isSelected ? 'bg-[#EAF1EB]/70 border-l-4 border-l-[#426B53]' : 'hover:bg-[#F3F5F1]/50'
                  }`}
                >
                  <div className="space-y-1 max-w-[80%]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#426B53] text-[11px]">
                        {sc.scenarioId}
                      </span>
                      <span className="font-mono text-[10px] text-[#727D75] bg-[#F3F5F1] px-1.5 py-0.5 rounded">
                        {sc.category}
                      </span>
                    </div>
                    <div className="font-medium text-[#252D28] truncate">{sc.title}</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {runStatus && (
                      <span
                        className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          runStatus.status === 'PASSED'
                            ? 'bg-[#EAF1EB] text-[#397754]'
                            : 'bg-[#F9ECEB] text-[#B64C43]'
                        }`}
                      >
                        {runStatus.status}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-[#727D75]" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Scenario Inspector & Step Oracles (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-[#E0E5DF] rounded-lg shadow-sm p-6 overflow-y-auto h-[700px] space-y-6">
          {selectedScenario ? (
            <>
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-[#E0E5DF]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold text-[#426B53] bg-[#EAF1EB] px-2 py-0.5 rounded">
                      {selectedScenario.scenarioId}
                    </span>
                    <span className="font-mono text-xs text-[#727D75]">
                      {selectedScenario.category}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-[#252D28] mt-1">{selectedScenario.title}</h2>
                  <p className="text-xs text-[#727D75] mt-1">{selectedScenario.description}</p>
                </div>

                <button
                  disabled={running}
                  onClick={() => handleRunSingle(selectedScenario.scenarioId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#426B53] hover:bg-[#31523F] text-white rounded text-xs font-medium transition shadow-sm shrink-0 disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Scenario</span>
                </button>
              </div>

              {/* Initial Precondition State */}
              <div className="p-3 bg-[#F3F5F1] rounded border border-[#E0E5DF] text-xs">
                <span className="font-mono text-[10px] uppercase text-[#727D75] font-bold block mb-1">
                  Initial Fixture Preconditions:
                </span>
                <span className="font-mono text-[#252D28]">{selectedScenario.initialState}</span>
              </div>

              {/* Steps Execution & Oracles Breakdown */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold font-mono uppercase text-[#252D28]">
                  Sequential Test Steps & Dual Oracle Assertions ({selectedScenario.steps?.length || 0})
                </h3>

                {selectedScenario.steps?.map((step: any, idx: number) => {
                  const runResultForThis = runResult?.results?.find(
                    (r: any) => r.scenarioId === selectedScenario.scenarioId
                  );

                  return (
                    <div
                      key={idx}
                      className="border border-[#E0E5DF] rounded-lg p-4 bg-[#FDFEFC] space-y-3 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#202A24] text-white flex items-center justify-center font-mono text-[10px] font-bold">
                            {step.stepNumber}
                          </span>
                          <span className="font-semibold text-[#252D28]">{step.name}</span>
                        </div>
                        <StatusBadge status={step.actorRole} size="sm" />
                      </div>

                      {/* Request Specifications */}
                      <div className="grid grid-cols-2 gap-2 font-mono text-[11px] bg-[#F3F5F1] p-2.5 rounded">
                        <div>
                          <span className="text-[#727D75]">HTTP Request: </span>
                          <span className="font-bold text-[#426B53]">{step.method}</span> {step.endpoint}
                        </div>
                        <div>
                          <span className="text-[#727D75]">Simulated Actor: </span>
                          <span className="text-[#252D28]">{step.actorEmail}</span>
                        </div>
                      </div>

                      {/* Payload preview if present */}
                      {step.payload && (
                        <div>
                          <span className="text-[10px] font-mono text-[#727D75] block mb-1">Request Payload:</span>
                          <pre className="font-mono text-[10px] bg-[#202A24] text-[#DCE4DD] p-2 rounded overflow-x-auto">
                            {JSON.stringify(step.payload, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* Dual Oracle Assertions */}
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E0E5DF]">
                        {/* 1. Response Oracle */}
                        <div className="p-2.5 rounded border border-[#E0E5DF] bg-white space-y-1">
                          <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#727D75] uppercase font-bold">
                            <FileCode className="w-3.5 h-3.5 text-[#506E86]" />
                            <span>Response Oracle</span>
                          </div>
                          <div className="font-mono text-[11px]">
                            Expected HTTP: <span className="font-bold text-[#252D28]">{step.expectedHttpStatus}</span>
                          </div>
                          <div className="font-mono text-[11px]">
                            Permission: <span className="font-bold text-[#426B53]">{step.expectedPermissionOutcome}</span>
                          </div>
                          {runResultForThis && (
                            <div className="pt-1 border-t border-[#E0E5DF] font-mono text-[10px]">
                              Actual: <span className="font-bold">{runResultForThis.httpStatus}</span> (
                              {runResultForThis.responseOraclePassed ? (
                                <span className="text-[#397754]">Oracle Passed</span>
                              ) : (
                                <span className="text-[#B64C43]">Oracle Failed</span>
                              )}
                              )
                            </div>
                          )}
                        </div>

                        {/* 2. State Oracle */}
                        <div className="p-2.5 rounded border border-[#E0E5DF] bg-white space-y-1">
                          <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#727D75] uppercase font-bold">
                            <Database className="w-3.5 h-3.5 text-[#397754]" />
                            <span>Database State Oracle</span>
                          </div>
                          {step.stateAssertions && step.stateAssertions.length > 0 ? (
                            step.stateAssertions.map((sa: any, sIdx: number) => (
                              <div key={sIdx} className="font-mono text-[10px] text-[#727D75]">
                                Table: <span className="text-[#252D28] font-bold">{sa.table}</span>
                                {sa.expectedFields && (
                                  <div>Expected: {JSON.stringify(sa.expectedFields)}</div>
                                )}
                                {sa.expectedCount !== undefined && (
                                  <div>Expected Count: {sa.expectedCount}</div>
                                )}
                              </div>
                            ))
                          ) : (
                            <span className="text-[11px] text-[#727D75]">No DB mutations expected</span>
                          )}
                          {runResultForThis && (
                            <div className="pt-1 border-t border-[#E0E5DF] font-mono text-[10px]">
                              State Integrity:{' '}
                              {runResultForThis.stateOraclePassed ? (
                                <span className="text-[#397754] font-bold">Verified Valid</span>
                              ) : (
                                <span className="text-[#B64C43] font-bold">Violation Detected</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Error message if failed */}
                      {runResultForThis && !runResultForThis.status && runResultForThis.errorMessage && (
                        <div className="p-2 bg-[#F9ECEB] text-[#B64C43] text-xs font-mono rounded">
                          {runResultForThis.errorMessage}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-xs text-[#727D75]">
              Select a scenario from the catalog to inspect step specifications and oracles.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
