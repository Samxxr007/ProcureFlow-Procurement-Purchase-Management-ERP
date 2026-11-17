# ProcureFlow — System Architecture

## Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                            ProcureFlow Presentation Tier                          |
|                       React 18 + Vite SPA (:5173 / dist)                          |
|  - Quiet Industrial Operations Console (IBM Plex Sans, IBM Plex Mono)            |
|  - Operations Workspace (Requisitions, Approvals, POs, Receipts, Invoices, Pay)   |
|  - Quality Lab Console (Auth Testing, ML Regression, Execution History, Defects)  |
+-----------------------------------------------------------------------------------+
                                        |  REST JSON + Bearer JWT
                                        v
+-----------------------------------------------------------------------------------+
|                             Backend Application API                               |
|                         Express + TypeScript (:3001)                              |
|                                                                                   |
|  [Middleware Pipeline]                                                            |
|    - CORS, Request Logger, Error Handler, Bearer JWT Auth, Session Revocation     |
|                                                                                   |
|  [Central Policy & Workflow Layer]                                                |
|    - AuthorizationPolicy (Separation of duties, ownership, 3-way match, roles)    |
|    - WorkflowService (Finite State Machine transitions & audit logging)           |
|                                                                                   |
|  [Business Services]                                                             |
|    - AuthService, UserService, PurchaseRequestService, ApprovalService            |
|    - SupplierService, PurchaseOrderService, GoodsReceiptService                   |
|    - InvoiceService (3-Way Match Verification), PaymentService (Idempotency)      |
|    - DashboardService, AuditService, GitAnalysisService                           |
|                                                                                   |
|  [Quality Assurance Engine]                                                       |
|    - ScenarioRunner, ResponseOracle, StateOracle, VulnerabilityProfiles           |
|    - RegressionIntelligenceService (Adaptive Mode Selector)                       |
+-----------------------------------------------------------------------------------+
             |                                              |
             | Internal REST HTTP                           | Prisma ORM
             v                                              v
+-----------------------------+           +-----------------------------------------+
|     Python ML Service       |           |           Database Storage              |
|   FastAPI + Scikit-Learn    |           |          SQLite Engine (dev.db)         |
|         (:8000)             |           |                                         |
|                             |           |  - User, Session, Product, Supplier     |
|  - /status (Readiness)      |           |  - PurchaseRequest, PRItem, Approval    |
|  - /predict (Risk Prob.)    |           |  - PurchaseOrder, GoodsReceipt, Invoice |
|  - /train (Fit Classifiers) |           |  - Payment, AuditEvent                  |
|  - Feature Engineering      |           |  - TestCase, TestRun, TestScenario      |
|  - Joblib Models Storage    |           |  - Defect, GitCommit, ExecutionHistory  |
+-----------------------------+           +-----------------------------------------+
```

## Component Responsibilities

### 1. Presentation Tier (`apps/web`)
- Desktop-first enterprise console adhering strictly to the Quiet Industrial Operations Console design guidelines.
- Clean semantic palette: `#F3F5F1` background, `#202A24` forest-charcoal sidebar, `#426B53` accent.
- Dynamic persona switcher for examination live viva demonstrations.
- Interactive Dual Oracle breakdown view in the Authorization Lab.

### 2. Backend API Tier (`apps/api`)
- Stateless HTTP REST endpoints with stateful session tracking via SQLite.
- Immediate session revocation upon logout: JWTs carry a `sessionId` verified in real-time.
- Multi-step database transactions for financial disbursements, approval decisions, and fulfillment status updates.
- Separation of duties: employees cannot approve their own requisitions, managers cannot approve self-generated requisitions.
- Financial controls: duplicate payment attempts are rejected with HTTP 409 Conflict using unique idempotency keys.

### 3. Machine Learning Tier (`apps/ml-service`)
- Python FastAPI microservice encapsulating feature extraction, chronological model training, and regression probability inference.
- Feature extraction: code change magnitude, file path overlap ratio, criticality weighting, historical failure rate.
- Random Forest (primary) and Logistic Regression (baseline).
- Model persistence via `joblib` in `stored_models/`.
