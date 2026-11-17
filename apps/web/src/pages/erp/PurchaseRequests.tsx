import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { Plus, Search, Filter, RefreshCw, Eye } from 'lucide-react';

export const PurchaseRequests: React.FC = () => {
  const [prs, setPrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchPRs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/purchase-requests', {
        params: { status: statusFilter || undefined, search: search || undefined },
      });
      setPrs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPRs();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPRs();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Requisitions"
        subtitle="Manage employee requisitions, line items, and approval progress."
        actions={
          <Link
            to="/purchase-requests/new"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#426B53] hover:bg-[#31523F] text-white rounded text-xs font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Requisition</span>
          </Link>
        }
      />

      {/* Filters Bar */}
      <div className="bg-white border border-[#E0E5DF] rounded-lg p-3.5 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-80">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#727D75] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by PR # or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#E0E5DF] rounded bg-[#FDFEFC] focus:outline-none focus:border-[#426B53]"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-[#F3F5F1] hover:bg-[#E0E5DF] text-xs font-medium rounded transition"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-[#727D75]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-[#E0E5DF] rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-[#426B53]"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="PURCHASE_ORDER_CREATED">PURCHASE_ORDER_CREATED</option>
            <option value="PARTIALLY_RECEIVED">PARTIALLY_RECEIVED</option>
            <option value="RECEIVED">RECEIVED</option>
            <option value="INVOICE_VERIFIED">INVOICE_VERIFIED</option>
            <option value="PAID">PAID</option>
          </select>

          <button
            onClick={fetchPRs}
            className="p-1.5 border border-[#E0E5DF] hover:bg-[#F3F5F1] rounded text-[#727D75]"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E0E5DF] rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F3F5F1] border-b border-[#E0E5DF] text-[#727D75] font-mono text-[11px]">
                <th className="py-3 px-4 font-medium">PR NUMBER</th>
                <th className="py-3 px-4 font-medium">REQUISITION TITLE</th>
                <th className="py-3 px-4 font-medium">REQUESTED BY</th>
                <th className="py-3 px-4 font-medium">ITEMS</th>
                <th className="py-3 px-4 font-medium">TOTAL AMOUNT</th>
                <th className="py-3 px-4 font-medium">STATUS</th>
                <th className="py-3 px-4 font-medium text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0E5DF]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#727D75]">
                    Loading purchase requisitions...
                  </td>
                </tr>
              ) : prs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#727D75]">
                    No purchase requisitions found matching current criteria.
                  </td>
                </tr>
              ) : (
                prs.map((pr) => (
                  <tr key={pr.id} className="hover:bg-[#F3F5F1]/50 transition">
                    <td className="py-3 px-4 font-mono font-medium text-[#426B53]">
                      {pr.prNumber}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#252D28] max-w-xs truncate">
                      {pr.title}
                    </td>
                    <td className="py-3 px-4 text-[#727D75]">
                      <div>{pr.requestedBy?.name}</div>
                      <div className="text-[10px] text-[#727D75]/70">{pr.requestedBy?.department}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#727D75]">
                      {pr.items?.length || 0} line items
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#252D28]">
                      ${pr.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={pr.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/purchase-requests/${pr.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 border border-[#E0E5DF] hover:border-[#426B53] hover:text-[#426B53] rounded font-medium text-xs transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
