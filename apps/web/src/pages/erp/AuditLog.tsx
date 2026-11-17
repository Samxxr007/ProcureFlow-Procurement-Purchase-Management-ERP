import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { PageHeader } from '../../components/PageHeader';
import { History, RefreshCw, Search, ShieldCheck } from 'lucide-react';

export const AuditLog: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit-events');
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filtered = filterAction
    ? events.filter((e) => e.action.toLowerCase().includes(filterAction.toLowerCase()) || e.entityName.toLowerCase().includes(filterAction.toLowerCase()))
    : events;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security & Workflow Audit Trail"
        subtitle="Cryptographically verified event logs for state mutations, financial transactions, and authorization decisions."
        actions={
          <button
            onClick={fetchEvents}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E0E5DF] hover:bg-white rounded text-xs font-medium transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#727D75]" />
            <span>Refresh Events</span>
          </button>
        }
      />

      {/* Filter */}
      <div className="bg-white border border-[#E0E5DF] rounded-lg p-3 shadow-sm flex items-center justify-between">
        <div className="relative w-80">
          <Search className="w-4 h-4 text-[#727D75] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filter by action or entity..."
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#E0E5DF] rounded font-mono focus:outline-none focus:border-[#426B53]"
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-[#727D75]">
          <ShieldCheck className="w-4 h-4 text-[#426B53]" />
          <span>{filtered.length} Audit Events Logged</span>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white border border-[#E0E5DF] rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F3F5F1] border-b border-[#E0E5DF] text-[#727D75] font-mono text-[11px]">
                <th className="py-3 px-4 font-medium">TIMESTAMP</th>
                <th className="py-3 px-4 font-medium">ENTITY</th>
                <th className="py-3 px-4 font-medium">ACTION</th>
                <th className="py-3 px-4 font-medium">ACTOR USER</th>
                <th className="py-3 px-4 font-medium">ROLE</th>
                <th className="py-3 px-4 font-medium">DETAILS (METADATA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0E5DF]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-[#727D75]">
                    Loading audit events...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-[#727D75]">
                    No audit events match current criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((ev) => (
                  <tr key={ev.id} className="hover:bg-[#F3F5F1]/50 transition">
                    <td className="py-3 px-4 font-mono text-[#727D75] whitespace-nowrap">
                      {new Date(ev.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#426B53]">
                      {ev.entityName}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-[#252D28]">
                      {ev.action}
                    </td>
                    <td className="py-3 px-4 text-[#252D28]">
                      {ev.user?.name || 'System Engine'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#727D75]">
                      {ev.user?.role || 'SYSTEM'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#727D75] max-w-xs truncate" title={ev.details}>
                      {ev.details || '—'}
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
