import { describe, it, expect } from 'vitest';
import { WorkflowService } from '../../../apps/api/src/workflows/WorkflowService';
import { PRStatus } from '@procureflow/shared';

describe('WorkflowService State Machine Tests', () => {
  it('should validate legal transitions along the complete procure-to-pay lifecycle', () => {
    expect(WorkflowService.isValidTransition(PRStatus.DRAFT, PRStatus.SUBMITTED)).toBe(true);
    expect(WorkflowService.isValidTransition(PRStatus.SUBMITTED, PRStatus.APPROVED)).toBe(true);
    expect(WorkflowService.isValidTransition(PRStatus.APPROVED, PRStatus.PURCHASE_ORDER_CREATED)).toBe(true);
    expect(WorkflowService.isValidTransition(PRStatus.PURCHASE_ORDER_CREATED, PRStatus.RECEIVED)).toBe(true);
    expect(WorkflowService.isValidTransition(PRStatus.RECEIVED, PRStatus.INVOICE_VERIFIED)).toBe(true);
    expect(WorkflowService.isValidTransition(PRStatus.INVOICE_VERIFIED, PRStatus.PAID)).toBe(true);
  });

  it('should reject illegal status jumps', () => {
    // Cannot skip straight from DRAFT to APPROVED or PAID
    expect(WorkflowService.isValidTransition(PRStatus.DRAFT, PRStatus.APPROVED)).toBe(false);
    expect(WorkflowService.isValidTransition(PRStatus.DRAFT, PRStatus.PAID)).toBe(false);
    expect(WorkflowService.isValidTransition(PRStatus.SUBMITTED, PRStatus.PAID)).toBe(false);
    expect(WorkflowService.isValidTransition(PRStatus.APPROVED, PRStatus.PAID)).toBe(false);
  });

  it('should reject transitions from terminal state PAID', () => {
    expect(WorkflowService.isValidTransition(PRStatus.PAID, PRStatus.DRAFT)).toBe(false);
    expect(WorkflowService.isValidTransition(PRStatus.PAID, PRStatus.SUBMITTED)).toBe(false);
  });

  it('assertTransition should throw detailed error message on illegal transition', () => {
    expect(() => {
      WorkflowService.assertTransition(PRStatus.DRAFT, PRStatus.PAID);
    }).toThrow(/Invalid workflow transition from 'DRAFT' to 'PAID'/);
  });
});
