import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import {
  FileText,
  Clock,
  ShoppingCart,
  PackageCheck,
  Receipt,
  DollarSign,
  ArrowUpRight,
  RefreshCw,
  Plus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/overview');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard overview', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 font-mono text-sm text-[#727D75]">
          <RefreshCw className="w-4 h-4 animate-spin text-[#426B53]" />
          <span>Loading operational metrics from database...</span>
        </div>
      </div>
    );
  }

  const { metrics, statusDistribution, monthlyExpenditure, recentPurchaseRequests, recentAuditEvents } = data || {};

  const statusPieData = statusDistribution
    ? Object.keys(statusDistribution).map((k) => ({ name: k, value: statusDistribution[k] }))
    : [];

  const PIE_COLORS: Record<string, string> = {
    DRAFT: '#727D75',
    SUBMITTED: '#B78337',
    APPROVED: '#426B53',
    REJECTED: '#B64C43',
    PURCHASE_ORDER_CREATED: '#506E86',
    PARTIALLY_RECEIVED: '#D97706',
    RECEIVED: '#2563EB',
    INVOICE_VERIFIED: '#0D9488',
    PAID: '#397754',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Procurement Operations Console"
        subtitle="Live transactional overview and supply chain lifecycle metrics."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={fetchOverview}
              className="p-2 border border-[#E0E5DF] hover:bg-white rounded text-[#727D75] transition"
              title="Refresh Metrics"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <Link
              to="/purchase-requests/new"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#426B53] hover:bg-[#31523F] text-white rounded text-xs font-medium transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Requisition</span>
            </Link>
          </div>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-[#E0E5DF] rounded-lg p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-[#727D75] mb-2">
            <span className="text-xs font-medium">Requisitions</span>
            <FileText className="w-4 h-4 text-[#426B53]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#252D28]">
            {metrics?.totalPurchaseRequests || 0}
          </div>
          <div className="text-[10px] text-[#727D75] mt-1">Total PRs created</div>
        </div>

        <div className="bg-white border border-[#E0E5DF] rounded-lg p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-[#727D75] mb-2">
            <span className="text-xs font-medium">Pending Approvals</span>
            <Clock className="w-4 h-4 text-[#B78337]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#B78337]">
            {metrics?.pendingApprovals || 0}
          </div>
          <div className="text-[10px] text-[#727D75] mt-1">Awaiting manager decision</div>
        </div>

        <div className="bg-white border border-[#E0E5DF] rounded-lg p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-[#727D75] mb-2">
            <span className="text-xs font-medium">Active POs</span>
            <ShoppingCart className="w-4 h-4 text-[#506E86]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#252D28]">
            {metrics?.activePurchaseOrders || 0}
          </div>
          <div className="text-[10px] text-[#727D75] mt-1">Issued to suppliers</div>
        </div>

        <div className="bg-white border border-[#E0E5DF] rounded-lg p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-[#727D75] mb-2">
            <span className="text-xs font-medium">Awaiting Receipt</span>
            <PackageCheck className="w-4 h-4 text-[#727D75]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#252D28]">
            {metrics?.goodsAwaitingReceipt || 0}
          </div>
          <div className="text-[10px] text-[#727D75] mt-1">In transit / delivery</div>
        </div>

        <div className="bg-white border border-[#E0E5DF] rounded-lg p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-[#727D75] mb-2">
            <span className="text-xs font-medium">Invoices Due</span>
            <Receipt className="w-4 h-4 text-[#506E86]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#252D28]">
            {metrics?.outstandingInvoices || 0}
          </div>
          <div className="text-[10px] text-[#727D75] mt-1">Pending verification</div>
        </div>

        <div className="bg-white border border-[#E0E5DF] rounded-lg p-3.5 shadow-sm bg-gradient-to-br from-white to-[#EAF1EB]/30">
          <div className="flex items-center justify-between text-[#727D75] mb-2">
            <span className="text-xs font-medium">Total Spend</span>
            <DollarSign className="w-4 h-4 text-[#397754]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#397754]">
            ${(metrics?.totalExpenditure || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-[#727D75] mt-1">Settled payments</div>
        </div>
      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Expenditure Chart */}
        <div className="lg:col-span-2 bg-white border border-[#E0E5DF] rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#252D28]">Monthly Procurement Expenditure</h2>
              <p className="text-xs text-[#727D75]">Aggregated disbursements calculated from payment records</p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#F3F5F1] text-[#727D75]">USD ($)</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyExpenditure || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E5DF" vertical={false} />
                <XAxis dataKey="month" stroke="#727D75" fontSize={11} fontFamily="IBM Plex Mono" />
                <YAxis stroke="#727D75" fontSize={11} fontFamily="IBM Plex Mono" tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#202A24', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                  formatter={(val: any) => [`$${val.toLocaleString()}`, 'Expenditure']}
                />
                <Bar dataKey="amount" fill="#426B53" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PR Lifecycle Distribution */}
        <div className="bg-white border border-[#E0E5DF] rounded-lg p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#252D28] mb-1">Status Distribution</h2>
            <p className="text-xs text-[#727D75] mb-4">Requisitions categorized across workflow lifecycle</p>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={3}
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name] || '#727D75'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#202A24', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legend Grid */}
          <div className="grid grid-cols-2 gap-1.5 pt-3 border-t border-[#E0E5DF] text-[11px] font-mono">
            {statusPieData.slice(0, 6).map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[item.name] || '#727D75' }} />
                <span className="text-[#727D75] truncate">{item.name}:</span>
                <span className="font-bold text-[#252D28]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Row: Recent Requisitions & Audit Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Requisitions */}
        <div className="lg:col-span-2 bg-white border border-[#E0E5DF] rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#252D28]">Recent Purchase Requisitions</h2>
              <p className="text-xs text-[#727D75]">Latest employee requisitions submitted to the platform</p>
            </div>
            <Link to="/purchase-requests" className="text-xs font-medium text-[#426B53] hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E0E5DF] text-[#727D75] font-mono text-[11px]">
                  <th className="pb-2.5 font-medium">PR NUMBER</th>
                  <th className="pb-2.5 font-medium">TITLE</th>
                  <th className="pb-2.5 font-medium">REQUESTER</th>
                  <th className="pb-2.5 font-medium">TOTAL</th>
                  <th className="pb-2.5 font-medium text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0E5DF]">
                {recentPurchaseRequests?.map((pr: any) => (
                  <tr key={pr.id} className="hover:bg-[#F3F5F1]/50 transition">
                    <td className="py-2.5 font-mono font-medium text-[#426B53]">
                      <Link to={`/purchase-requests/${pr.id}`} className="hover:underline">
                        {pr.prNumber}
                      </Link>
                    </td>
                    <td className="py-2.5 font-medium text-[#252D28] max-w-[200px] truncate">{pr.title}</td>
                    <td className="py-2.5 text-[#727D75]">{pr.requestedBy?.name}</td>
                    <td className="py-2.5 font-mono text-[#252D28]">${pr.totalAmount.toLocaleString()}</td>
                    <td className="py-2.5 text-right">
                      <StatusBadge status={pr.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Stream */}
        <div className="bg-white border border-[#E0E5DF] rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#252D28]">Recent Audit Events</h2>
              <p className="text-xs text-[#727D75]">Immutable security & workflow log</p>
            </div>
            <Link to="/audit-log" className="text-xs font-medium text-[#426B53] hover:underline flex items-center gap-1">
              <span>Logs</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentAuditEvents?.map((ev: any) => (
              <div key={ev.id} className="text-xs pb-2 border-b border-[#E0E5DF]/60 last:border-0 last:pb-0">
                <div className="flex items-center justify-between font-mono text-[10px] text-[#727D75]">
                  <span>{new Date(ev.createdAt).toLocaleTimeString()}</span>
                  <span className="font-bold text-[#426B53]">{ev.entityName}</span>
                </div>
                <div className="font-mono font-semibold text-[#252D28] text-[11px] mt-0.5">
                  {ev.action}
                </div>
                <div className="text-[11px] text-[#727D75] truncate mt-0.5">
                  by {ev.user?.name || 'System Engine'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
