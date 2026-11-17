# ProcureFlow — Role Permission Matrix

| Operation / Capability | ADMIN | EMPLOYEE | MANAGER | PROCUREMENT | FINANCE |
|---|:---:|:---:|:---:|:---:|:---:|
| **Authentication & Profile** |
| Login / Logout / Refresh | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Own Profile (`/api/auth/me`) | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Purchase Requisitions** |
| Create PR (`POST /api/purchase-requests`) | ✅ | ✅ (own) | ✅ (own) | ✅ (own) | ❌ |
| View Own PRs | ✅ | ✅ | ✅ | ✅ | ✅ |
| View All Department PRs | ✅ | ❌ | ✅ | ✅ | ✅ |
| Edit Draft PR (`PATCH`) | ✅ | ✅ (if owner) | ✅ (if owner) | ❌ | ❌ |
| Submit Draft PR (`POST /submit`) | ✅ | ✅ (if owner) | ✅ (if owner) | ❌ | ❌ |
| Modify Approved PR | ❌ (Immutable) | ❌ (Immutable) | ❌ (Immutable) | ❌ (Immutable) | ❌ (Immutable) |
| **Manager Approvals** |
| View Pending Approval Queue | ✅ | ❌ | ✅ | ❌ | ❌ |
| Approve Subordinate PR | ✅ | ❌ | ✅ | ❌ | ❌ |
| Approve Own PR (Separation of Duties) | ❌ (Blocked) | ❌ (Blocked) | ❌ (Blocked) | ❌ (Blocked) | ❌ (Blocked) |
| Reject Subordinate PR | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Supplier Management** |
| View Approved Suppliers | ✅ | ✅ | ✅ | ✅ | ✅ |
| Register New Supplier | ✅ | ❌ | ❌ | ✅ | ❌ |
| Update Supplier Info & Tax ID | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Purchase Orders & Dock Receiving** |
| Create Purchase Order from Approved PR | ✅ | ❌ | ❌ | ✅ | ❌ |
| Create PO from Unapproved PR | ❌ (Blocked) | ❌ (Blocked) | ❌ (Blocked) | ❌ (Blocked) | ❌ (Blocked) |
| Record Goods Delivery Receipt | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Financial Settlement** |
| Record Commercial Vendor Invoice | ✅ | ❌ | ❌ | ❌ | ✅ |
| Verify Invoice 3-Way Match | ✅ | ❌ | ❌ | ❌ | ✅ |
| Verify Invoice without Accepted GR | ❌ (Blocked) | ❌ (Blocked) | ❌ (Blocked) | ❌ (Blocked) | ❌ (Blocked) |
| Disburse Payment with Idempotency Key | ✅ | ❌ | ❌ | ❌ | ✅ |
| Disburse Duplicate Payment | ❌ (409 Conflict) | ❌ (409 Conflict) | ❌ (409 Conflict) | ❌ (409 Conflict) | ❌ (409 Conflict) |
| **Administrative & QA Operations** |
| User Account & Role Management | ✅ | ❌ | ❌ | ❌ | ❌ |
| View System Audit Trail | ✅ | ❌ | ❌ | ❌ | ❌ |
| Run Quality Lab Scenarios & Retrain ML | ✅ | ❌ | ❌ | ❌ | ❌ |
