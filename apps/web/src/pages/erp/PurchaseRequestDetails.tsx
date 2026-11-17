import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Send, CheckCircle, XCircle, ShoppingCart, RefreshCw, AlertCircle } from 'lucide-react';
import { Role } from '@procureflow/shared';

export const PurchaseRequestDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [pr, setPr] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPR = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/purchase-requests/${id}`);
      setPr(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to retrieve requisition details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPR();
  }, [id]);

  const handleSubmit = async () => {
    setActionLoading(true);
    try {
      await api.post(`/purchase-requests/${id}/submit`);
      await fetchPR();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Submission failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    const comments = prompt('Enter manager approval comments:', 'Approved under operational budget.');
    if (comments === null) return;
    setActionLoading(true);
    try {
      await api.post(`/purchase-requests/${id}/approve`, { comments });
      await fetchPR();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    const comments = prompt('Enter manager rejection reason:', 'Budget exceeded or justification insufficient.');
    if (comments === null) return;
    setActionLoading(true);
    try {
      await api.post(`/purchase-requests/${id}/reject`, { comments });
      await fetchPR();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !pr) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 font-mono text-sm text-[#727D75]">
          <RefreshCw className="w-4 h-4 animate-spin text-[#426B53]" />
          <span>Loading requisition...</span>
        </div>
      </div>
    );
  }

  if (error || !pr) {
    return (
      <div className="p-6 bg-white border border-[#E0E5DF] rounded-lg text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-[#B64C43] mx-auto" />
        <h2 className="text-base font-bold text-[#252D28]">Access Restricted or Not Found</h2>
        <p className="text-xs text-[#727D75] max-w-md mx-auto">{error || 'Purchase requisition could not be loaded.'}</p>
        <button
          onClick={() => navigate('/purchase-requests')}
          className="px-4 py-1.5 bg-[#426B53] text-white rounded text-xs"
        >
          Return to Requisitions List
        </button>
      </div>
    );
  }

  const isOwner = user?.id === pr.requestedById;
  const isManager = user?.role === Role.MANAGER || user?.role === Role.ADMIN;
  const isProcurement = user?.role === Role.PROCUREMENT || user?.role === Role.ADMIN;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title={pr.prNumber}
        subtitle={`Created on ${new Date(pr.createdAt).toLocaleDateString()} by ${pr.requestedBy?.name}`}
        badge={<StatusBadge status={pr.status} />}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/purchase-requests')}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E0E5DF] hover:bg-white rounded text-xs font-medium transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            {pr.status === 'DRAFT' && isOwner && (
              <button
                disabled={actionLoading}
                onClick={handleSubmit}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#426B53] hover:bg-[#31523F] text-white rounded text-xs font-medium transition shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Requisition</span>
              </button>
            )}

            {pr.status === 'SUBMITTED' && isManager && (
              <>
                <button
                  disabled={actionLoading}
                  onClick={handleReject}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F9ECEB] text-[#B64C43] hover:bg-[#F3D7D5] border border-[#B64C43]/20 rounded text-xs font-medium transition"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
                <button
                  disabled={actionLoading}
                  onClick={handleApprove}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#426B53] hover:bg-[#31523F] text-white rounded text-xs font-medium transition shadow-sm"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Approve</span>
                </button>
              </>
            )}

            {pr.status === 'APPROVED' && isProcurement && !pr.purchaseOrder && (
              <Link
                to={`/purchase-orders?prId=${pr.id}`}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#426B53] hover:bg-[#31523F] text-white rounded text-xs font-medium transition shadow-sm"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Issue Purchase Order</span>
              </Link>
            )}
          </div>
        }
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Requisition Meta & Items */}
        <div className="md:col-span-2 space-y-6">
          {/* Details Card */}
          <div className="bg-white border border-[#E0E5DF] rounded-lg p-5 shadow-sm space-y-4">
            <div>
              <span className="text-[11px] font-mono text-[#727D75] uppercase">Requisition Title</span>
              <h2 className="text-base font-bold text-[#252D28] mt-0.5">{pr.title}</h2>
            </div>

            <div>
              <span className="text-[11px] font-mono text-[#727D75] uppercase">Business Justification</span>
              <p className="text-xs text-[#252D28] bg-[#F3F5F1] p-3 rounded mt-1 leading-relaxed">
                {pr.justification}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#E0E5DF] text-xs">
              <div>
                <span className="text-[#727D75] block text-[11px]">Required By Date:</span>
                <span className="font-mono font-medium text-[#252D28]">
                  {new Date(pr.requiredDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-[#727D75] block text-[11px]">Department:</span>
                <span className="font-medium text-[#252D28]">
                  {pr.requestedBy?.department || 'General Operations'}
                </span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="bg-white border border-[#E0E5DF] rounded-lg p-5 shadow-sm">
            <h3 className="text-xs font-bold font-mono uppercase text-[#252D28] mb-3">
              Requisition Line Items ({pr.items?.length || 0})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E0E5DF] text-[#727D75] font-mono text-[11px]">
                    <th className="pb-2 font-medium">DESCRIPTION</th>
                    <th className="pb-2 font-medium text-center">QUANTITY</th>
                    <th className="pb-2 font-medium text-right">UNIT PRICE</th>
                    <th className="pb-2 font-medium text-right">LINE TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0E5DF]">
                  {pr.items?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-[#F3F5F1]/40">
                      <td className="py-2.5 font-medium text-[#252D28]">{item.itemDescription}</td>
                      <td className="py-2.5 text-center font-mono">{item.quantity}</td>
                      <td className="py-2.5 text-right font-mono">${item.unitPrice.toFixed(2)}</td>
                      <td className="py-2.5 text-right font-mono font-bold text-[#252D28]">
                        ${item.totalPrice.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#E0E5DF] font-mono">
                    <td colSpan={3} className="pt-3 font-bold uppercase text-[#727D75] text-right">
                      Grand Total:
                    </td>
                    <td className="pt-3 font-bold text-[#426B53] text-right text-sm">
                      ${pr.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Approvals, PO Link & Workflow Audit */}
        <div className="space-y-6">
          {/* Approval Decision Box */}
          <div className="bg-white border border-[#E0E5DF] rounded-lg p-4 shadow-sm">
            <h3 className="text-xs font-bold font-mono uppercase text-[#252D28] mb-3">
              Approval Decision Record
            </h3>
            {pr.approvals && pr.approvals.length > 0 ? (
              <div className="space-y-3">
                {pr.approvals.map((appr: any) => (
                  <div key={appr.id} className="p-3 rounded border border-[#E0E5DF] bg-[#FDFEFC] text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-[#252D28]">{appr.approver?.name}</span>
                      <StatusBadge status={appr.decision} size="sm" />
                    </div>
                    {appr.comments && (
                      <p className="text-[11px] text-[#727D75] italic">"{appr.comments}"</p>
                    )}
                    <div className="text-[10px] font-mono text-[#727D75] mt-2">
                      {new Date(appr.decidedAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-[#F3F5F1] rounded text-xs text-[#727D75] text-center">
                No formal managerial decision has been recorded yet.
              </div>
            )}
          </div>

          {/* Linked PO Card */}
          {pr.purchaseOrder && (
            <div className="bg-white border border-[#E0E5DF] rounded-lg p-4 shadow-sm">
              <h3 className="text-xs font-bold font-mono uppercase text-[#252D28] mb-2">
                Fulfillment Purchase Order
              </h3>
              <div className="p-3 bg-[#EAF1EB]/50 border border-[#397754]/20 rounded text-xs space-y-1">
                <div className="font-mono font-bold text-[#426B53]">
                  {pr.purchaseOrder.poNumber}
                </div>
                <div className="text-[#727D75]">
                  Supplier: <span className="text-[#252D28] font-medium">{pr.purchaseOrder.supplier?.name}</span>
                </div>
                <div className="text-[#727D75]">
                  Status: <StatusBadge status={pr.purchaseOrder.status} size="sm" />
                </div>
              </div>
            </div>
          )}

          {/* State Machine Overview */}
          <div className="bg-white border border-[#E0E5DF] rounded-lg p-4 shadow-sm">
            <h3 className="text-xs font-bold font-mono uppercase text-[#252D28] mb-3">
              State Machine Progress
            </h3>
            <div className="space-y-2 text-xs">
              {[
                { label: 'Requisition Drafted', done: true },
                { label: 'Submitted for Review', done: ['SUBMITTED', 'APPROVED', 'PURCHASE_ORDER_CREATED', 'RECEIVED', 'INVOICE_VERIFIED', 'PAID'].includes(pr.status) },
                { label: 'Manager Approved', done: ['APPROVED', 'PURCHASE_ORDER_CREATED', 'RECEIVED', 'INVOICE_VERIFIED', 'PAID'].includes(pr.status) },
                { label: 'Purchase Order Issued', done: ['PURCHASE_ORDER_CREATED', 'RECEIVED', 'INVOICE_VERIFIED', 'PAID'].includes(pr.status) },
                { label: 'Goods Received & Inspected', done: ['RECEIVED', 'INVOICE_VERIFIED', 'PAID'].includes(pr.status) },
                { label: '3-Way Match Invoice Verified', done: ['INVOICE_VERIFIED', 'PAID'].includes(pr.status) },
                { label: 'Payment Disbursed', done: pr.status === 'PAID' },
              ].map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      step.done ? 'bg-[#397754] text-white' : 'bg-[#E0E5DF] text-[#727D75]'
                    }`}
                  >
                    {step.done ? '✓' : idx + 1}
                  </div>
                  <span className={step.done ? 'text-[#252D28] font-medium' : 'text-[#727D75]'}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
