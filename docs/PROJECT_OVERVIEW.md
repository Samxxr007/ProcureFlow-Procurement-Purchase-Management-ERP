# ProcureFlow — Project Overview

## 1. Executive Summary

**ProcureFlow** is an enterprise-grade Procurement & Purchase Management ERP system natively integrated with an intelligent software quality assurance (QA) platform. The application is developed as an academic capstone demonstration combining software engineering, distributed systems, role-based security, stateful authorization verification, and machine-learning-driven regression test selection.

The platform manages the complete organizational purchasing lifecycle:
```
Employee Purchase Requisition (DRAFT / SUBMITTED)
  → Manager Approval / Rejection (APPROVED / REJECTED)
    → Purchase Order Issuance to Approved Commercial Vendor (PURCHASE_ORDER_CREATED)
      → Warehouse Dock Goods Receipt & Damage Inspection (PARTIALLY_RECEIVED / RECEIVED)
        → 3-Way Match Invoice Verification (INVOICE_VERIFIED)
          → Bank Financial Disbursement with Idempotency Protection (PAID)
```

Directly within the application is the **Quality Lab** — a unified testing suite featuring:
1. **Stateful Authorization Testing**: Automated multi-role API test engine validating 4 operational dimensions: Role State, Session State, Resource Ownership, and Workflow Lifecycle.
2. **Predictive Regression Test Selection**: Machine learning engine analyzing Git code diffs and predicting test failure likelihoods using Random Forest and Logistic Regression.
3. **Confidence-Aware Adaptive Scope**: Evidence-driven execution controller dynamically routing testing between `FULL`, `EXPANDED`, and `SELECTIVE` modes.

---

## 2. Runtimes & Dependencies

The entire solution runs locally on Windows without external paid cloud APIs, Redis, or Kafka dependencies:

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, TanStack Query, Recharts, Lucide Icons.
- **Backend API**: Node.js, Express, TypeScript, Prisma ORM, SQLite (`dev.db`).
- **Machine Learning Service**: Python 3.13, FastAPI, scikit-learn (RandomForestClassifier, LogisticRegression), pandas, numpy, joblib.
- **Testing Runtimes**: Vitest, Supertest, @vitest/coverage-v8.
- **VCS & Diff Analysis**: Git, simple-git.
