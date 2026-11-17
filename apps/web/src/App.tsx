import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppShell } from './components/AppShell';

// Auth Pages
import { Login } from './pages/auth/Login';

// ERP Pages
import { Dashboard } from './pages/erp/Dashboard';
import { PurchaseRequests } from './pages/erp/PurchaseRequests';
import { CreatePurchaseRequest } from './pages/erp/CreatePurchaseRequest';
import { PurchaseRequestDetails } from './pages/erp/PurchaseRequestDetails';
import { ApprovalQueue } from './pages/erp/ApprovalQueue';
import { Suppliers } from './pages/erp/Suppliers';
import { PurchaseOrders } from './pages/erp/PurchaseOrders';
import { GoodsReceipts } from './pages/erp/GoodsReceipts';
import { Invoices } from './pages/erp/Invoices';
import { Payments } from './pages/erp/Payments';
import { AuditLog } from './pages/erp/AuditLog';
import { Users } from './pages/erp/Users';

// Quality Lab Pages
import { QAOverview } from './pages/qa/QAOverview';
import { AuthorizationLab } from './pages/qa/AuthorizationLab';
import { RegressionIntelligence } from './pages/qa/RegressionIntelligence';
import { ExecutionHistory } from './pages/qa/ExecutionHistory';
import { DefectRepository } from './pages/qa/DefectRepository';
import { QualityReports } from './pages/qa/QualityReports';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F3F5F1] flex items-center justify-center font-mono text-xs text-[#727D75]">
        Initializing ProcureFlow session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            {/* ERP Routes */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/purchase-requests" element={<PurchaseRequests />} />
            <Route path="/purchase-requests/new" element={<CreatePurchaseRequest />} />
            <Route path="/purchase-requests/:id" element={<PurchaseRequestDetails />} />
            <Route path="/approvals" element={<ApprovalQueue />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/purchase-orders" element={<PurchaseOrders />} />
            <Route path="/goods-receipts" element={<GoodsReceipts />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/audit-log" element={<AuditLog />} />
            <Route path="/users" element={<Users />} />

            {/* Quality Lab Routes */}
            <Route path="/qa" element={<QAOverview />} />
            <Route path="/qa/authorization" element={<AuthorizationLab />} />
            <Route path="/qa/regression" element={<RegressionIntelligence />} />
            <Route path="/qa/execution" element={<ExecutionHistory />} />
            <Route path="/qa/defects" element={<DefectRepository />} />
            <Route path="/qa/reports" element={<QualityReports />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
