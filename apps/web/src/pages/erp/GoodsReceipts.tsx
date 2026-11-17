import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { PackageCheck, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { Role } from '@procureflow/shared';

export const GoodsReceipts: React.FC = () => {
  const { user } = useAuth();
  const isProcurement = user?.role === Role.PROCUREMENT || user?.role === Role.ADMIN;

  const [grs, setGrs] = useState<any[]>([]);
  const [pos, setPos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [selectedPOId, setSelectedPOId] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [notes, setNotes] = useState('');
  const [itemsInspection, setItemsInspection] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [grsRes, posRes] = await Promise.all([
        api.get('/goods-receipts'),
        api.get('/purchase-orders'),
      ]);
      setGrs(grsRes.data);
      // POs eligible for receipt (ISSUED or PARTIALLY_RECEIVED)
      const eligiblePOs = posRes.data.filter((p: any) =>
        ['ISSUED', 'PARTIALLY_RECEIVED'].includes(p.status)
      );
      setPos(eligiblePOs);
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
    const foundPO = pos.find((p) => p.id === poId);
    if (foundPO && foundPO.items) {
      setItemsInspection(
        foundPO.items.map((i: any) => ({
          itemDescription: i.itemDescription,
          orderedQuantity: i.quantity,
          receivedQuantity: i.quantity,
          damagedQuantity: 0,
        }))
      );
    } else {
      setItemsInspection([]);
    }
  };

  const handleCreateGR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPOId || itemsInspection.length === 0) {
      setError('Please select an active Purchase Order with line items.');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      await api.post('/goods-receipts', {
        purchaseOrderId: selectedPOId,
        deliveryNoteNumber: deliveryNote,
        notes,
        items: itemsInspection,
      });
      setShowModal(false);
      setSelectedPOId('');
      setItemsInspection([]);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to record Goods Receipt.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goods Receipts & Quality Inspection"
        subtitle="Log physical dock deliveries, record damages, and confirm item count matching."
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
              <span>Record Delivery Receipt</span>
            </button>
          )
        }
      />

      {/* Receipts Table */}
      <div className="bg-white border border-[#E0E5DF] rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F3F5F1] border-b border-[#E0E5DF] text-[#727D75] font-mono text-[11px]">
                <th className="py-3 px-4 font-medium">RECEIPT NUMBER</th>
                <th className="py-3 px-4 font-medium">PURCHASE ORDER</th>
                <th className="py-3 px-4 font-medium">DELIVERY NOTE</th>
                <th className="py-3 px-4 font-medium">RECEIVED BY</th>
                <th className="py-3 px-4 font-medium">INSPECTION ITEMS</th>
                <th className="py-3 px-4 font-medium">TIMESTAMP</th>
                <th className="py-3 px-4 font-medium text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0E5DF]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#727D75]">
                    Loading Goods Receipts...
                  </td>
                </tr>
              ) : grs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#727D75]">
                    No Goods Receipts recorded yet.
                  </td>
                </tr>
              ) : (
                grs.map((gr) => (
                  <tr key={gr.id} className="hover:bg-[#F3F5F1]/50 transition">
                    <td className="py-3 px-4 font-mono font-medium text-[#426B53]">
                      {gr.grNumber}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-[#252D28]">
                      {gr.purchaseOrder?.poNumber}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#727D75]">
                      {gr.deliveryNoteNumber || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-[#252D28]">
                      {gr.receivedBy?.name}
                    </td>
                    <td className="py-3 px-4 text-[#727D75] font-mono">
                      {gr.items?.length || 0} inspected
                    </td>
                    <td className="py-3 px-4 font-mono text-[#727D75]">
                      {new Date(gr.receivedAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <StatusBadge status={gr.status} size="sm" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Delivery Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-[#E0E5DF] max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-[#252D28] mb-1">
              Record Goods Delivery & Inspection
            </h2>
            <p className="text-xs text-[#727D75] mb-4">
              Compare shipped quantities against purchase order specifications.
            </p>

            {error && (
              <div className="mb-4 p-2.5 bg-[#F9ECEB] border border-[#B64C43]/30 rounded text-xs text-[#B64C43] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateGR} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#252D28] mb-1">
                    Select Purchase Order *
                  </label>
                  <select
                    required
                    value={selectedPOId}
                    onChange={(e) => handlePOSelect(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-[#E0E5DF] rounded bg-white text-xs font-mono"
                  >
                    <option value="">-- Select Active PO --</option>
                    {pos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.poNumber} — {p.supplier?.name} (${p.totalAmount.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#252D28] mb-1">
                    Carrier Delivery Note / BOL #
                  </label>
                  <input
                    type="text"
                    placeholder="DN-994182"
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-[#E0E5DF] rounded font-mono"
                  />
                </div>
              </div>

              {/* Items Inspection Table */}
              {itemsInspection.length > 0 && (
                <div className="border border-[#E0E5DF] rounded-md overflow-hidden">
                  <div className="bg-[#F3F5F1] px-3 py-2 border-b border-[#E0E5DF] font-mono text-[11px] font-bold text-[#252D28]">
                    QUANTITY INSPECTION & DAMAGE VERIFICATION
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E0E5DF] text-[#727D75] font-mono text-[10px]">
                        <th className="py-2 px-3">ITEM DESCRIPTION</th>
                        <th className="py-2 px-3 text-center">ORDERED</th>
                        <th className="py-2 px-3 text-center">RECEIVED</th>
                        <th className="py-2 px-3 text-center">DAMAGED</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E0E5DF]">
                      {itemsInspection.map((itm, idx) => (
                        <tr key={idx} className="bg-white">
                          <td className="py-2 px-3 font-medium text-[#252D28]">
                            {itm.itemDescription}
                          </td>
                          <td className="py-2 px-3 text-center font-mono text-[#727D75]">
                            {itm.orderedQuantity}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max={itm.orderedQuantity}
                              value={itm.receivedQuantity}
                              onChange={(e) => {
                                const newItms = [...itemsInspection];
                                newItms[idx].receivedQuantity = parseFloat(e.target.value) || 0;
                                setItemsInspection(newItms);
                              }}
                              className="w-16 px-1.5 py-1 text-center border border-[#E0E5DF] rounded font-mono"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <input
                              type="number"
                              min="0"
                              value={itm.damagedQuantity}
                              onChange={(e) => {
                                const newItms = [...itemsInspection];
                                newItms[idx].damagedQuantity = parseFloat(e.target.value) || 0;
                                setItemsInspection(newItms);
                              }}
                              className="w-16 px-1.5 py-1 text-center border border-[#E0E5DF] rounded font-mono text-[#B64C43]"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div>
                <label className="block font-medium text-[#252D28] mb-1">
                  Receiving Inspector Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes on packaging condition, seal numbers, or delivery exceptions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#E0E5DF] rounded text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E0E5DF]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 border border-[#E0E5DF] hover:bg-[#F3F5F1] rounded text-[#727D75]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedPOId}
                  className="px-4 py-1.5 bg-[#426B53] hover:bg-[#31523F] text-white rounded font-medium disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Accept Goods Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
