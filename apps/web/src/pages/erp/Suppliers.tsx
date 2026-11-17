import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { PageHeader } from '../../components/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { Building2, Plus, Search, Edit2, CheckCircle2, XCircle, Phone, Mail, MapPin } from 'lucide-react';
import { Role } from '@procureflow/shared';

export const Suppliers: React.FC = () => {
  const { user } = useAuth();
  const isProcurement = user?.role === Role.PROCUREMENT || user?.role === Role.ADMIN;

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null);

  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formTaxId, setFormTaxId] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/suppliers', { params: { search: search || undefined } });
      setSuppliers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setFormCode('');
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormAddress('');
    setFormTaxId('');
    setFormIsActive(true);
    setError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (s: any) => {
    setEditingSupplier(s);
    setFormCode(s.code);
    setFormName(s.name);
    setFormEmail(s.email);
    setFormPhone(s.phone || '');
    setFormAddress(s.address || '');
    setFormTaxId(s.taxId || '');
    setFormIsActive(s.isActive);
    setError(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (editingSupplier) {
        await api.patch(`/suppliers/${editingSupplier.id}`, {
          name: formName,
          email: formEmail,
          phone: formPhone,
          address: formAddress,
          taxId: formTaxId,
          isActive: formIsActive,
        });
      } else {
        await api.post('/suppliers', {
          code: formCode,
          name: formName,
          email: formEmail,
          phone: formPhone,
          address: formAddress,
          taxId: formTaxId,
        });
      }
      setShowModal(false);
      await fetchSuppliers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supplier Directory"
        subtitle="Manage approved industrial vendors, compliance information, and contract contacts."
        actions={
          isProcurement && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#426B53] hover:bg-[#31523F] text-white rounded text-xs font-medium transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Register Vendor</span>
            </button>
          )
        }
      />

      {/* Search Bar */}
      <div className="bg-white border border-[#E0E5DF] rounded-lg p-3 shadow-sm flex items-center justify-between">
        <div className="relative w-80">
          <Search className="w-4 h-4 text-[#727D75] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search suppliers by name, code or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchSuppliers()}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#E0E5DF] rounded bg-[#FDFEFC] focus:outline-none focus:border-[#426B53]"
          />
        </div>
        <span className="text-xs font-mono text-[#727D75]">
          {suppliers.length} Registered Suppliers
        </span>
      </div>

      {/* Supplier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((s) => (
          <div
            key={s.id}
            className="bg-white border border-[#E0E5DF] rounded-lg p-4 shadow-sm hover:border-[#426B53]/50 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-[#426B53] bg-[#EAF1EB] px-2 py-0.5 rounded">
                  {s.code}
                </span>
                <span
                  className={`inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded ${
                    s.isActive
                      ? 'bg-[#EAF1EB] text-[#397754]'
                      : 'bg-[#F9ECEB] text-[#B64C43]'
                  }`}
                >
                  {s.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {s.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>

              <h2 className="text-sm font-bold text-[#252D28] mb-1">{s.name}</h2>
              <div className="text-[11px] font-mono text-[#727D75] mb-3">Tax ID: {s.taxId || 'N/A'}</div>

              <div className="space-y-1.5 text-xs text-[#727D75]">
                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-3.5 h-3.5 shrink-0 text-[#727D75]" />
                  <span className="truncate">{s.email}</span>
                </div>
                {s.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 shrink-0 text-[#727D75]" />
                    <span>{s.phone}</span>
                  </div>
                )}
                {s.address && (
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-[#727D75]" />
                    <span className="truncate">{s.address}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E0E5DF] flex items-center justify-between text-xs">
              <span className="text-[#727D75] font-mono text-[11px]">
                {s._count?.purchaseOrders || 0} Purchase Orders
              </span>
              {isProcurement && (
                <button
                  onClick={() => handleOpenEdit(s)}
                  className="flex items-center gap-1 text-[#426B53] hover:underline font-medium text-xs"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Supplier Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-[#E0E5DF] max-w-md w-full p-6 shadow-xl">
            <h2 className="text-base font-bold text-[#252D28] mb-1">
              {editingSupplier ? 'Edit Supplier Information' : 'Register New Vendor'}
            </h2>
            <p className="text-xs text-[#727D75] mb-4">
              Enter compliance and contact specifications.
            </p>

            {error && (
              <div className="mb-4 p-2.5 bg-[#F9ECEB] border border-[#B64C43]/30 rounded text-xs text-[#B64C43]">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              {!editingSupplier && (
                <div>
                  <label className="block font-medium text-[#252D28] mb-1">Supplier Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="SUP-101"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="w-full px-2.5 py-1.5 border border-[#E0E5DF] rounded font-mono uppercase"
                  />
                </div>
              )}

              <div>
                <label className="block font-medium text-[#252D28] mb-1">Company / Vendor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Apex Industrial Technologies"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#E0E5DF] rounded"
                />
              </div>

              <div>
                <label className="block font-medium text-[#252D28] mb-1">Contact Email *</label>
                <input
                  type="email"
                  required
                  placeholder="orders@vendor.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#E0E5DF] rounded font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-[#252D28] mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+1-555-0100"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#E0E5DF] rounded"
                />
              </div>

              <div>
                <label className="block font-medium text-[#252D28] mb-1">Physical Address</label>
                <input
                  type="text"
                  placeholder="100 Industrial Pkwy, Chicago, IL"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#E0E5DF] rounded"
                />
              </div>

              <div>
                <label className="block font-medium text-[#252D28] mb-1">Tax ID / EIN</label>
                <input
                  type="text"
                  placeholder="TAX-US-9901"
                  value={formTaxId}
                  onChange={(e) => setFormTaxId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#E0E5DF] rounded font-mono"
                />
              </div>

              {editingSupplier && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded text-[#426B53]"
                  />
                  <label htmlFor="isActive" className="text-xs font-medium text-[#252D28]">
                    Active vendor status (permitted for new POs)
                  </label>
                </div>
              )}

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
                  {submitting ? 'Saving...' : 'Save Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
