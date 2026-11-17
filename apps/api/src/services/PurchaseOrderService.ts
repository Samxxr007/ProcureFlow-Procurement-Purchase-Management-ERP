import { prisma } from '../prisma';
import { AuthorizationPolicy, ActorContext } from '../policies/AuthorizationPolicy';
import { WorkflowService } from '../workflows/WorkflowService';
import { AuditService } from './AuditService';
import { PRStatus, POStatus } from '@procureflow/shared';

export interface CreatePOItemInput {
  itemDescription: string;
  quantity: number;
  unitPrice: number;
}

export interface CreatePOInput {
  purchaseRequestId: string;
  supplierId: string;
  items?: CreatePOItemInput[];
}

export class PurchaseOrderService {
  static async list() {
    return prisma.purchaseOrder.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: true,
        purchaseRequest: {
          select: { id: true, prNumber: true, title: true, requestedBy: { select: { name: true } } },
        },
        goodsReceipts: true,
        invoices: true,
        items: true,
      },
    });
  }

  static async getById(id: string) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        purchaseRequest: {
          include: { requestedBy: true, approvals: { include: { approver: true } } },
        },
        goodsReceipts: { include: { items: true, receivedBy: true } },
        invoices: { include: { payments: true } },
        items: true,
      },
    });
    if (!po) throw { status: 404, message: 'Purchase Order not found.' };
    return po;
  }

  static async create(input: CreatePOInput, actor: ActorContext) {
    const pr = await prisma.purchaseRequest.findUnique({
      where: { id: input.purchaseRequestId },
      include: { items: true },
    });

    if (!pr) {
      throw { status: 404, message: 'Associated Purchase Request not found.' };
    }

    // Enforce authorization & workflow state
    const check = AuthorizationPolicy.canCreatePurchaseOrder(actor, pr.status);
    if (!check.allowed) {
      const status = actor.role !== 'PROCUREMENT' && actor.role !== 'ADMIN' ? 403 : 400;
      throw { status, message: check.reason };
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: input.supplierId },
    });
    if (!supplier || !supplier.isActive) {
      throw { status: 400, message: 'Invalid or inactive supplier selected.' };
    }

    // Determine items: either custom or carried from PR
    const poItems = input.items && input.items.length > 0
      ? input.items
      : pr.items.map((i) => ({
          itemDescription: i.itemDescription,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        }));

    let totalAmount = 0;
    for (const item of poItems) {
      if (item.quantity <= 0 || item.unitPrice < 0) {
        throw { status: 400, message: 'Invalid PO item quantities or prices.' };
      }
      totalAmount += item.quantity * item.unitPrice;
    }

    const count = await prisma.purchaseOrder.count();
    const poNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    // Execute in transaction
    const result = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          poNumber,
          purchaseRequestId: pr.id,
          supplierId: supplier.id,
          status: POStatus.ISSUED,
          totalAmount,
          items: {
            create: poItems.map((i) => ({
              itemDescription: i.itemDescription,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              totalPrice: i.quantity * i.unitPrice,
            })),
          },
        },
        include: { items: true, supplier: true },
      });

      // Advance PR workflow state to PURCHASE_ORDER_CREATED
      await tx.purchaseRequest.update({
        where: { id: pr.id },
        data: { status: PRStatus.PURCHASE_ORDER_CREATED },
      });

      return po;
    });

    await AuditService.log({
      entityName: 'PurchaseOrder',
      entityId: result.id,
      action: 'PO_ISSUED',
      userId: actor.id,
      details: { poNumber: result.poNumber, totalAmount: result.totalAmount, prNumber: pr.prNumber },
    });

    return result;
  }
}
