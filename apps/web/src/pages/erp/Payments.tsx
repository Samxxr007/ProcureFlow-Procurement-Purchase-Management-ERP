import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, Plus, RefreshCw, AlertCircle, KeyRound, ShieldAlert } from 'lucide-react';
import { Role } from '@procureflow/shared';

export const Payments: React.FC = () => {
  const { user } = useAuth();
  const isFinance = user?.role === Role.FINANCE || user?.role === Role.ADMIN;

  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('WIRE_TRANSFER');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payRes, invRes] = await Promise.all([
        api.get('/payments'),
        api.get('/invoices'),
      ]);
      setPayments(payRes.data);
      // Invoices eligible for payment (VERIFIED)
      setInvoices(invRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openPaymentModal = (invoiceId?: string) => {
    setSelectedInvoiceId(invoiceId || '');
    // Generate fresh random idempotency key
    setIdempotencyKey(`idem-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`);
    setNotes('');
    setError(null);
    setShowModal(true);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId || !idempotencyKey) {
      setError('Please select an invoice and provide an idempotency key.');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      await api.post('/payments', {
        invoiceId: selectedInvoiceId,
        paymentMethod,
        idempotencyKey,
        referenceNotes: notes,
      });
      setShowModal(false);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Payment disbursement rejected.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Disbursements"
        subtitle="Process validated commercial disbursements with idempotency control and banking audit records."
        actions={
          isFinance && (
            <button
              onClick={() => openPaymentModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#426B53] hover:bg-[#31523F] text-white rounded text-xs font-medium transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Process Disbursement</span>
            </button>
          )
        }
      />

      {/* Payments Table */}
      <div className="bg-white border border-[#E0E5DF] rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F3F5F1] border-b border-[#E0E5DF] text-[#727D75] font-mono text-[11px]">
                <th className="py-3 px-4 font-medium">PAYMENT NUMBER</th>
                <th className="py-3 px-4 font-medium">INVOICE NUMBER</th>
                <th className="py-3 px-4 font-medium">BENEFICIARY VENDOR</th>
                <th className="py-3 px-4 font-medium">AMOUNT</th>
                <th className="py-3 px-4 font-medium">METHOD</th>
                <th className="py-3 px-4 font-medium">IDEMPOTENCY KEY</th>
                <th className="py-3 px-4 font-medium">PROCESSED BY</th>
                <th className="py-3 px-4 font-medium text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0E5DF]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-[#727D75]">
                    Loading disbursements...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-[#727D75]">
                    No payments disbursed yet.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F3F5F1]/50 transition">
                    <td className="py-3 px-4 font-mono font-medium text-[#426B53]">
                      {p.paymentNumber}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#252D28]">
                      {p.invoice?.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-[#252D28] font-medium">
                      {p.invoice?.supplier?.name}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#397754]">
                      ${p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#727D75]">
                      {p.paymentMethod}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#727D75] max-w-[140px] truncate" title={p.idempotencyKey}>
                      {p.idempotencyKey}
                    </td>
                    <td className="py-3 px-4 text-[#727D75]">
                      {p.paidBy?.name}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <StatusBadge status={p.status} size="sm" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Process Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-[#E0E5DF] max-w-lg w-full p-6 shadow-xl">
            <h2 className="text-base font-bold text-[#252D28] mb-1">
              Process Vendor Disbursement
            </h2>
            <p className="text-xs text-[#727D75] mb-4">
              Disburse financial payment against a verified commercial invoice.
            </p>

            {error && (
              <div className="mb-4 p-2.5 bg-[#F9ECEB] border border-[#B64C43]/30 rounded text-xs text-[#B64C43] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleProcessPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-[#252D28] mb-1">
                  Select Commercial Invoice *
                </label>
                <select
                  required
                  value={selectedInvoiceId}
                  onChange={(e) => setSelectedInvoiceId(e.target.value)}
                  className="w-full px-2.5 py-2 border border-[#E0E5DF] rounded bg-white font-mono text-xs"
                >
                  <option value="">-- Select Invoice --</option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} — {inv.supplier?.name} (${inv.amount.toLocaleString()}) [{inv.status}]
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-[#727D75] mt-1">
                  Note: Backend policy will reject unverified or already paid invoices.
                </p>
              </div>

              <div>
                <label className="block font-medium text-[#252D28] mb-1">
                  Disbursement Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#E0E5DF] rounded bg-white"
                >
                  <option value="WIRE_TRANSFER">Wire Transfer (Fedwire / SWIFT)</option>
                  <option value="EFT_ACH">Automated Clearing House (ACH)</option>
                  <option value="CORPORATE_CARD">Corporate Purchasing Card (P-Card)</option>
                  <option value="CHECK">Commercial Paper Check</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-[#252D28] flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-[#426B53]" />
                    <span>Payment Idempotency Key *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIdempotencyKey(`idem-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`)}
                    className="text-[10px] font-mono text-[#426B53] hover:underline"
                  >
                    Generate Fresh Key
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={idempotencyKey}
                  onChange={(e) => setIdempotencyKey(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#E0E5DF] rounded font-mono text-xs bg-[#FDFEFC]"
                />
                <p className="text-[10px] text-[#727D75] mt-1">
                  Reusing an idempotency key will trigger HTTP 409 Conflict rejection.
                </p>
              </div>

              <div>
                <label className="block font-medium text-[#252D28] mb-1">
                  Remittance / Reference Notes
                </label>
                <input
                  type="text"
                  placeholder="Terms Net 30 settled via corporate account..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#E0E5DF] rounded text-xs"
                />
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
                  disabled={submitting || !selectedInvoiceId}
                  className="px-4 py-1.5 bg-[#426B53] hover:bg-[#31523F] text-white rounded font-medium disabled:opacity-50"
                >
                  {submitting ? 'Disbursing...' : 'Disburse Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
