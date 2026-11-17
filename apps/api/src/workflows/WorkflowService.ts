import { PRStatus } from '@procureflow/shared';

export class WorkflowService {
  private static readonly VALID_TRANSITIONS: Record<string, string[]> = {
    [PRStatus.DRAFT]: [PRStatus.SUBMITTED, PRStatus.CANCELLED],
    [PRStatus.SUBMITTED]: [PRStatus.APPROVED, PRStatus.REJECTED, PRStatus.CANCELLED],
    [PRStatus.APPROVED]: [PRStatus.PURCHASE_ORDER_CREATED, PRStatus.CANCELLED],
    [PRStatus.PURCHASE_ORDER_CREATED]: [PRStatus.PARTIALLY_RECEIVED, PRStatus.RECEIVED],
    [PRStatus.PARTIALLY_RECEIVED]: [PRStatus.RECEIVED],
    [PRStatus.RECEIVED]: [PRStatus.INVOICE_VERIFIED],
    [PRStatus.INVOICE_VERIFIED]: [PRStatus.PAID],
    [PRStatus.PAID]: [],
    [PRStatus.REJECTED]: [],
    [PRStatus.CANCELLED]: [],
  };

  /**
   * Validates if a transition from currentStatus to targetStatus is allowed.
   */
  static isValidTransition(currentStatus: string, targetStatus: string): boolean {
    const allowed = this.VALID_TRANSITIONS[currentStatus];
    if (!allowed) return false;
    return allowed.includes(targetStatus);
  }

  /**
   * Asserts transition validity, throwing detailed error if invalid.
   */
  static assertTransition(currentStatus: string, targetStatus: string): void {
    if (!this.isValidTransition(currentStatus, targetStatus)) {
      throw new Error(
        `Invalid workflow transition from '${currentStatus}' to '${targetStatus}'. Permitted targets: [${(this.VALID_TRANSITIONS[currentStatus] || []).join(', ')}]`
      );
    }
  }

  /**
   * Returns list of permitted next states for UI buttons
   */
  static getPermittedNextStates(currentStatus: string): string[] {
    return this.VALID_TRANSITIONS[currentStatus] || [];
  }
}
