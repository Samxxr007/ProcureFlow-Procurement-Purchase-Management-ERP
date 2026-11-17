import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { CheckSquare, CheckCircle, XCircle, RefreshCw, AlertTriangle, Eye } from 'lucide-react';

export const ApprovalQueue: React.FC = () => {
  const { user } = useAuth();
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPR, setSelectedPR] = useState<any | null>(null);
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await api.get('/approvals/pending');
      setPending(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const openDecisionModal = (pr: any, type: 'APPROVED' | 'REJECTED') => {
    setSelectedPR(pr);
    setDecision(type);
    setComments(type === 'APPROVED' ? 'Approved within team quarterly budget allocation.' : 'Insufficient justification or budget constraints.');
    setError(null);
  };

  const handleProcessDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPR) return;
    setError(null);
    setSubmitting(true);

    try {
      await api.post(`/approvals/${selectedPR.id}/decide`, {
        decision,
        comments,
      });
      setSelectedPR(null);
      await fetchPending();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Decision processing failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manager Approval Queue"
        subtitle="Review and decide on submitted employee requisitions within your managerial authority."
        actions={
          <button
            onClick={fetchPending}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E0E5DF] hover:bg-white rounded text-xs font-medium transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#727D75]" />
            <span>Refresh Queue</span>
          </button>
        }
      />

      {/* Queue Table */}
      <div className="bg-white border border-[#E0E5DF] rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F3F5F1] border-b border-[#E0E5DF] text-[#727D75] font-mono text-[11px]">
                <th className="py-3 px-4 font-medium">PR NUMBER</th>
                <th className="py-3 px-4 font-medium">TITLE</th>
                <th className="py-3 px-4 font-medium">EMPLOYEE</th>
                <th className="py-3 px-4 font-medium">DEPARTMENT</th>
                <th className="py-3 px-4 font-medium">TOTAL AMOUNT</th>
                <th className="py-3 px-4 font-medium">SUBMITTED ON</th>
                <th className="py-3 px-4 font-medium text-right">DECISION ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0E5DF]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#727D75]">
                    Loading approval queue...
                  </td>
                </tr>
              ) : pending.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#727D75]">
                    No pending requisitions awaiting approval.
                  </td>
                </tr>
              ) : (
                pending.map((pr) => {
                  const isSelfRequest = pr.requestedById === user?.id;
                  return (
                    <tr key={pr.id} className="hover:bg-[#F3F5F1]/50 transition">
                      <td className="py-3 px-4 font-mono font-medium text-[#426B53]">
                        <Link to={`/purchase-requests/${pr.id}`} className="hover:underline">
                          {pr.prNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-medium text-[#252D28] max-w-xs truncate">
                        {pr.title}
                      </td>
                      <td className="py-3 px-4 text-[#252D28]">
                        {pr.requestedBy?.name}
                      </td>
                      <td className="py-3 px-4 text-[#727D75]">
                        {pr.requestedBy?.department || 'Operations'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#252D28]">
                        ${pr.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#727D75]">
                        {new Date(pr.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isSelfRequest ? (
                          <span
                            title="Separation of duties: Backend policy prevents self-approval"
                            className="inline-flex items-center gap-1 font-mono text-[10px] text-[#B78337] bg-[#F9F4EB] px-2 py-0.5 rounded border border-[#B78337]/30"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            Self-Approval Blocked
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openDecisionModal(pr, 'APPROVED')}
                              className="px-2.5 py-1 bg-[#426B53] hover:bg-[#31523F] text-white rounded text-xs font-medium transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openDecisionModal(pr, 'REJECTED')}
                              className="px-2.5 py-1 bg-[#F9ECEB] text-[#B64C43] hover:bg-[#F3D7D5] border border-[#B64C43]/20 rounded text-xs font-medium transition"
                            >
                              Reject
                            </button>
                            <Link
                              to={`/purchase-requests/${pr.id}`}
                              className="p-1 border border-[#E0E5DF] hover:bg-white rounded text-[#727D75]"
                              title="Inspect Requisition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Modal */}
      {selectedPR && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-[#E0E5DF] max-w-lg w-full p-6 shadow-xl">
            <h2 className="text-base font-bold text-[#252D28] mb-1">
              Confirm Managerial Decision
            </h2>
            <p className="text-xs text-[#727D75] mb-4">
              Requisition: <span className="font-mono font-semibold text-[#426B53]">{selectedPR.prNumber}</span> — {selectedPR.title} (${selectedPR.totalAmount.toLocaleString()})
            </p>

            {error && (
              <div className="mb-4 p-3 bg-[#F9ECEB] border border-[#B64C43]/30 rounded text-xs text-[#B64C43]">
                {error}
              </div>
            )}

            <form onSubmit={handleProcessDecision} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#252D28] mb-1">
                  Manager Decision
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecision('APPROVED')}
                    className={`py-2 px-3 text-xs font-semibold rounded border transition ${
                      decision === 'APPROVED'
                        ? 'bg-[#EAF1EB] text-[#397754] border-[#397754]'
                        : 'border-[#E0E5DF] text-[#727D75]'
                    }`}
                  >
                    Approve Requisition
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision('REJECTED')}
                    className={`py-2 px-3 text-xs font-semibold rounded border transition ${
                      decision === 'REJECTED'
                        ? 'bg-[#F9ECEB] text-[#B64C43] border-[#B64C43]'
                        : 'border-[#E0E5DF] text-[#727D75]'
                    }`}
                  >
                    Reject Requisition
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#252D28] mb-1">
                  Business Review Comments <span className="text-[#B64C43]">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E0E5DF] rounded focus:outline-none focus:border-[#426B53]"
                  placeholder="State operational rationale, budget code, or reason for rejection..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E0E5DF]">
                <button
                  type="button"
                  onClick={() => setSelectedPR(null)}
                  className="px-3.5 py-1.5 border border-[#E0E5DF] hover:bg-[#F3F5F1] rounded text-xs text-[#252D28]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-1.5 rounded text-xs font-medium text-white transition disabled:opacity-50 ${
                    decision === 'APPROVED' ? 'bg-[#426B53] hover:bg-[#31523F]' : 'bg-[#B64C43] hover:bg-[#9E3F37]'
                  }`}
                >
                  {submitting ? 'Recording Decision...' : `Confirm ${decision}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
