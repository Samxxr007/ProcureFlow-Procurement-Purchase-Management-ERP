import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { Users as UsersIcon, Plus, ShieldCheck, Mail, RefreshCw } from 'lucide-react';

export const Users: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('EMPLOYEE');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('Password123!');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await api.post('/users', {
        name,
        email,
        role,
        department,
        password,
      });
      setShowModal(false);
      setName('');
      setEmail('');
      await fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create user account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Roles & Access Control"
        subtitle="Manage organization user accounts, department associations, and security roles."
        actions={
          <button
            onClick={() => {
              setError(null);
              setShowModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#426B53] hover:bg-[#31523F] text-white rounded text-xs font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create User Account</span>
          </button>
        }
      />

      {/* Users Table */}
      <div className="bg-white border border-[#E0E5DF] rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F3F5F1] border-b border-[#E0E5DF] text-[#727D75] font-mono text-[11px]">
                <th className="py-3 px-4 font-medium">NAME</th>
                <th className="py-3 px-4 font-medium">EMAIL</th>
                <th className="py-3 px-4 font-medium">ROLE</th>
                <th className="py-3 px-4 font-medium">DEPARTMENT</th>
                <th className="py-3 px-4 font-medium">REQUISITIONS</th>
                <th className="py-3 px-4 font-medium text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0E5DF]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-[#727D75]">
                    Loading users...
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F3F5F1]/50 transition">
                    <td className="py-3 px-4 font-medium text-[#252D28]">
                      {u.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#727D75]">
                      {u.email}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={u.role} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-[#727D75]">
                      {u.department || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#727D75]">
                      {u._count?.purchaseRequests || 0} PRs
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono text-[11px] text-[#397754]">
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-[#E0E5DF] max-w-md w-full p-6 shadow-xl">
            <h2 className="text-base font-bold text-[#252D28] mb-1">
              Create User Account
            </h2>
            <p className="text-xs text-[#727D75] mb-4">
              Assign role and initial credentials.
            </p>

            {error && (
              <div className="mb-4 p-2.5 bg-[#F9ECEB] border border-[#B64C43]/30 rounded text-xs text-[#B64C43]">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-[#252D28] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#E0E5DF] rounded"
                />
              </div>

              <div>
                <label className="block font-medium text-[#252D28] mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="john@procureflow.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#E0E5DF] rounded font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#252D28] mb-1">System Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-[#E0E5DF] rounded bg-white font-mono"
                  >
                    <option value="EMPLOYEE">EMPLOYEE</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="PROCUREMENT">PROCUREMENT</option>
                    <option value="FINANCE">FINANCE</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#252D28] mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="Engineering / Ops"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-[#E0E5DF] rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#252D28] mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#E0E5DF] rounded font-mono"
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
                  disabled={submitting}
                  className="px-4 py-1.5 bg-[#426B53] hover:bg-[#31523F] text-white rounded font-medium disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
