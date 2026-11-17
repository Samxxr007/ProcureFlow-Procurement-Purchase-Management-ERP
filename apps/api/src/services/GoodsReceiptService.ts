import { prisma } from '../prisma';
import { AuthorizationPolicy, ActorContext } from '../policies/AuthorizationPolicy';
import { AuditService } from './AuditService';
import { GRStatus, POStatus, PRStatus } from '@procureflow/shared';

export interface CreateGRItemInput {
  itemDescription: string;
  orderedQuantity: number;
  receivedQuantity: number;
  damagedQuantity?: number;
}

export interface CreateGRInput {
  purchaseOrderId: string;
  deliveryNoteNumber?: string;
  notes?: string;
  items: CreateGRItemInput[];
}

export class GoodsReceiptService {
  static async list() {
    return prisma.goodsReceipt.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        purchaseOrder: {
          include: { supplier: true, purchaseRequest: true },
        },
        receivedBy: {
          select: { id: true, name: true, email: true },
        },
        items: true,
      },
    });
  }

  static async getById(id: string) {
    const gr = await prisma.goodsReceipt.findUnique({
      where: { id },
      include: {
        purchaseOrder: {
          include: { supplier: true, purchaseRequest: true, items: true },
        },
        receivedBy: {
          select: { id: true, name: true, email: true },
        },
        items: true,
      },
    });
    if (!gr) throw { status: 404, message: 'Goods Receipt not found.' };
    return gr;
  }

  static async create(input: CreateGRInput, actor: ActorContext) {
    if (!AuthorizationPolicy.canRecordGoodsReceipt(actor)) {
      throw { status: 403, message: 'Only Procurement officers or Administrators can record Goods Receipts.' };
    }

    const po = await prisma.purchaseOrder.findUnique({
      where: { id: input.purchaseOrderId },
      include: { items: true, purchaseRequest: true },
    });

    if (!po) {
      throw { status: 404, message: 'Purchase Order not found.' };
    }

    if (po.status === POStatus.CANCELLED) {
      throw { status: 400, message: 'Cannot receive goods for a cancelled purchase order.' };
    }

    if (!input.items || input.items.length === 0) {
      throw { status: 400, message: 'Goods Receipt must contain at least one item inspection record.' };
    }

    let isPartial = false;
    for (const item of input.items) {
      if (item.receivedQuantity < 0) {
        throw { status: 400, message: 'Received quantity cannot be negative.' };
      }
      if (item.receivedQuantity < item.orderedQuantity) {
        isPartial = true;
      }
    }

    const count = await prisma.goodsReceipt.count();
    const grNumber = `GR-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    const grStatus = isPartial ? GRStatus.PARTIAL : GRStatus.ACCEPTED;

    const result = await prisma.$transaction(async (tx) => {
      const gr = await tx.goodsReceipt.create({
        data: {
          grNumber,
          purchaseOrderId: po.id,
          status: grStatus,
          deliveryNoteNumber: input.deliveryNoteNumber?.trim() || null,
          receivedById: actor.id,
          notes: input.notes?.trim() || null,
          items: {
            create: input.items.map((i) => ({
              itemDescription: i.itemDescription,
              orderedQuantity: i.orderedQuantity,
              receivedQuantity: i.receivedQuantity,
              damagedQuantity: i.damagedQuantity || 0,
            })),
          },
        },
        include: { items: true },
      });

      // Update PO and PR state
      const targetPOStatus = isPartial ? POStatus.PARTIALLY_RECEIVED : POStatus.FULFILLED;
      const targetPRStatus = isPartial ? PRStatus.PARTIALLY_RECEIVED : PRStatus.RECEIVED;

      await tx.purchaseOrder.update({
        where: { id: po.id },
        data: { status: targetPOStatus },
      });

      await tx.purchaseRequest.update({
        where: { id: po.purchaseRequestId },
        data: { status: targetPRStatus },
      });

      return gr;
    });

    await AuditService.log({
      entityName: 'GoodsReceipt',
      entityId: result.id,
      action: 'GOODS_RECEIVED',
      userId: actor.id,
      details: { grNumber: result.grNumber, poNumber: po.poNumber, status: grStatus },
    });

    return result;
  }
}
