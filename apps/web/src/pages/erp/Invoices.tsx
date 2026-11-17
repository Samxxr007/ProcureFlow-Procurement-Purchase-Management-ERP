import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { Receipt, Plus, CheckCircle, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import { Role } from '@procureflow/shared';

export const Invoices: React.FC = () => {
  const { user } = useAuth();
  const isFinance = user?.role === Role.FINANCE || user?.role === Role.ADMIN;

  const [invoices, setInvoices] = useState<any[]>([]);
  const [pos, setPos] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [invNumber, setInvNumber] = useState('');
  const [selectedPOId, setSelectedPOId] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [amount, setAmount] = useState(0);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, posRes, suppRes] = await Promise.all([
        api.get('/invoices'),
        api.get('/purchase-orders'),
        api.get('/suppliers'),
      ]);
      setInvoices(invRes.data);
      setPos(posRes.data);
      setSuppliers(suppRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePOSelect = (poId: string) => {
    setSelectedPOId(poId);
    const po = pos.find((p) => p.id === poId);
    if (po) {
      setSelectedSupplierId(po.supplierId);
      setAmount(po.totalAmount);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await api.post('/invoices', {
        invoiceNumber: invNumber,
        purchaseOrderId: selectedPOId,
        supplierId: selectedSupplierId,
        amount,
        dueDate,
      });
      setShowModal(false);
      setInvNumber('');
      setSelectedPOId('');
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to record invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyInvoice = async (invoiceId: string) => {
    const notes = prompt('Enter 3-way match verification notes:', 'Verified against accepted Goods Receipt and matching purchase order.');
    if (notes === null) return;

    try {
      await api.post(`/invoices/${invoiceId}/verify`, { notes });
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Verification failed: 3-way match condition not satisfied.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commercial Invoices"
        subtitle="Perform 3-way matching between purchase orders, physical goods receipts, and vendor invoices."
        actions={
          isFinance && (
            <button
              onClick={() => {
                setError(null);
                setShowModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#426B53] hover:bg-[#31523F] text-white rounded text-xs font-medium transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Record Vendor Invoice</span>
            </button>
          )
        }
      />

      {/* Invoices Table */}
      <div className="bg-white border border-[#E0E5DF] rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F3F5F1] border-b border-[#E0E5DF] text-[#727D75] font-mono text-[11px]">
                <th className="py-3 px-4 font-medium">INVOICE NUMBER</th>
                <th className="py-3 px-4 font-medium">PURCHASE ORDER</th>
                <th className="py-3 px-4 font-medium">SUPPLIER</th>
                <th className="py-3 px-4 font-medium">AMOUNT</th>
                <th className="py-3 px-4 font-medium">DUE DATE</th>
                <th className="py-3 px-4 font-medium">3-WAY MATCH</th>
                <th className="py-3 px-4 font-medium text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0E5DF]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#727D75]">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#727D75]">
                    No invoices recorded yet.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const hasGR = inv.purchaseOrder?.goodsReceipts?.some(
                    (g: any) => g.status === 'ACCEPTED'
                  );
                  return (
                    <tr key={inv.id} className="hover:bg-[#F3F5F1]/50 transition">
                      <td className="py-3 px-4 font-mono font-medium text-[#426B53]">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-[#252D28]">
                        {inv.purchaseOrder?.poNumber}
                      </td>
                      <td className="py-3 px-4 text-[#252D28] font-medium">
                        {inv.supplier?.name}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#252D28]">
                        ${inv.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#727D75]">
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          {hasGR ? (
                            <span className="text-[#397754] flex items-center gap-1 bg-[#EAF1EB] px-1.5 py-0.5 rounded">
                              <ShieldCheck className="w-3 h-3" />
                              PO & GR Matched
                            </span>
                          ) : (
                            <span className="text-[#B78337] flex items-center gap-1 bg-[#F9F4EB] px-1.5 py-0.5 rounded">
                              <AlertCircle className="w-3 h-3" />
                              Missing Goods Receipt
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <StatusBadge status={inv.status} size="sm" />
                          {inv.status === 'PENDING' && isFinance && (
                            <button
                              onClick={() => handleVerifyInvoice(inv.id)}
                              className="px-2.5 py-1 bg-[#426B53] hover:bg-[#31523F] text-white rounded text-xs font-medium transition"
                            >
                              Verify
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-[#E0E5DF] max-w-md w-full p-6 shadow-xl">
            <h2 className="text-base font-bold text-[#252D28] mb-1">
              Record Supplier Invoice
            </h2>
            <p className="text-xs text-[#727D75] mb-4">
              Enter bill details received from the vendor for reconciliation.
            </p>

            {error && (
              <div className="mb-4 p-2.5 bg-[#F9ECEB] border border-[#B64C43]/30 rounded text-xs text-[#B64C43] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateInvoice} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-[#252D28] mb-1">
                  Vendor Invoice Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="INV-SUP-2026-9901"
                  value={invNumber}
                  onChange={(e) => setInvNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#E0E5DF] rounded font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-[#252D28] mb-1">
                  Associated Purchase Order *
                </label>
                <select
                  required
                  value={selectedPOId}
                  onChange={(e) => handlePOSelect(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#E0E5DF] rounded bg-white font-mono"
                >
                  <option value="">-- Select Purchase Order --</option>
                  {pos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.poNumber} — {p.supplier?.name} (${p.totalAmount.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#252D28] mb-1">
                  Supplier *
                </label>
                <select
                  required
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#E0E5DF] rounded bg-white"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code}: {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#252D28] mb-1">
                    Invoice Amount ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 border border-[#E0E5DF] rounded font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#252D28] mb-1">
                    Payment Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-[#E0E5DF] rounded font-mono"
                  />
                </div>
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
                  disabled={submitting}
                  className="px-4 py-1.5 bg-[#426B53] hover:bg-[#31523F] text-white rounded font-medium disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Record Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
