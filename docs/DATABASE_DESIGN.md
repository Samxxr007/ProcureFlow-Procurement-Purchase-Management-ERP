# ProcureFlow — Database Design

## 1. Schema Architecture

The database is built using **Prisma ORM** over SQLite (`dev.db`). The schema encapsulates both the operational procurement domain and the QA intelligence platform.

### Domain Entities
- `User`: Organization accounts with roles (`ADMIN`, `EMPLOYEE`, `MANAGER`, `PROCUREMENT`, `FINANCE`).
- `Session`: Stateful session registry with unique refresh tokens, expiry timestamps, and revocation markers.
- `Supplier`: Approved commercial vendors with tax ID, contact email, and active status flag.
- `Product`: Standard industrial products with category, unit, unit price, and SKU code.
- `PurchaseRequest`: Core requisition entity tracking title, status, justification, required delivery date, requester, and calculated total amount.
- `PurchaseRequestItem`: Detailed line items specifying quantity, unit price, and subtotal.
- `Approval`: Managerial decisions (`APPROVED` or `REJECTED`) with comments and timestamps.
- `PurchaseOrder`: Legally binding purchase order issued to an active supplier from an approved requisition.
- `PurchaseOrderItem`: Order lines mirrored from approved requisition.
- `GoodsReceipt`: Dock receiving record with delivery note number and inspector user.
- `GoodsReceiptItem`: Quantity inspection tracking ordered, received, and damaged items.
- `Invoice`: Commercial vendor billing record linked to purchase order.
- `Payment`: Financial disbursement transaction with unique idempotency key, payment method, and audit notes.
- `AuditEvent`: Append-only audit trail logging entity name, entity ID, action, user, timestamp, and JSON metadata.

### Quality Lab Entities
- `TestCase`: Declared test suites with file paths, criticality tiers, and mapped source files.
- `TestRun`: Execution runs tracking mode (`FULL`, `EXPANDED`, `SELECTIVE`, `SHADOW`), environment profile (`standard`, `vulnerable`), duration, and pass/fail counts.
- `TestCaseResult`: Per-test execution outcomes (`PASSED`, `FAILED`, `BLOCKED`, `NOT_EXECUTED`).
- `TestScenario`: Stateful authorization scenarios (AUTH-001 through AUTH-015) with step JSON definitions.
- `TestScenarioResult`: Results evaluating Response Oracle and State Oracle.
- `Defect`: Automatically captured defect tickets linked to the discovering test run.
- `GitCommit`: Historical commits analyzed from Git.
- `ChangedFile`: Files changed per commit with additions and deletions count.
- `TestExecutionHistory`: Empirical dataset of historical test outcomes for ML training.
- `ModelTrainingRun`: Serialized training iterations with accuracy, precision, recall, F1, and ROC-AUC.
- `TestPrediction`: Test risk probability predictions generated per commit.
- `SelectionDecision`: Adaptive selection decisions (`SELECTED` vs `SKIPPED`) with transparent reasoning.
