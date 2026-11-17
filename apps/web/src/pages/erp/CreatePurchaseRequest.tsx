import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { PageHeader } from '../../components/PageHeader';
import { Plus, Trash2, ArrowLeft, Save, Send } from 'lucide-react';

export const CreatePurchaseRequest: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [justification, setJustification] = useState('');
  const [requiredDate, setRequiredDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [products, setProducts] = useState<any[]>([]);

  const [items, setItems] = useState<Array<{
    productId: string;
    itemDescription: string;
    quantity: number;
    unitPrice: number;
  }>>([
    { productId: '', itemDescription: '', quantity: 1, unitPrice: 0 },
  ]);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/products').then((res) => setProducts(res.data)).catch(() => {});
  }, []);

  const handleProductSelect = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    const newItems = [...items];
    if (prod) {
      newItems[index] = {
        productId: prod.id,
        itemDescription: prod.name,
        quantity: newItems[index].quantity || 1,
        unitPrice: prod.unitPrice || 0,
      };
    } else {
      newItems[index].productId = '';
    }
    setItems(newItems);
  };

  const updateItem = (index: number, field: string, val: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = val;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { productId: '', itemDescription: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  const handleSave = async (autoSubmit = false) => {
    setError(null);
    if (!title.trim()) {
      setError('Please provide a requisition title.');
      return;
    }
    if (!justification.trim()) {
      setError('Please provide a business justification.');
      return;
    }
    for (const itm of items) {
      if (!itm.itemDescription.trim()) {
        setError('All line items must have a description.');
        return;
      }
      if (itm.quantity <= 0) {
        setError('Item quantities must be positive integers.');
        return;
      }
      if (itm.unitPrice < 0) {
        setError('Item prices cannot be negative.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await api.post('/purchase-requests', {
        title,
        justification,
        requiredDate: new Date(requiredDate).toISOString(),
        items,
      });

      const prId = res.data.id;
      if (autoSubmit) {
        await api.post(`/purchase-requests/${prId}/submit`);
      }
      navigate(`/purchase-requests/${prId}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create purchase requisition.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Create Purchase Requisition"
        subtitle="Specify required products, quantities, and justification for operational review."
        actions={
          <button
            onClick={() => navigate('/purchase-requests')}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E0E5DF] hover:bg-white rounded text-xs font-medium transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
        }
      />

      {error && (
        <div className="p-3 bg-[#F9ECEB] border border-[#B64C43]/30 rounded text-xs text-[#B64C43]">
          {error}
        </div>
      )}

      {/* Main Form Box */}
      <div className="bg-white border border-[#E0E5DF] rounded-lg p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[#252D28] mb-1.5">
              Requisition Title <span className="text-[#B64C43]">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Ergonomic Office Equipment Refresh Q3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E0E5DF] rounded focus:outline-none focus:border-[#426B53]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#252D28] mb-1.5">
              Required Delivery Date <span className="text-[#B64C43]">*</span>
            </label>
            <input
              type="date"
              value={requiredDate}
              onChange={(e) => setRequiredDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E0E5DF] rounded focus:outline-none focus:border-[#426B53]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[#252D28] mb-1.5">
              Business Justification <span className="text-[#B64C43]">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Explain the business need, team or project budget allocation, and operational criticality..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E0E5DF] rounded focus:outline-none focus:border-[#426B53]"
            />
          </div>
        </div>

        {/* Line Items Section */}
        <div className="border-t border-[#E0E5DF] pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#252D28]">Requisition Line Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#EAF1EB] hover:bg-[#D5E4D8] text-[#426B53] rounded text-xs font-medium transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Line Item</span>
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-3 items-end p-3 border border-[#E0E5DF] rounded-md bg-[#FDFEFC]"
              >
                <div className="col-span-12 md:col-span-4">
                  <label className="block text-[11px] text-[#727D75] mb-1">Catalog Preset</label>
                  <select
                    value={item.productId}
                    onChange={(e) => handleProductSelect(idx, e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-[#E0E5DF] rounded bg-white"
                  >
                    <option value="">-- Custom Item Description --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code}: {p.name} (${p.unitPrice})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-12 md:col-span-4">
                  <label className="block text-[11px] text-[#727D75] mb-1">Item Description</label>
                  <input
                    type="text"
                    placeholder="Specification / model..."
                    value={item.itemDescription}
                    onChange={(e) => updateItem(idx, 'itemDescription', e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-[#E0E5DF] rounded bg-white"
                  />
                </div>

                <div className="col-span-4 md:col-span-1">
                  <label className="block text-[11px] text-[#727D75] mb-1">Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full text-xs px-2 py-1.5 border border-[#E0E5DF] rounded font-mono text-center bg-white"
                  />
                </div>

                <div className="col-span-4 md:col-span-2">
                  <label className="block text-[11px] text-[#727D75] mb-1">Unit Price ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-full text-xs px-2 py-1.5 border border-[#E0E5DF] rounded font-mono bg-white"
                  />
                </div>

                <div className="col-span-4 md:col-span-1 flex items-center justify-between pb-1">
                  <span className="font-mono text-xs font-semibold text-[#252D28] md:hidden">
                    ${(item.quantity * item.unitPrice).toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    disabled={items.length <= 1}
                    className="p-1.5 text-[#B64C43] hover:bg-[#F9ECEB] rounded disabled:opacity-30"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Grand Total Bar */}
          <div className="mt-4 p-4 bg-[#F3F5F1] rounded-md flex items-center justify-between border border-[#E0E5DF]">
            <span className="text-xs font-mono uppercase text-[#727D75]">Calculated Requisition Total:</span>
            <span className="text-lg font-mono font-bold text-[#426B53]">${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="border-t border-[#E0E5DF] pt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSave(false)}
            className="flex items-center gap-1.5 px-4 py-2 border border-[#E0E5DF] hover:bg-[#F3F5F1] rounded text-xs font-medium text-[#252D28] transition disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-[#727D75]" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSave(true)}
            className="flex items-center gap-1.5 px-5 py-2 bg-[#426B53] hover:bg-[#31523F] text-white rounded text-xs font-medium transition shadow-sm disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Submit for Manager Approval</span>
          </button>
        </div>
      </div>
    </div>
  );
};
