import React, { useState } from 'react';
import { Menu, LogOut, ChevronDown, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from './StatusBadge';

interface TopBarProps {
  onOpenSidebar: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenSidebar }) => {
  const { user, logout, switchUserRole } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const demoPersonas = [
    { name: 'System Administrator', role: 'ADMIN', email: 'admin@procureflow.com', pass: 'Admin@123' },
    { name: 'Alice Walker', role: 'EMPLOYEE', email: 'alice@procureflow.com', pass: 'Employee@123' },
    { name: 'Bob Roberts', role: 'MANAGER', email: 'bob@procureflow.com', pass: 'Manager@123' },
    { name: 'Carol Danvers', role: 'PROCUREMENT', email: 'carol@procureflow.com', pass: 'Procure@123' },
    { name: 'Dave Johnson', role: 'FINANCE', email: 'dave@procureflow.com', pass: 'Finance@123' },
  ];

  return (
    <header className="h-16 bg-white border-b border-[#E0E5DF] sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-1.5 rounded hover:bg-[#F3F5F1] text-[#727D75] lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <span className="text-xs font-mono text-[#727D75] uppercase tracking-wider">
            Enterprise Operations Management
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Fast Persona Switcher */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded border border-[#E0E5DF] hover:bg-[#F3F5F1] text-xs transition"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#426B53]" />
            <span className="font-mono text-[11px] text-[#727D75] hidden md:inline">ROLE SWITCHER:</span>
            <span className="font-semibold text-[#252D28]">{user?.name}</span>
            <StatusBadge status={user?.role || 'GUEST'} size="sm" />
            <ChevronDown className="w-3.5 h-3.5 text-[#727D75]" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E0E5DF] rounded-lg shadow-lg py-1 z-50">
              <div className="px-3 py-1.5 border-b border-[#E0E5DF] text-[10px] font-mono uppercase tracking-wider text-[#727D75]">
                Switch Active Persona
              </div>
              {demoPersonas.map((p) => (
                <button
                  key={p.email}
                  onClick={async () => {
                    setDropdownOpen(false);
                    await switchUserRole(p.email, p.pass);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs hover:bg-[#EAF1EB] transition ${
                    user?.email === p.email ? 'bg-[#F3F5F1] font-semibold' : ''
                  }`}
                >
                  <div>
                    <div className="text-[#252D28]">{p.name}</div>
                    <div className="font-mono text-[10px] text-[#727D75]">{p.email}</div>
                  </div>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white border border-[#E0E5DF]">
                    {p.role}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          title="Sign Out"
          className="p-2 rounded border border-[#E0E5DF] hover:bg-[#F9ECEB] hover:text-[#B64C43] text-[#727D75] transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
