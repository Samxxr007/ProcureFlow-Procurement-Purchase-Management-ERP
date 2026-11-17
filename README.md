# ProcureFlow — Procurement ERP & Intelligent Software Quality Assurance Platform

[![Test Suite](https://img.shields.io/badge/Vitest-34%20Passing-397754?style=flat-square)](.)
[![Node](https://img.shields.io/badge/Node-v24.5-252D28?style=flat-square)](.)
[![Python](https://img.shields.io/badge/Python-3.13-426B53?style=flat-square)](.)
[![Architecture](https://img.shields.io/badge/Design%20System-Quiet%20Industrial%20Console-202A24?style=flat-square)](.)

**ProcureFlow** is an enterprise-grade procurement and purchase management ERP system integrated with an intelligent software quality assurance (QA) platform. The application manages the complete purchasing lifecycle of an organization — starting from employee purchase requisitions and ending with invoice verification and bank disbursement — while serving as the live System Under Test (SUT) for automated stateful authorization testing, predictive regression test selection, and confidence-aware adaptive test execution.

---

## Key Capabilities

1. **Enterprise Procurement Operations**:
   - Requisition lifecycle management (`DRAFT` → `SUBMITTED` → `APPROVED` → `PURCHASE_ORDER_CREATED` → `PARTIALLY_RECEIVED` / `RECEIVED` → `INVOICE_VERIFIED` → `PAID`).
   - Strict separation of duties: employees cannot approve their own requests; managers cannot approve self-generated requisitions.
   - Dock goods receipt with partial delivery and damage reporting.
   - 3-Way matching verification between Purchase Orders, Goods Receipts, and Commercial Invoices.
   - Financial disbursements with duplicate payment prevention using idempotency keys.
   - Append-only cryptographic system audit trail.

2. **Stateful Authorization Testing**:
   - Multi-role API test engine validating 4 operational dimensions: Role State, Session State, Resource Ownership, and Workflow Lifecycle.
   - Dual Oracle verification: Response Oracle (HTTP codes & payloads) + State Oracle (direct database record validation).
   - Fault injection: Toggleable `standard` vs `vulnerable` profiles to demonstrate reproducible failure capture and automated defect ticket creation.

3. **Predictive Regression Test Selection**:
   - Git diff analysis extracting modified files, additions, and deletions.
   - Machine learning classifiers (Random Forest & Logistic Regression) trained on historical execution observations using chronological splitting.
   - Ranking candidate tests in descending order of failure likelihood.

4. **Confidence-Aware Adaptive Scope**:
   - Transparent Evidence Readiness Score derived from observed commits, observations, and failure examples.
   - Dynamic execution mode routing: `FULL`, `EXPANDED`, `SELECTIVE`, and `SHADOW` modes.

---

## Visual Design System

Designed under the **Quiet Industrial Operations Console** design language:
- **Palette**: `#F3F5F1` (Background), `#FFFFFF` (Surface), `#252D28` (Primary text), `#727D75` (Secondary text), `#426B53` (Primary accent), `#202A24` (Dark forest sidebar).
- **Status Colors**: Pending (`#B78337`), Success (`#397754`), Error (`#B64C43`), Information (`#506E86`).
- **Typography**: IBM Plex Sans (interface) & IBM Plex Mono (IDs, hashes, paths, amounts).

---

## Demo Credentials

| Role | Name | Email | Password |
|---|---|---|---|
| **ADMIN** | System Administrator | `admin@procureflow.com` | `Admin@123` |
| **EMPLOYEE** | Alice Walker | `alice@procureflow.com` | `Employee@123` |
| **MANAGER** | Bob Roberts | `bob@procureflow.com` | `Manager@123` |
| **PROCUREMENT** | Carol Danvers | `carol@procureflow.com` | `Procure@123` |
| **FINANCE** | Dave Johnson | `dave@procureflow.com` | `Finance@123` |

*Note: The login screen includes 1-click persona buttons, and the top navigation bar features a live Role Switcher dropdown for viva presentations.*

---

## Quick Start & Installation

### 1. Prerequisites
- Node.js (v20+ or v24+)
- Python (3.11+)
- Git

### 2. Install Dependencies
```powershell
# From the project root
npm install
```

### 3. Initialize & Seed Database
```powershell
# Push Prisma schema to SQLite dev.db
npm run prisma:push

# Seed realistic demonstration records & test catalog
npm run prisma:seed
```

### 4. Launch Services

Run the services in 3 separate terminal tabs:

**Terminal 1 — Machine Learning Service (Port 8000)**:
```powershell
$env:PYTHONPATH="apps/ml-service"; python apps/ml-service/run.py
```

**Terminal 2 — Backend API Server (Port 3001)**:
```powershell
npm run dev -w apps/api
```

**Terminal 3 — Frontend Console (Port 5173)**:
```powershell
npm run dev -w apps/web
```

Open your browser to: **`http://localhost:5173`**

---

## Running Automated Tests

```powershell
# Run all 34 automated unit, integration, and authorization tests
npm test

# Run unit tests only
npm run test:unit

# Run API integration tests only
npm run test:integration

# Run 15 stateful multi-role authorization scenarios
npm run test:auth
```

All 34 tests execute and pass out-of-the-box.

---

## Project Structure

```
procureflow/
│
├── apps/
│   ├── web/                     # React 18 + Vite + Tailwind Console
│   │   ├── src/
│   │   │   ├── components/      # Sidebar, TopBar, StatusBadge, PageHeader
│   │   │   ├── context/         # AuthContext
│   │   │   ├── pages/
│   │   │   │   ├── auth/        # Login
│   │   │   │   ├── erp/         # Requisitions, Approvals, POs, Receipts, Invoices, Pay, Audit, Users
│   │   │   │   └── qa/          # QAOverview, AuthorizationLab, RegressionML, History, Defects, Reports
│   │   │   └── services/        # Axios API client
│   │
│   ├── api/                     # Express + TypeScript Backend
│   │   ├── src/
│   │   │   ├── controllers/     # Auth, Requisitions, Approvals, POs, Receipts, Invoices, Payments, QA
│   │   │   ├── middleware/      # Bearer Auth, Session Revocation, Logger, Error Handler
│   │   │   ├── policies/        # Centralized AuthorizationPolicy
│   │   │   ├── workflows/       # Finite State Machine WorkflowService
│   │   │   ├── services/        # Business logic & data access
│   │   │   └── testing/         # ScenarioRunner, ResponseOracle, StateOracle, VulnerabilityProfiles
│   │
│   └── ml-service/              # Python FastAPI Machine Learning Microservice
│       ├── app/
│       │   ├── models/          # RandomForest & LogisticRegression Trainers & Predictors
│       │   ├── routers/         # /predict, /train, /status
│       │   ├── schemas/         # Pydantic data models
│       │   └── utils/           # Feature engineering & chronological splits
│       ├── stored_models/       # Serialized joblib model bundles
│       └── run.py               # Uvicorn entrypoint
│
├── packages/
│   ├── shared/                  # Common TypeScript interfaces & enums
│   └── test-catalog/            # Declared test cases & AUTH-001 - AUTH-015 scenario definitions
│
├── prisma/
│   ├── schema.prisma            # SQLite database schema
│   └── seed.ts                  # Demonstration database seeder
│
├── tests/
│   ├── unit/                    # AuthorizationPolicy and WorkflowService tests
│   ├── integration/             # Auth, PR, Approvals, Payments integration tests
│   └── authorization/           # Stateful Authorization Scenarios Runner
│
├── docs/                        # Complete 14-part academic capstone documentation
├── README.md
└── package.json
```

---

## Documentation Index

Comprehensive documentation is located in the `docs/` folder:
1. [`PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md)
2. [`SYSTEM_ARCHITECTURE.md`](docs/SYSTEM_ARCHITECTURE.md)
3. [`DATABASE_DESIGN.md`](docs/DATABASE_DESIGN.md)
4. [`API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md)
5. [`ROLE_PERMISSION_MATRIX.md`](docs/ROLE_PERMISSION_MATRIX.md)
6. [`WORKFLOW_STATE_DIAGRAM.md`](docs/WORKFLOW_STATE_DIAGRAM.md)
7. [`TEST_PLAN.md`](docs/TEST_PLAN.md)
8. [`TEST_SCENARIOS.md`](docs/TEST_SCENARIOS.md)
9. [`AUTHORIZATION_TESTING.md`](docs/AUTHORIZATION_TESTING.md)
10. [`REGRESSION_SELECTION_METHOD.md`](docs/REGRESSION_SELECTION_METHOD.md)
11. [`ML_TRAINING_AND_EVALUATION.md`](docs/ML_TRAINING_AND_EVALUATION.md)
12. [`QUALITY_METRICS.md`](docs/QUALITY_METRICS.md)
13. [`DEMO_GUIDE.md`](docs/DEMO_GUIDE.md)
14. [`KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md)

---

## License

This project is created for academic capstone demonstration purposes.
