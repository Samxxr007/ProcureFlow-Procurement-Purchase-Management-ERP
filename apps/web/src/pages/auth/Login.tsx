import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isExpired = new URLSearchParams(location.search).get('expired') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (em: string, pw: string) => {
    setEmail(em);
    setPassword(pw);
  };

  const demoAccounts = [
    { role: 'ADMIN', name: 'Admin', email: 'admin@procureflow.com', pass: 'Admin@123' },
    { role: 'EMPLOYEE', name: 'Alice (Emp)', email: 'alice@procureflow.com', pass: 'Employee@123' },
    { role: 'MANAGER', name: 'Bob (Mgr)', email: 'bob@procureflow.com', pass: 'Manager@123' },
    { role: 'PROCUREMENT', name: 'Carol (Proc)', email: 'carol@procureflow.com', pass: 'Procure@123' },
    { role: 'FINANCE', name: 'Dave (Fin)', email: 'dave@procureflow.com', pass: 'Finance@123' },
  ];

  return (
    <div className="min-h-screen bg-[#F3F5F1] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded bg-[#426B53] text-white mb-3 shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-xl font-bold font-mono tracking-wider text-[#252D28]">PROCUREFLOW</h1>
          <p className="text-xs font-mono tracking-widest text-[#727D75] uppercase mt-0.5">
            Procurement Operations & Quality Lab
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-white border border-[#E0E5DF] rounded-lg p-6 shadow-sm">
          {isExpired && (
            <div className="mb-4 p-3 bg-[#F9F4EB] border border-[#B78337]/30 rounded text-xs text-[#B78337] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Your session has expired or was revoked. Please log in again.</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-[#F9ECEB] border border-[#B64C43]/30 rounded text-xs text-[#B64C43] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#252D28] mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#727D75] absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@procureflow.com"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-[#E0E5DF] rounded bg-[#FDFEFC] focus:outline-none focus:border-[#426B53] focus:ring-1 focus:ring-[#426B53]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#252D28] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#727D75] absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-[#E0E5DF] rounded bg-[#FDFEFC] focus:outline-none focus:border-[#426B53] focus:ring-1 focus:ring-[#426B53]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#426B53] hover:bg-[#31523F] text-white rounded text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Console'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Demo Persona Shortcuts */}
          <div className="mt-6 pt-5 border-t border-[#E0E5DF]">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#727D75] mb-2 uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-[#426B53]" />
              <span>Development Access Personas (Click to autofill)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {demoAccounts.map((d) => (
                <button
                  key={d.role}
                  type="button"
                  onClick={() => fillCredentials(d.email, d.pass)}
                  className="p-1.5 text-left border border-[#E0E5DF] hover:border-[#426B53] hover:bg-[#EAF1EB] rounded text-[11px] transition"
                >
                  <div className="font-semibold text-[#252D28]">{d.name}</div>
                  <div className="font-mono text-[9px] text-[#727D75]">{d.role}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center mt-6 text-[11px] font-mono text-[#727D75]">
          Secured with stateful session tokens & centralized role authorization.
        </div>
      </div>
    </div>
  );
};
