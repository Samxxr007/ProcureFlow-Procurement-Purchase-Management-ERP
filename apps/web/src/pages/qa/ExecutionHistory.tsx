import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { History, Eye, RefreshCw, Clock, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';

export const ExecutionHistory: React.FC = () => {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const res = await api.get('/qa/runs');
      setRuns(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const openRunDetails = async (runId: string) => {
    setDetailsLoading(true);
    try {
      const res = await api.get(`/qa/runs/${runId}`);
      setSelectedRun(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Test Execution History"
        subtitle="Unified audit log of all automated platform test executions, execution modes, and oracle evaluations."
        actions={
          <button
            onClick={fetchRuns}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E0E5DF] hover:bg-white rounded text-xs font-medium transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#727D75]" />
            <span>Refresh History</span>
          </button>
        }
      />

      {/* Runs Table */}
      <div className="bg-white border border-[#E0E5DF] rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F3F5F1] border-b border-[#E0E5DF] text-[#727D75] font-mono text-[11px]">
                <th className="py-3 px-4 font-medium">RUN ID</th>
                <th className="py-3 px-4 font-medium">MODE</th>
                <th className="py-3 px-4 font-medium">ENVIRONMENT</th>
                <th className="py-3 px-4 font-medium text-center">TOTAL TESTS</th>
                <th className="py-3 px-4 font-medium text-center">PASSED</th>
                <th className="py-3 px-4 font-medium text-center">FAILED</th>
                <th className="py-3 px-4 font-medium">DURATION</th>
                <th className="py-3 px-4 font-medium">TIMESTAMP</th>
                <th className="py-3 px-4 font-medium text-right">INSPECT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0E5DF]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-[#727D75]">
                    Loading execution history...
                  </td>
                </tr>
              ) : runs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-[#727D75]">
                    No test runs logged yet.
                  </td>
                </tr>
              ) : (
                runs.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F3F5F1]/50 transition">
                    <td className="py-3 px-4 font-mono font-medium text-[#426B53]">
                      {r.id.substring(0, 14)}...
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={r.mode} size="sm" />
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] uppercase">
                      <span
                        className={
                          r.environment === 'vulnerable'
                            ? 'text-[#B64C43] font-bold'
                            : 'text-[#397754]'
                        }
                      >
                        {r.environment}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-[#252D28]">
                      {r.totalTests}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-[#397754]">
                      {r.passedTests}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-[#B64C43]">
                      {r.failedTests}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#727D75]">
                      {r.durationMs}ms
                    </td>
                    <td className="py-3 px-4 font-mono text-[#727D75]">
                      {new Date(r.startedAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openRunDetails(r.id)}
                        className="p-1 border border-[#E0E5DF] hover:border-[#426B53] hover:text-[#426B53] rounded"
                        title="View Detailed Results"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedRun && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-[#E0E5DF] max-w-3xl w-full p-6 shadow-xl max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0E5DF]">
              <div>
                <h2 className="text-base font-bold text-[#252D28]">
                  Execution Run Details: <span className="font-mono text-[#426B53]">{selectedRun.id}</span>
                </h2>
                <div className="flex items-center gap-2 mt-1 text-xs font-mono text-[#727D75]">
                  <span>Mode: {selectedRun.mode}</span>
                  <span>•</span>
                  <span>Environment: {selectedRun.environment}</span>
                  <span>•</span>
                  <span>Duration: {selectedRun.durationMs}ms</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedRun(null)}
                className="text-xs px-2.5 py-1 border border-[#E0E5DF] rounded hover:bg-[#F3F5F1]"
              >
                Close
              </button>
            </div>

            {/* Scenario Results Breakdown */}
            <div>
              <h3 className="text-xs font-mono uppercase font-bold text-[#252D28] mb-2">
                Evaluated Scenarios ({selectedRun.scenarioResults?.length || 0})
              </h3>
              <div className="space-y-2">
                {selectedRun.scenarioResults?.map((sr: any) => (
                  <div
                    key={sr.id}
                    className="p-3 rounded border border-[#E0E5DF] bg-[#FDFEFC] text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-[#426B53]">{sr.scenarioId}</span>
                        <span className="text-[#252D28] font-medium">{sr.scenario?.title}</span>
                      </div>
                      <div className="font-mono text-[10px] text-[#727D75]">
                        HTTP Status: {sr.httpStatus} | Permission: {sr.permissionOutcome} | State Oracle: {sr.stateOutcome}
                      </div>
                    </div>
                    <StatusBadge status={sr.status} size="sm" />
                  </div>
                ))}
              </div>
            </div>

            {/* Auto-logged Defects if any */}
            {selectedRun.defects && selectedRun.defects.length > 0 && (
              <div className="pt-3 border-t border-[#E0E5DF]">
                <h3 className="text-xs font-mono uppercase font-bold text-[#B64C43] mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Defects Automatically Captured in this Run ({selectedRun.defects.length})</span>
                </h3>
                <div className="space-y-1.5">
                  {selectedRun.defects.map((def: any) => (
                    <div key={def.defectId} className="p-2 bg-[#F9ECEB] rounded text-xs text-[#B64C43]">
                      <span className="font-mono font-bold">{def.defectId}:</span> {def.title}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
