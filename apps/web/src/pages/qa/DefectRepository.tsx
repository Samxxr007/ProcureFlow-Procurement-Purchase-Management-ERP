import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { Bug, RefreshCw, Filter, Edit, CheckCircle, AlertTriangle } from 'lucide-react';

export const DefectRepository: React.FC = () => {
  const [defects, setDefects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [selectedDefect, setSelectedDefect] = useState<any | null>(null);

  const [newStatus, setNewStatus] = useState('');
  const [retestResult, setRetestResult] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDefects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/qa/defects', {
        params: {
          status: statusFilter || undefined,
          severity: severityFilter || undefined,
        },
      });
      setDefects(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefects();
  }, [statusFilter, severityFilter]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDefect) return;
    setSubmitting(true);

    try {
      await api.patch(`/qa/defects/${selectedDefect.defectId}`, {
        status: newStatus,
        retestResult,
      });
      setSelectedDefect(null);
      await fetchDefects();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update defect status.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quality Lab Defect Repository"
        subtitle="Manage and track functional defects, authorization breaches, and state integrity violations captured during test execution."
        actions={
          <button
            onClick={fetchDefects}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E0E5DF] hover:bg-white rounded text-xs font-medium transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#727D75]" />
            <span>Refresh Defects</span>
          </button>
        }
      />

      {/* Filter Bar */}
      <div className="bg-white border border-[#E0E5DF] rounded-lg p-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-[#727D75]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-[#E0E5DF] rounded px-2.5 py-1.5 bg-white font-mono"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="FIXED">FIXED</option>
            <option value="RETEST">RETEST</option>
            <option value="CLOSED">CLOSED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="DEFERRED">DEFERRED</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-xs border border-[#E0E5DF] rounded px-2.5 py-1.5 bg-white font-mono"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>

        <span className="text-xs font-mono text-[#727D75]">
          {defects.length} Defects Logged
        </span>
      </div>

      {/* Defects List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-xs text-[#727D75] bg-white border border-[#E0E5DF] rounded-lg">
            Loading defects...
          </div>
        ) : defects.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#397754] bg-[#EAF1EB]/50 border border-[#397754]/20 rounded-lg font-mono">
            ✓ No defects found matching current filters. All test runs passing clean.
          </div>
        ) : (
          defects.map((d) => (
            <div
              key={d.defectId}
              className="bg-white border border-[#E0E5DF] rounded-lg p-4 shadow-sm hover:border-[#426B53]/40 transition space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-[#426B53] bg-[#EAF1EB] px-2 py-0.5 rounded">
                    {d.defectId}
                  </span>
                  <StatusBadge status={d.severity} size="sm" />
                  <span className="font-mono text-[10px] text-[#727D75] bg-[#F3F5F1] px-1.5 py-0.5 rounded">
                    {d.priority}
                  </span>
                  <span className="text-xs text-[#727D75] font-mono">Module: {d.module}</span>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge status={d.status} size="sm" />
                  <button
                    onClick={() => {
                      setSelectedDefect(d);
                      setNewStatus(d.status);
                      setRetestResult(d.retestResult || '');
                    }}
                    className="flex items-center gap-1 text-xs text-[#426B53] hover:underline font-medium ml-2"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Update Status</span>
                  </button>
                </div>
              </div>

              <div>
                <h2 className="text-sm font-bold text-[#252D28]">{d.title}</h2>
                <p className="text-xs text-[#727D75] mt-0.5">{d.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-[#F3F5F1] p-3 rounded font-mono text-[11px]">
                <div>
                  <span className="text-[#727D75] block text-[10px] uppercase font-bold">Steps to Reproduce:</span>
                  <span className="text-[#252D28]">{d.stepsToReproduce}</span>
                </div>
                <div>
                  <span className="text-[#727D75] block text-[10px] uppercase font-bold">Actual Behavior Observed:</span>
                  <span className="text-[#B64C43] font-bold">{d.actualBehavior}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-[#727D75] pt-1">
                <span>Discovered in Environment: <strong className="text-[#252D28] uppercase">{d.environment}</strong></span>
                <span>Logged: {new Date(d.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Update Defect Modal */}
      {selectedDefect && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-[#E0E5DF] max-w-md w-full p-6 shadow-xl">
            <h2 className="text-base font-bold text-[#252D28] mb-1">
              Update Defect Status
            </h2>
            <p className="text-xs font-mono text-[#426B53] mb-4">
              {selectedDefect.defectId}: {selectedDefect.title}
            </p>

            <form onSubmit={handleUpdateStatus} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-[#252D28] mb-1">
                  Defect Resolution Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#E0E5DF] rounded bg-white font-mono"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="FIXED">FIXED</option>
                  <option value="RETEST">RETEST</option>
                  <option value="CLOSED">CLOSED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="DEFERRED">DEFERRED</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#252D28] mb-1">
                  Retest Notes / Verification
                </label>
                <textarea
                  rows={3}
                  placeholder="Record retest verification details or commit fix hash..."
                  value={retestResult}
                  onChange={(e) => setRetestResult(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#E0E5DF] rounded"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E0E5DF]">
                <button
                  type="button"
                  onClick={() => setSelectedDefect(null)}
                  className="px-3 py-1.5 border border-[#E0E5DF] hover:bg-[#F3F5F1] rounded text-[#727D75]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-[#426B53] hover:bg-[#31523F] text-white rounded font-medium disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update Defect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
