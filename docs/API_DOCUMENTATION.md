# ProcureFlow — REST API Documentation

Base URL: `http://localhost:3001/api`

## Authentication
- `POST /auth/login`: Authenticates with email & password. Issues 15m JWT access token and 7d refresh token.
- `POST /auth/logout`: Revokes current session in SQLite database.
- `POST /auth/refresh`: Exchanges valid refresh token for a rotated token pair. Detects reuse.
- `GET /auth/me`: Retrieves current user profile and role.

## User Management (Admin Only)
- `GET /users`: List all users.
- `POST /users`: Create new user.
- `GET /users/:id`: Get user details.
- `PATCH /users/:id`: Update user role or status.

## Dashboard
- `GET /dashboard/overview`: Calculates real aggregates (total PRs, pending approvals, active POs, goods awaiting receipt, invoices due, total expenditure, monthly breakdown, status distribution, and recent audit events).

## Purchase Requests
- `GET /purchase-requests`: List purchase requests (scoped to user ownership for employees; organization-wide for managers, procurement, finance, and admins). Supports `?status=` and `?search=`.
- `POST /purchase-requests`: Create requisition with line items. Validates positive quantities and prices.
- `GET /purchase-requests/:id`: Retrieve requisition details with line items and approval trail.
- `PATCH /purchase-requests/:id`: Update requisition (restricted to DRAFT status and owning employee).
- `POST /purchase-requests/:id/submit`: Advances status from DRAFT to SUBMITTED.
- `POST /purchase-requests/:id/approve`: Approves requisition. Rejects self-approval attempts with HTTP 403.
- `POST /purchase-requests/:id/reject`: Rejects requisition with mandatory comment.

## Approvals
- `GET /approvals/pending`: Retrieves pending requisitions awaiting manager approval.
- `POST /approvals/:id/decide`: Records decision (`APPROVED` or `REJECTED`).

## Suppliers
- `GET /suppliers`: List suppliers with active purchase order counts.
- `POST /suppliers`: Create new supplier (Procurement/Admin only).
- `GET /suppliers/:id`: Get supplier details with associated orders.
- `PATCH /suppliers/:id`: Update supplier info or active status.

## Purchase Orders
- `GET /purchase-orders`: List purchase orders.
- `POST /purchase-orders`: Issue purchase order from an APPROVED requisition. Transitions PR status to `PURCHASE_ORDER_CREATED`.

## Goods Receipts
- `GET /goods-receipts`: List goods receipts.
- `POST /goods-receipts`: Log delivery. Compares ordered vs received. Transitions PO to `PARTIALLY_RECEIVED` or `FULFILLED` and PR to `RECEIVED`.

## Invoices & Payments
- `GET /invoices`: List commercial invoices.
- `POST /invoices`: Record vendor invoice.
- `POST /invoices/:id/verify`: Verifies 3-way match. Rejects with HTTP 400 if Goods Receipt is missing or unaccepted.
- `GET /payments`: List payments.
- `POST /payments`: Process financial payment. Validates idempotency key (rejects duplicate keys with HTTP 409). Advances invoice and PR to `PAID`.

## Audit Log
- `GET /audit-events`: Immutable audit trail (Admin only).

## Quality Lab API
- `GET /qa/overview`: Aggregated platform quality metrics.
- `GET /qa/scenarios`: Returns 15 stateful authorization scenarios.
- `POST /qa/scenarios/run`: Executes scenarios under `standard` or `vulnerable` profile.
- `GET /qa/runs`: List test runs.
- `GET /qa/runs/:id`: Get execution run details with per-scenario oracle assertions.
- `GET /qa/regression/analyze`: Analyzes Git diff and returns predicted failure probabilities.
- `GET /qa/model/status`: Returns model readiness score and empirical evidence breakdown.
- `POST /qa/model/train`: Retrains Random Forest or Logistic Regression model.
- `GET /qa/defects`: Defect repository tracker.
- `PATCH /qa/defects/:id`: Update defect status and retest results.
- `GET /qa/reports/:type`: Downloadable report export (supports `?format=csv`).
