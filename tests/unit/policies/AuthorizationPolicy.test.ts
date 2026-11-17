import { describe, it, expect } from 'vitest';
import { AuthorizationPolicy } from '../../../apps/api/src/policies/AuthorizationPolicy';
import { Role, PRStatus } from '@procureflow/shared';

describe('AuthorizationPolicy Unit Tests', () => {
  const employeeAlice = { id: 'usr-emp-1', email: 'alice@procureflow.com', name: 'Alice', role: Role.EMPLOYEE };
  const employeeBob = { id: 'usr-emp-2', email: 'bob@procureflow.com', name: 'Bob', role: Role.EMPLOYEE };
  const managerBob = { id: 'usr-mgr-1', email: 'bob_mgr@procureflow.com', name: 'Bob Mgr', role: Role.MANAGER };
  const procurementCarol = { id: 'usr-proc-1', email: 'carol@procureflow.com', name: 'Carol', role: Role.PROCUREMENT };
  const financeDave = { id: 'usr-fin-1', email: 'dave@procureflow.com', name: 'Dave', role: Role.FINANCE };
  const adminUser = { id: 'usr-admin-1', email: 'admin@procureflow.com', name: 'Admin', role: Role.ADMIN };

  describe('Rule 1 & 2: Separation of duties and Self-approval prevention', () => {
    it('should REJECT an employee attempting to approve their own purchase request', () => {
      const decision = AuthorizationPolicy.canApprovePurchaseRequest(employeeAlice, employeeAlice.id);
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('Separation of duties');
    });

    it('should REJECT an employee attempting to approve another employee purchase request', () => {
      const decision = AuthorizationPolicy.canApprovePurchaseRequest(employeeAlice, employeeBob.id);
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('Only Managers and Administrators');
    });

    it('should ALLOW a manager to approve an employee purchase request', () => {
      const decision = AuthorizationPolicy.canApprovePurchaseRequest(managerBob, employeeAlice.id);
      expect(decision.allowed).toBe(true);
    });

    it('should REJECT a manager attempting to approve their own purchase request', () => {
      const decision = AuthorizationPolicy.canApprovePurchaseRequest(managerBob, managerBob.id);
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('Separation of duties');
    });
  });

  describe('Rule 3: Resource Ownership and Draft Modification', () => {
    it('should ALLOW owner employee to modify DRAFT purchase request', () => {
      const decision = AuthorizationPolicy.canModifyPurchaseRequest(employeeAlice, employeeAlice.id, PRStatus.DRAFT);
      expect(decision.allowed).toBe(true);
    });

    it('should REJECT non-owner employee modifying another user DRAFT request', () => {
      const decision = AuthorizationPolicy.canModifyPurchaseRequest(employeeBob, employeeAlice.id, PRStatus.DRAFT);
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('Resource ownership violation');
    });

    it('should REJECT modifying an APPROVED purchase request', () => {
      const decision = AuthorizationPolicy.canModifyPurchaseRequest(employeeAlice, employeeAlice.id, PRStatus.APPROVED);
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('immutable');
    });
  });

  describe('Rule 4: Purchase Order Creation Constraints', () => {
    it('should REJECT procurement creating PO from unapproved DRAFT request', () => {
      const decision = AuthorizationPolicy.canCreatePurchaseOrder(procurementCarol, PRStatus.DRAFT);
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('Invalid workflow state');
    });

    it('should ALLOW procurement creating PO from APPROVED request', () => {
      const decision = AuthorizationPolicy.canCreatePurchaseOrder(procurementCarol, PRStatus.APPROVED);
      expect(decision.allowed).toBe(true);
    });

    it('should REJECT employee creating PO even if approved', () => {
      const decision = AuthorizationPolicy.canCreatePurchaseOrder(employeeAlice, PRStatus.APPROVED);
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('Only Procurement officers');
    });
  });

  describe('Rule 5 & 7: 3-Way Match Payment Verification', () => {
    it('should REJECT payment for an unverified invoice', () => {
      const decision = AuthorizationPolicy.canProcessPayment(financeDave, 'PENDING', 'ACCEPTED');
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('must be VERIFIED');
    });

    it('should REJECT payment if goods receipt is not ACCEPTED', () => {
      const decision = AuthorizationPolicy.canProcessPayment(financeDave, 'VERIFIED', 'PARTIAL');
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('Goods Receipt');
    });

    it('should ALLOW finance to pay verified invoice with accepted goods receipt', () => {
      const decision = AuthorizationPolicy.canProcessPayment(financeDave, 'VERIFIED', 'ACCEPTED');
      expect(decision.allowed).toBe(true);
    });

    it('should REJECT non-finance user attempting payment', () => {
      const decision = AuthorizationPolicy.canProcessPayment(employeeAlice, 'VERIFIED', 'ACCEPTED');
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('Only Finance officers');
    });
  });
});
