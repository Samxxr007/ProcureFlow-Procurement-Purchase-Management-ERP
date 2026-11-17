# ProcureFlow — Capstone Viva Demonstration Guide

Follow this 5-minute walkthrough to demonstrate the full application during project viva:

---

## Step 1: Launch Services
In PowerShell:
```powershell
# 1. Start Python ML Service (Port 8000)
$env:PYTHONPATH="apps/ml-service"; python apps/ml-service/run.py

# 2. In a second terminal, start Backend API (Port 3001)
npm run dev -w apps/api

# 3. In a third terminal, start Frontend Vite Console (Port 5173)
npm run dev -w apps/web
```
Open your browser to: `http://localhost:5173`

---

## Step 2: Demonstrate Role-Based Business Workflow
1. **Employee Persona (Alice)**:
   - Click the "Alice (Emp)" shortcut button on the login screen.
   - Navigate to **Requisitions** -> Click **Create Requisition**.
   - Select "Dell Precision Workstation" or add custom items, enter a justification, and click **Submit for Manager Approval**.
   - Show that Alice cannot approve the requisition herself.

2. **Manager Persona (Bob)**:
   - Use the **Role Switcher** in the top navigation bar to switch to "Bob Roberts (MANAGER)".
   - Go to **Approval Queue**.
   - Show the newly submitted requisition. Click **Approve**, enter review comments, and confirm.
   - Requisition status is now `APPROVED`.

3. **Procurement Persona (Carol)**:
   - Switch active persona to "Carol Danvers (PROCUREMENT)".
   - Go to **Purchase Orders** -> Click **Issue Purchase Order**.
   - Select the approved requisition, pick a vendor (e.g. Apex Industrial), and click **Issue Purchase Order**.
   - Requisition status advances to `PURCHASE_ORDER_CREATED`.
   - Go to **Goods Receipts** -> Record a delivery receipt for the PO.
   - Requisition status advances to `RECEIVED`.

4. **Finance Persona (Dave)**:
   - Switch active persona to "Dave Johnson (FINANCE)".
   - Go to **Invoices** -> Show the 3-way match indicator ("PO & GR Matched"). Click **Verify**.
   - Go to **Payments** -> Click **Process Disbursement**.
   - Click "Disburse Payment" with the generated idempotency key.
   - Show invoice and requisition state advanced to `PAID`.

---

## Step 3: Demonstrate Quality Lab & Authorization Testing
1. Click **Quality Lab** -> **Authorization Lab** in the sidebar.
2. Select **Standard (Secure)** profile -> Click **Run All 15 Scenarios**.
   - Show the live execution: all 15 scenarios pass (HTTP 403/400/409/200/201) and State Oracles verify database integrity.
3. Switch profile to **Vulnerable (Fault Injection)** -> Run **AUTH-001** (Self-Approval).
   - Observe the security failure.
   - Navigate to **Defect Tracker** to show that a structured Defect record was automatically captured and linked to the test run!

---

## Step 4: Demonstrate Predictive Regression Selection & ML
1. Click **Regression ML** in the sidebar.
2. Show the live Git diff analysis with changed files, additions, and deletions.
3. Show the **Model Readiness Score** breakdown (observed commits, observations, failures).
4. Review the **Test Case Risk Predictions** table sorted by failure probability.
5. Demonstrate retraining by selecting **Random Forest** and clicking **Retrain ML Model**.
