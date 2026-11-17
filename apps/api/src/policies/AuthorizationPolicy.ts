import { Role, PRStatus } from '@procureflow/shared';

export interface ActorContext {
  id: string;
  email: string;
  name: string;
  role: string;
  department?: string | null;
}

export class AuthorizationPolicy {
  /**
   * Rule 1: Employees can only view/manage their own PRs unless Manager, Procurement, Finance or Admin
   */
  static canAccessPurchaseRequest(actor: ActorContext, requestedById: string): boolean {
    if (actor.role === Role.ADMIN) return true;
    if (actor.role === Role.MANAGER || actor.role === Role.PROCUREMENT || actor.role === Role.FINANCE) return true;
    return actor.id === requestedById;
  }

  /**
   * Rule 2: Employees cannot approve their own requests; only Managers or Admins can approve
   */
  static canApprovePurchaseRequest(actor: ActorContext, requestedById: string): { allowed: boolean; reason?: string } {
    // Strict separation of duties: cannot approve self-generated request
    if (actor.id === requestedById) {
      return { allowed: false, reason: 'Separation of duties violation: Cannot approve your own purchase request.' };
    }
    if (actor.role !== Role.MANAGER && actor.role !== Role.ADMIN) {
      return { allowed: false, reason: 'Only Managers and Administrators have approval permissions.' };
    }
    return { allowed: true };
  }

  /**
   * Rule 3: Only employees or admins can edit draft purchase requests, and must own the request
   */
  static canModifyPurchaseRequest(actor: ActorContext, requestedById: string, currentStatus: string): { allowed: boolean; reason?: string } {
    if (currentStatus !== PRStatus.DRAFT) {
      return { allowed: false, reason: `Modification blocked: Requisitions in ${currentStatus} status are immutable.` };
    }
    if (actor.role === Role.ADMIN) return { allowed: true };
    if (actor.id !== requestedById) {
      return { allowed: false, reason: 'Resource ownership violation: Cannot modify another user’s purchase request.' };
    }
    return { allowed: true };
  }

  /**
   * Rule 4: Procurement or Admin can create Purchase Orders, only from APPROVED purchase requests
   */
  static canCreatePurchaseOrder(actor: ActorContext, prStatus: string): { allowed: boolean; reason?: string } {
    if (actor.role !== Role.PROCUREMENT && actor.role !== Role.ADMIN) {
      return { allowed: false, reason: 'Only Procurement officers or Administrators can create Purchase Orders.' };
    }
    if (prStatus !== PRStatus.APPROVED) {
      return { allowed: false, reason: `Invalid workflow state: Purchase Order can only be created from an APPROVED request (current: ${prStatus}).` };
    }
    return { allowed: true };
  }

  /**
   * Rule 5: Goods Receipt can only be recorded by Procurement or Admin
   */
  static canRecordGoodsReceipt(actor: ActorContext): boolean {
    return actor.role === Role.PROCUREMENT || actor.role === Role.ADMIN;
  }

  /**
   * Rule 6: Supplier management restricted to Procurement and Admin
   */
  static canManageSuppliers(actor: ActorContext): boolean {
    return actor.role === Role.PROCUREMENT || actor.role === Role.ADMIN;
  }

  /**
   * Rule 7: Invoice verification and Payment processing restricted to Finance and Admin
   */
  static canVerifyInvoice(actor: ActorContext): boolean {
    return actor.role === Role.FINANCE || actor.role === Role.ADMIN;
  }

  static canProcessPayment(
    actor: ActorContext,
    invoiceStatus: string,
    goodsReceiptStatus?: string
  ): { allowed: boolean; reason?: string } {
    if (actor.role !== Role.FINANCE && actor.role !== Role.ADMIN) {
      return { allowed: false, reason: 'Only Finance officers or Administrators can process payments.' };
    }
    if (invoiceStatus !== 'VERIFIED') {
      return { allowed: false, reason: `Payment rejected: Invoice must be VERIFIED prior to disbursement (current: ${invoiceStatus}).` };
    }
    if (goodsReceiptStatus && goodsReceiptStatus !== 'ACCEPTED') {
      return { allowed: false, reason: `Payment rejected: Associated Goods Receipt is ${goodsReceiptStatus}, not ACCEPTED.` };
    }
    return { allowed: true };
  }

  /**
   * Rule 8: Administrative access (Users, Audit log, QA Lab config)
   */
  static isAdmin(actor: ActorContext): boolean {
    return actor.role === Role.ADMIN;
  }
}
