import { prisma } from '../prisma';
import { AuthorizationPolicy, ActorContext } from '../policies/AuthorizationPolicy';
import { AuditService } from './AuditService';
import { InvoiceStatus, PRStatus, GRStatus } from '@procureflow/shared';

export interface CreateInvoiceInput {
  invoiceNumber: string;
  purchaseOrderId: string;
  supplierId: string;
  amount: number;
  dueDate: string | Date;
}

export class InvoiceService {
  static async list() {
    return prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: true,
        purchaseOrder: {
          include: {
            purchaseRequest: true,
            goodsReceipts: true,
          },
        },
        verifiedBy: { select: { id: true, name: true, email: true } },
        payments: true,
      },
    });
  }

  static async getById(id: string) {
    const inv = await prisma.invoice.findUnique({
      where: { id },
      include: {
        supplier: true,
        purchaseOrder: {
          include: {
            purchaseRequest: true,
            goodsReceipts: { include: { items: true } },
            items: true,
          },
        },
        verifiedBy: { select: { id: true, name: true, email: true } },
        payments: true,
      },
    });
    if (!inv) throw { status: 404, message: 'Invoice not found.' };
    return inv;
  }

  static async create(input: CreateInvoiceInput, actor: ActorContext) {
    if (!input.invoiceNumber || input.amount <= 0) {
      throw { status: 400, message: 'Valid invoice number and positive amount required.' };
    }

    const po = await prisma.purchaseOrder.findUnique({
      where: { id: input.purchaseOrderId },
    });
    if (!po) throw { status: 404, message: 'Associated Purchase Order not found.' };

    const existing = await prisma.invoice.findUnique({
      where: { invoiceNumber: input.invoiceNumber },
    });
    if (existing) throw { status: 400, message: `Invoice '${input.invoiceNumber}' already recorded.` };

    const inv = await prisma.invoice.create({
      data: {
        invoiceNumber: input.invoiceNumber.trim(),
        purchaseOrderId: input.purchaseOrderId,
        supplierId: input.supplierId,
        amount: input.amount,
        status: InvoiceStatus.PENDING,
        dueDate: new Date(input.dueDate),
      },
      include: { supplier: true, purchaseOrder: true },
    });

    await AuditService.log({
      entityName: 'Invoice',
      entityId: inv.id,
      action: 'INVOICE_RECORDED',
      userId: actor.id,
      details: { invoiceNumber: inv.invoiceNumber, amount: inv.amount },
    });

    return inv;
  }

  static async verify(id: string, notes: string | undefined, actor: ActorContext) {
    if (!AuthorizationPolicy.canVerifyInvoice(actor)) {
      throw { status: 403, message: 'Only Finance officers or Administrators can verify invoices.' };
    }

    const inv = await prisma.invoice.findUnique({
      where: { id },
      include: {
        purchaseOrder: {
          include: {
            purchaseRequest: true,
            goodsReceipts: true,
          },
        },
      },
    });

    if (!inv) throw { status: 404, message: 'Invoice not found.' };

    // 3-way matching validation: PO must have accepted goods receipt
    const hasAcceptedGR = inv.purchaseOrder.goodsReceipts.some(
      (gr) => gr.status === GRStatus.ACCEPTED
    );

    if (!hasAcceptedGR) {
      throw {
        status: 400,
        message: '3-Way Match Failed: Cannot verify invoice because no accepted Goods Receipt exists for this Purchase Order.',
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedInv = await tx.invoice.update({
        where: { id: inv.id },
        data: {
          status: InvoiceStatus.VERIFIED,
          verifiedById: actor.id,
          verifiedAt: new Date(),
        },
        include: { supplier: true, purchaseOrder: true },
      });

      await tx.purchaseRequest.update({
        where: { id: inv.purchaseOrder.purchaseRequestId },
        data: { status: PRStatus.INVOICE_VERIFIED },
      });

      return updatedInv;
    });

    await AuditService.log({
      entityName: 'Invoice',
      entityId: result.id,
      action: 'INVOICE_VERIFIED',
      userId: actor.id,
      details: { invoiceNumber: result.invoiceNumber, notes },
    });

    return result;
  }
}
