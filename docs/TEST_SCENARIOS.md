# ProcureFlow — Stateful Authorization Scenarios (AUTH-001 - AUTH-015)

| Scenario ID | Category | Title | Acting Role | Expected Status | State Oracle Check |
|---|---|---|---|:---:|---|
| **AUTH-001** | Role & Duties | Employee self-approval prevention | `EMPLOYEE` | 403 Forbidden | PurchaseRequest remains `SUBMITTED`, no Approval created |
| **AUTH-002** | Resource Ownership | Cross-user resource isolation (editing peer draft) | `EMPLOYEE` | 403 Forbidden | PurchaseRequest `requestedById` unchanged |
| **AUTH-003** | Workflow Auth | Unauthorized PO creation from unapproved PR | `PROCUREMENT` | 400 Bad Request | No PurchaseOrder record created |
| **AUTH-004** | Financial Controls | Payment rejection for unapproved request | `FINANCE` | 400 Bad Request | No Payment record created |
| **AUTH-005** | 3-Way Match | Payment/verification rejection prior to goods receipt | `FINANCE` | 400 Bad Request | Invoice status remains `PENDING` |
| **AUTH-006** | Data Immutability | Modification of approved requests blocked | `EMPLOYEE` | 400 Bad Request | PurchaseRequest status and total amount unchanged |
| **AUTH-007** | State Machine | Invalid workflow transition (DRAFT to INVOICE_VERIFIED) | `ADMIN` | 400 Bad Request | PurchaseRequest remains `DRAFT` |
| **AUTH-008** | Session Lifecycle | Stale session access rejected after logout | `EMPLOYEE` | 401 Unauthorized | Session marked revoked |
| **AUTH-009** | Financial Controls | Duplicate payment idempotency enforcement | `FINANCE` | 409 Conflict | Exactly 1 Payment record exists |
| **AUTH-010** | Privilege Escalation| Unauthorized administrative access by non-admin | `EMPLOYEE` | 403 Forbidden | No user created, audit logs inaccessible |
| **AUTH-011** | Session Lifecycle | Refresh token reuse detection & revocation | `EMPLOYEE` | 401 Unauthorized | Token family invalidated |
| **AUTH-012** | Resource Ownership | IDOR on supplier modification | `EMPLOYEE` | 403 Forbidden | Supplier taxId unchanged |
| **AUTH-013** | Positive Workflow | Authorized employee creates PR | `EMPLOYEE` | 201 Created | PR record created with status `DRAFT` |
| **AUTH-014** | Positive Workflow | Manager approves subordinate's submitted request | `MANAGER` | 200 OK | PR status `APPROVED`, Approval record created |
| **AUTH-015** | Positive Workflow | Complete verified 3-way match invoice payment | `FINANCE` | 201 Created | Payment recorded, Invoice and PR status `PAID` |
