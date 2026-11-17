import { Router } from 'express';
import { AuthController, UserController } from '../controllers/AuthController';
import { PurchaseRequestController, ApprovalController } from '../controllers/PurchaseRequestController';
import {
  SupplierController,
  ProductController,
  PurchaseOrderController,
  GoodsReceiptController,
  InvoiceController,
  PaymentController,
  AuditController,
  DashboardController,
} from '../controllers/ERPControllers';
import { QAController } from '../controllers/QAController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { Role } from '@procureflow/shared';

const router = Router();

// --- Auth Routes ---
router.post('/auth/login', AuthController.login);
router.post('/auth/logout', authenticateToken, AuthController.logout);
router.post('/auth/refresh', AuthController.refresh);
router.get('/auth/me', authenticateToken, AuthController.me);

// --- User Management (Admin only) ---
router.get('/users', authenticateToken, requireRole(Role.ADMIN), UserController.list);
router.post('/users', authenticateToken, requireRole(Role.ADMIN), UserController.create);
router.get('/users/:id', authenticateToken, requireRole(Role.ADMIN), UserController.getById);
router.patch('/users/:id', authenticateToken, requireRole(Role.ADMIN), UserController.update);

// --- Dashboard ---
router.get('/dashboard/overview', authenticateToken, DashboardController.getOverview);

// --- Purchase Requests ---
router.get('/purchase-requests', authenticateToken, PurchaseRequestController.list);
router.post('/purchase-requests', authenticateToken, PurchaseRequestController.create);
router.get('/purchase-requests/:id', authenticateToken, PurchaseRequestController.getById);
router.patch('/purchase-requests/:id', authenticateToken, PurchaseRequestController.update);
router.post('/purchase-requests/:id/submit', authenticateToken, PurchaseRequestController.submit);
router.post('/purchase-requests/:id/transition', authenticateToken, PurchaseRequestController.transition);
router.post('/purchase-requests/:id/approve', authenticateToken, PurchaseRequestController.approve);
router.post('/purchase-requests/:id/reject', authenticateToken, PurchaseRequestController.reject);

// --- Approval Queue ---
router.get('/approvals/pending', authenticateToken, requireRole(Role.MANAGER, Role.ADMIN), ApprovalController.listPending);
router.post('/approvals/:id/decide', authenticateToken, requireRole(Role.MANAGER, Role.ADMIN), ApprovalController.decide);

// --- Suppliers ---
router.get('/suppliers', authenticateToken, SupplierController.list);
router.post('/suppliers', authenticateToken, requireRole(Role.PROCUREMENT, Role.ADMIN), SupplierController.create);
router.get('/suppliers/:id', authenticateToken, SupplierController.getById);
router.patch('/suppliers/:id', authenticateToken, requireRole(Role.PROCUREMENT, Role.ADMIN), SupplierController.update);

// --- Products ---
router.get('/products', authenticateToken, ProductController.list);
router.post('/products', authenticateToken, requireRole(Role.PROCUREMENT, Role.ADMIN), ProductController.create);
router.get('/products/:id', authenticateToken, ProductController.getById);

// --- Purchase Orders ---
router.get('/purchase-orders', authenticateToken, PurchaseOrderController.list);
router.post('/purchase-orders', authenticateToken, requireRole(Role.PROCUREMENT, Role.ADMIN), PurchaseOrderController.create);
router.get('/purchase-orders/:id', authenticateToken, PurchaseOrderController.getById);

// --- Goods Receipts ---
router.get('/goods-receipts', authenticateToken, GoodsReceiptController.list);
router.post('/goods-receipts', authenticateToken, requireRole(Role.PROCUREMENT, Role.ADMIN), GoodsReceiptController.create);
router.get('/goods-receipts/:id', authenticateToken, GoodsReceiptController.getById);

// --- Invoices ---
router.get('/invoices', authenticateToken, InvoiceController.list);
router.post('/invoices', authenticateToken, requireRole(Role.FINANCE, Role.ADMIN), InvoiceController.create);
router.get('/invoices/:id', authenticateToken, InvoiceController.getById);
router.post('/invoices/:id/verify', authenticateToken, requireRole(Role.FINANCE, Role.ADMIN), InvoiceController.verify);

// --- Payments ---
router.get('/payments', authenticateToken, PaymentController.list);
router.post('/payments', authenticateToken, requireRole(Role.FINANCE, Role.ADMIN), PaymentController.processPayment);
router.get('/payments/:id', authenticateToken, PaymentController.getById);

// --- Audit Events ---
router.get('/audit-events', authenticateToken, requireRole(Role.ADMIN), AuditController.list);

// --- Quality Lab API ---
router.get('/qa/overview', authenticateToken, QAController.getOverview);
router.get('/qa/scenarios', authenticateToken, QAController.listScenarios);
router.post('/qa/scenarios/run', authenticateToken, QAController.runScenarios);
router.get('/qa/runs', authenticateToken, QAController.listRuns);
router.get('/qa/runs/:id', authenticateToken, QAController.getRunById);
router.get('/qa/regression/analyze', authenticateToken, QAController.analyzeRegression);
router.get('/qa/regression/git', authenticateToken, QAController.getGitAnalysis);
router.get('/qa/model/status', authenticateToken, QAController.getModelStatus);
router.post('/qa/model/train', authenticateToken, QAController.trainModel);
router.get('/qa/defects', authenticateToken, QAController.listDefects);
router.patch('/qa/defects/:id', authenticateToken, QAController.updateDefect);
router.get('/qa/reports/:type', authenticateToken, QAController.exportReport);

export default router;
