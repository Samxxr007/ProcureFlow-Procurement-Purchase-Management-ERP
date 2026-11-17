import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Building2,
  ShoppingCart,
  PackageCheck,
  Receipt,
  CreditCard,
  History,
  Users,
  ShieldCheck,
  Cpu,
  Terminal,
  Bug,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '@procureflow/shared';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const role = user?.role || Role.EMPLOYEE;

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-medium transition-colors ${
      isActive
        ? 'bg-[#314037] text-[#FFFFFF] shadow-sm'
        : 'text-[#DCE4DD]/80 hover:bg-[#28352D] hover:text-[#FFFFFF]'
    }`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[238px] bg-[#202A24] border-r border-[#303B33] flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Mark Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#303B33]">
          <div className="flex items-center gap-3">
            {/* Geometric Stacked-Box Procurement Logo */}
            <div className="w-8 h-8 rounded bg-[#426B53] flex items-center justify-center p-1.5 shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-white" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <div className="font-mono text-xs font-bold tracking-wider text-[#FFFFFF]">PROCUREFLOW</div>
              <div className="text-[9px] tracking-widest text-[#DCE4DD]/60 uppercase font-sans">OPERATIONS CONSOLE</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#DCE4DD]/60 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Section: Operations */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-mono tracking-wider text-[#DCE4DD]/40 uppercase">
              Operations
            </div>
            <nav className="space-y-0.5">
              <NavLink to="/" end className={navItemClass}>
                <LayoutDashboard className="w-4 h-4 shrink-0 text-[#DCE4DD]/70" />
                <span>Overview</span>
              </NavLink>

              <NavLink to="/purchase-requests" className={navItemClass}>
                <FileText className="w-4 h-4 shrink-0 text-[#DCE4DD]/70" />
                <span>Requisitions</span>
              </NavLink>

              {(role === Role.MANAGER || role === Role.ADMIN) && (
                <NavLink to="/approvals" className={navItemClass}>
                  <CheckSquare className="w-4 h-4 shrink-0 text-[#DCE4DD]/70" />
                  <span>Approval Queue</span>
                </NavLink>
              )}

              <NavLink to="/suppliers" className={navItemClass}>
                <Building2 className="w-4 h-4 shrink-0 text-[#DCE4DD]/70" />
                <span>Suppliers</span>
              </NavLink>

              {(role === Role.PROCUREMENT || role === Role.ADMIN || role === Role.FINANCE) && (
                <>
                  <NavLink to="/purchase-orders" className={navItemClass}>
                    <ShoppingCart className="w-4 h-4 shrink-0 text-[#DCE4DD]/70" />
                    <span>Purchase Orders</span>
                  </NavLink>

                  <NavLink to="/goods-receipts" className={navItemClass}>
                    <PackageCheck className="w-4 h-4 shrink-0 text-[#DCE4DD]/70" />
                    <span>Goods Receipts</span>
                  </NavLink>
                </>
              )}

              {(role === Role.FINANCE || role === Role.ADMIN) && (
                <>
                  <NavLink to="/invoices" className={navItemClass}>
                    <Receipt className="w-4 h-4 shrink-0 text-[#DCE4DD]/70" />
                    <span>Invoices</span>
                  </NavLink>

                  <NavLink to="/payments" className={navItemClass}>
                    <CreditCard className="w-4 h-4 shrink-0 text-[#DCE4DD]/70" />
                    <span>Payments</span>
                  </NavLink>
                </>
              )}

              {role === Role.ADMIN && (
                <>
                  <NavLink to="/audit-log" className={navItemClass}>
                    <History className="w-4 h-4 shrink-0 text-[#DCE4DD]/70" />
                    <span>Audit Trail</span>
                  </NavLink>

                  <NavLink to="/users" className={navItemClass}>
                    <Users className="w-4 h-4 shrink-0 text-[#DCE4DD]/70" />
                    <span>User Roles</span>
                  </NavLink>
                </>
              )}
            </nav>
          </div>

          {/* Section: Quality Lab */}
          <div>
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-wider text-[#426B53] font-bold uppercase bg-[#EAF1EB]/10 px-1.5 py-0.5 rounded">
                Quality Lab
              </span>
            </div>
            <nav className="space-y-0.5">
              <NavLink to="/qa" end className={navItemClass}>
                <ShieldCheck className="w-4 h-4 shrink-0 text-[#426B53]" />
                <span>QA Overview</span>
              </NavLink>

              <NavLink to="/qa/authorization" className={navItemClass}>
                <Terminal className="w-4 h-4 shrink-0 text-[#426B53]" />
                <span>Authorization Lab</span>
              </NavLink>

              <NavLink to="/qa/regression" className={navItemClass}>
                <Cpu className="w-4 h-4 shrink-0 text-[#426B53]" />
                <span>Regression ML</span>
              </NavLink>

              <NavLink to="/qa/execution" className={navItemClass}>
                <History className="w-4 h-4 shrink-0 text-[#426B53]" />
                <span>Execution History</span>
              </NavLink>

              <NavLink to="/qa/defects" className={navItemClass}>
                <Bug className="w-4 h-4 shrink-0 text-[#426B53]" />
                <span>Defect Tracker</span>
              </NavLink>

              <NavLink to="/qa/reports" className={navItemClass}>
                <FileSpreadsheet className="w-4 h-4 shrink-0 text-[#426B53]" />
                <span>Quality Reports</span>
              </NavLink>
            </nav>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#303B33] bg-[#19221C]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#397754] animate-pulse" />
            <span className="text-[11px] font-mono text-[#DCE4DD]/60">SUT Engine: v1.0.0</span>
          </div>
          <div className="text-[10px] text-[#DCE4DD]/40 mt-0.5 truncate">
            {user?.name} ({role})
          </div>
        </div>
      </aside>
    </>
  );
};
