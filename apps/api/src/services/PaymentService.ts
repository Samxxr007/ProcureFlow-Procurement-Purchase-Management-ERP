import { prisma } from '../prisma';
import { AuthorizationPolicy, ActorContext } from '../policies/AuthorizationPolicy';
import { AuditService } from './AuditService';
import { PaymentStatus, InvoiceStatus, PRStatus, GRStatus } from '@procureflow/shared';

export interface ProcessPaymentInput {
  invoiceId: string;
  paymentMethod: string;
  idempotencyKey: string;
  referenceNotes?: string;
}

export class PaymentService {
  static async list() {
    return prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        invoice: {
          include: {
            supplier: true,
            purchaseOrder: { include: { purchaseRequest: true } },
          },
        },
        paidBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  static async getById(id: string) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            supplier: true,
            purchaseOrder: { include: { purchaseRequest: true } },
          },
        },
        paidBy: { select: { id: true, name: true, email: true } },
      },
    });
    if (!payment) throw { status: 404, message: 'Payment record not found.' };
    return payment;
  }

  static async processPayment(input: ProcessPaymentInput, actor: ActorContext) {
    if (!input.idempotencyKey || input.idempotencyKey.trim().length === 0) {
      throw { status: 400, message: 'Idempotency key is required to prevent duplicate payment executions.' };
    }

    // Check duplicate idempotency key
    const existingPaymentByKey = await prisma.payment.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existingPaymentByKey) {
      throw {
        status: 409,
        message: `Idempotency Conflict: Payment with key '${input.idempotencyKey}' has already been processed.`,
      };
    }

    const inv = await prisma.invoice.findUnique({
      where: { id: input.invoiceId },
      include: {
        purchaseOrder: {
          include: {
            goodsReceipts: true,
            purchaseRequest: true,
          },
        },
      },
    });

    if (!inv) {
      throw { status: 404, message: 'Invoice not found.' };
    }

    if (inv.status === InvoiceStatus.PAID) {
      throw { status: 409, message: 'Invoice has already been marked as PAID.' };
    }

    const latestGR = inv.purchaseOrder.goodsReceipts[0];
    const grStatus = latestGR?.status;

    // Enforce authorization policy check
    const check = AuthorizationPolicy.canProcessPayment(actor, inv.status, grStatus);
    if (!check.allowed) {
      const code = actor.role !== 'FINANCE' && actor.role !== 'ADMIN' ? 403 : 400;
      throw { status: code, message: check.reason };
    }

    const count = await prisma.payment.count();
    const paymentNumber = `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    // Execute disbursement in database transaction
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          invoiceId: inv.id,
          amount: inv.amount,
          status: PaymentStatus.COMPLETED,
          idempotencyKey: input.idempotencyKey.trim(),
          paidById: actor.id,
          paymentMethod: input.paymentMethod || 'WIRE_TRANSFER',
          referenceNotes: input.referenceNotes || null,
        },
        include: { invoice: { include: { supplier: true } } },
      });

      await tx.invoice.update({
        where: { id: inv.id },
        data: { status: InvoiceStatus.PAID },
      });

      await tx.purchaseRequest.update({
        where: { id: inv.purchaseOrder.purchaseRequestId },
        data: { status: PRStatus.PAID },
      });

      return payment;
    });

    await AuditService.log({
      entityName: 'Payment',
      entityId: result.id,
      action: 'PAYMENT_PROCESSED',
      userId: actor.id,
      details: {
        paymentNumber: result.paymentNumber,
        invoiceNumber: inv.invoiceNumber,
        amount: result.amount,
        idempotencyKey: input.idempotencyKey,
      },
    });

    return result;
  }
}
