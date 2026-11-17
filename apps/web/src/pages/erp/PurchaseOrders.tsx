import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { ShoppingCart, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { Role } from '@procureflow/shared';

export const PurchaseOrders: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialPRId = searchParams.get('prId');

  const isProcurement = user?.role === Role.PROCUREMENT || user?.role === Role.ADMIN;

  const [pos, setPos] = useState<any[]>([]);
  const [approvedPRs, setApprovedPRs] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(!!initialPRId);

  const [selectedPRId, setSelectedPRId] = useState(initialPRId || '');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [posRes, prsRes, suppRes] = await Promise.all([
        api.get('/purchase-orders'),
        api.get('/purchase-requests', { params: { status: 'APPROVED' } }),
        api.get('/suppliers', { params: { activeOnly: true } }),
      ]);
      setPos(posRes.data);
      setApprovedPRs(prsRes.data);
      setSuppliers(suppRes.data);
      if (suppRes.data.length > 0 && !selectedSupplierId) {
        setSelectedSupplierId(suppRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPRId || !selectedSupplierId) {
      setError('Please select both an approved Purchase Request and an active Supplier.');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      await api.post('/purchase-orders', {
        purchaseRequestId: selectedPRId,
        supplierId: selectedSupplierId,
      });
      setShowModal(false);
      setSelectedPRId('');
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to issue Purchase Order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders"
        subtitle="Manage legally binding procurement orders issued to commercial vendors."
        actions={
          isProcurement && (
            <button
              onClick={() => {
                setError(null);
                setShowModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#426B53] hover:bg-[#31523F] text-white rounded text-xs font-medium transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Issue Purchase Order</span>
            </button>
          )
        }
      />

      {/* PO Table */}
      <div className="bg-white border border-[#E0E5DF] rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F3F5F1] border-b border-[#E0E5DF] text-[#727D75] font-mono text-[11px]">
                <th className="py-3 px-4 font-medium">PO NUMBER</th>
                <th className="py-3 px-4 font-medium">LINKED REQUISITION</th>
                <th className="py-3 px-4 font-medium">SUPPLIER</th>
                <th className="py-3 px-4 font-medium">TOTAL VALUE</th>
                <th className="py-3 px-4 font-medium">ISSUED ON</th>
                <th className="py-3 px-4 font-medium">RECEIPTS</th>
                <th className="py-3 px-4 font-medium text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0E5DF]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#727D75]">
                    Loading Purchase Orders...
                  </td>
                </tr>
              ) : pos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#727D75]">
                    No Purchase Orders found.
                  </td>
                </tr>
              ) : (
                pos.map((po) => (
                  <tr key={po.id} className="hover:bg-[#F3F5F1]/50 transition">
                    <td className="py-3 px-4 font-mono font-medium text-[#426B53]">
                      {po.poNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[#727D75] mr-1.5">{po.purchaseRequest?.prNumber}:</span>
                      <span className="font-medium text-[#252D28]">{po.purchaseRequest?.title}</span>
                    </td>
                    <td className="py-3 px-4 text-[#252D28] font-medium">
                      {po.supplier?.name}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#252D28]">
                      ${po.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#727D75]">
                      {new Date(po.issuedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#727D75]">
                      {po.goodsReceipts?.length || 0} delivery receipts
                    </td>
                    <td className="py-3 px-4 text-right">
                      <StatusBadge status={po.status} size="sm" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create PO Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-[#E0E5DF] max-w-lg w-full p-6 shadow-xl">
            <h2 className="text-base font-bold text-[#252D28] mb-1">
              Issue Commercial Purchase Order
            </h2>
            <p className="text-xs text-[#727D75] mb-4">
              Create an official purchase order from an approved requisition.
            </p>

            {error && (
              <div className="mb-4 p-2.5 bg-[#F9ECEB] border border-[#B64C43]/30 rounded text-xs text-[#B64C43] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreatePO} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#252D28] mb-1">
                  Approved Purchase Requisition *
                </label>
                <select
                  required
                  value={selectedPRId}
                  onChange={(e) => setSelectedPRId(e.target.value)}
                  className="w-full px-2.5 py-2 border border-[#E0E5DF] rounded bg-white text-xs"
                >
                  <option value="">-- Select Approved Requisition --</option>
                  {approvedPRs.map((pr) => (
                    <option key={pr.id} value={pr.id}>
                      {pr.prNumber}: {pr.title} (${pr.totalAmount.toLocaleString()})
                    </option>
                  ))}
                </select>
                {approvedPRs.length === 0 && (
                  <p className="text-[11px] text-[#B78337] mt-1">
                    No approved requisitions currently available. Requisitions must be APPROVED by a manager first.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-medium text-[#252D28] mb-1">
                  Vendor / Supplier *
                </label>
                <select
                  required
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full px-2.5 py-2 border border-[#E0E5DF] rounded bg-white text-xs"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code}: {s.name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E0E5DF]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 border border-[#E0E5DF] hover:bg-[#F3F5F1] rounded text-[#727D75]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || approvedPRs.length === 0}
                  className="px-4 py-1.5 bg-[#426B53] hover:bg-[#31523F] text-white rounded font-medium transition disabled:opacity-50"
                >
                  {submitting ? 'Issuing PO...' : 'Issue Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
