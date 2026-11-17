import { prisma } from '../prisma';
import { AuthorizationPolicy, ActorContext } from '../policies/AuthorizationPolicy';
import { WorkflowService } from '../workflows/WorkflowService';
import { AuditService } from './AuditService';
import { PRStatus, Role } from '@procureflow/shared';

export interface CreatePRItemInput {
  productId?: string;
  itemDescription: string;
  quantity: number;
  unitPrice: number;
}

export interface CreatePRInput {
  title: string;
  justification: string;
  requiredDate: string | Date;
  items: CreatePRItemInput[];
}

export class PurchaseRequestService {
  static async list(actor: ActorContext, filters?: { status?: string; search?: string }) {
    const where: any = {};

    // Role-based visibility
    if (actor.role === Role.EMPLOYEE) {
      where.requestedById = actor.id;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { prNumber: { contains: filters.search } },
      ];
    }

    return prisma.purchaseRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        requestedBy: {
          select: { id: true, name: true, email: true, department: true, role: true },
        },
        items: true,
        approvals: {
          include: {
            approver: { select: { id: true, name: true, email: true } },
          },
        },
        purchaseOrder: {
          select: { id: true, poNumber: true, status: true, totalAmount: true },
        },
      },
    });
  }

  static async getById(id: string, actor: ActorContext) {
    const pr = await prisma.purchaseRequest.findUnique({
      where: { id },
      include: {
        requestedBy: {
          select: { id: true, name: true, email: true, department: true, role: true },
        },
        items: {
          include: { product: true },
        },
        approvals: {
          include: {
            approver: { select: { id: true, name: true, email: true } },
          },
        },
        purchaseOrder: {
          include: {
            supplier: true,
            goodsReceipts: { include: { items: true } },
            invoices: { include: { payments: true } },
          },
        },
      },
    });

    if (!pr) {
      throw { status: 404, message: 'Purchase request not found.' };
    }

    if (!AuthorizationPolicy.canAccessPurchaseRequest(actor, pr.requestedById)) {
      throw { status: 403, message: 'Access denied: You are not authorized to view this purchase request.' };
    }

    return pr;
  }

  static async create(input: CreatePRInput, actor: ActorContext) {
    if (!input.title || input.title.trim().length === 0) {
      throw { status: 400, message: 'Requisition title is required.' };
    }

    if (!input.justification || input.justification.trim().length === 0) {
      throw { status: 400, message: 'Business justification is required.' };
    }

    if (!input.items || input.items.length === 0) {
      throw { status: 400, message: 'At least one line item is required.' };
    }

    let calculatedTotal = 0;
    for (const item of input.items) {
      if (item.quantity <= 0) {
        throw { status: 400, message: `Invalid item quantity (${item.quantity}). Must be greater than 0.` };
      }
      if (item.unitPrice < 0) {
        throw { status: 400, message: `Invalid unit price (${item.unitPrice}). Cannot be negative.` };
      }
      calculatedTotal += item.quantity * item.unitPrice;
    }

    // Auto-generate PR number
    const count = await prisma.purchaseRequest.count();
    const prNumber = `PR-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const pr = await prisma.purchaseRequest.create({
      data: {
        prNumber,
        title: input.title.trim(),
        justification: input.justification.trim(),
        requiredDate: new Date(input.requiredDate),
        requestedById: actor.id,
        totalAmount: calculatedTotal,
        status: PRStatus.DRAFT,
        items: {
          create: input.items.map((i) => ({
            productId: i.productId || null,
            itemDescription: i.itemDescription.trim(),
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.quantity * i.unitPrice,
          })),
        },
      },
      include: {
        items: true,
        requestedBy: {
          select: { id: true, name: true, email: true, department: true },
        },
      },
    });

    await AuditService.log({
      entityName: 'PurchaseRequest',
      entityId: pr.id,
      action: 'PR_CREATED',
      userId: actor.id,
      details: { prNumber: pr.prNumber, totalAmount: pr.totalAmount },
    });

    return pr;
  }

  static async update(id: string, updates: Partial<CreatePRInput>, actor: ActorContext) {
    const existing = await prisma.purchaseRequest.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) {
      throw { status: 404, message: 'Purchase request not found.' };
    }

    const check = AuthorizationPolicy.canModifyPurchaseRequest(actor, existing.requestedById, existing.status);
    if (!check.allowed) {
      // Return 403 for ownership/role violations, 400 for immutable status violations
      const statusCode = existing.status !== PRStatus.DRAFT ? 400 : 403;
      throw { status: statusCode, message: check.reason };
    }

    const data: any = {};
    if (updates.title) data.title = updates.title.trim();
    if (updates.justification) data.justification = updates.justification.trim();
    if (updates.requiredDate) data.requiredDate = new Date(updates.requiredDate);

    if (updates.items && updates.items.length > 0) {
      let calculatedTotal = 0;
      for (const item of updates.items) {
        if (item.quantity <= 0 || item.unitPrice < 0) {
          throw { status: 400, message: 'Invalid item quantity or price.' };
        }
        calculatedTotal += item.quantity * item.unitPrice;
      }
      data.totalAmount = calculatedTotal;

      // Replace items
      await prisma.purchaseRequestItem.deleteMany({
        where: { purchaseRequestId: id },
      });

      data.items = {
        create: updates.items.map((i) => ({
          productId: i.productId || null,
          itemDescription: i.itemDescription.trim(),
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.quantity * i.unitPrice,
        })),
      };
    }

    const updated = await prisma.purchaseRequest.update({
      where: { id },
      data,
      include: { items: true },
    });

    await AuditService.log({
      entityName: 'PurchaseRequest',
      entityId: updated.id,
      action: 'PR_UPDATED',
      userId: actor.id,
      details: { title: updated.title, totalAmount: updated.totalAmount },
    });

    return updated;
  }

  static async submit(id: string, actor: ActorContext) {
    const pr = await prisma.purchaseRequest.findUnique({ where: { id } });
    if (!pr) {
      throw { status: 404, message: 'Purchase request not found.' };
    }

    if (actor.role === Role.EMPLOYEE && pr.requestedById !== actor.id) {
      throw { status: 403, message: 'Resource ownership violation: Cannot submit another user’s draft request.' };
    }

    WorkflowService.assertTransition(pr.status, PRStatus.SUBMITTED);

    const updated = await prisma.purchaseRequest.update({
      where: { id },
      data: { status: PRStatus.SUBMITTED },
      include: { items: true },
    });

    await AuditService.log({
      entityName: 'PurchaseRequest',
      entityId: updated.id,
      action: 'PR_SUBMITTED',
      userId: actor.id,
      details: { prNumber: updated.prNumber, status: PRStatus.SUBMITTED },
    });

    return updated;
  }

  static async transition(id: string, targetStatus: string, actor: ActorContext) {
    const pr = await prisma.purchaseRequest.findUnique({ where: { id } });
    if (!pr) {
      throw { status: 404, message: 'Purchase request not found.' };
    }

    try {
      WorkflowService.assertTransition(pr.status, targetStatus);
    } catch (err: any) {
      throw { status: 400, message: err.message };
    }

    const updated = await prisma.purchaseRequest.update({
      where: { id },
      data: { status: targetStatus },
    });

    await AuditService.log({
      entityName: 'PurchaseRequest',
      entityId: updated.id,
      action: `PR_STATE_CHANGED_${targetStatus}`,
      userId: actor.id,
      details: { from: pr.status, to: targetStatus },
    });

    return updated;
  }
}
