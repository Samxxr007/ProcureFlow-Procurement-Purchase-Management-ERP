import { prisma } from '../prisma';
import { AuthorizationPolicy, ActorContext } from '../policies/AuthorizationPolicy';
import { WorkflowService } from '../workflows/WorkflowService';
import { AuditService } from './AuditService';
import { PRStatus } from '@procureflow/shared';

export interface ApprovalDecisionInput {
  decision: 'APPROVED' | 'REJECTED';
  comments?: string;
}

export class ApprovalService {
  static async listPending(actor: ActorContext) {
    return prisma.purchaseRequest.findMany({
      where: {
        status: PRStatus.SUBMITTED,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        requestedBy: {
          select: { id: true, name: true, email: true, department: true },
        },
        items: true,
      },
    });
  }

  static async processDecision(
    purchaseRequestId: string,
    input: ApprovalDecisionInput,
    actor: ActorContext
  ) {
    const pr = await prisma.purchaseRequest.findUnique({
      where: { id: purchaseRequestId },
    });

    if (!pr) {
      throw { status: 404, message: 'Purchase request not found.' };
    }

    // Enforce separation of duties & role checks
    const check = AuthorizationPolicy.canApprovePurchaseRequest(actor, pr.requestedById);
    if (!check.allowed) {
      throw { status: 403, message: check.reason };
    }

    const targetStatus = input.decision === 'APPROVED' ? PRStatus.APPROVED : PRStatus.REJECTED;
    try {
      WorkflowService.assertTransition(pr.status, targetStatus);
    } catch (err: any) {
      throw { status: 400, message: err.message };
    }

    // Execute in transaction
    const result = await prisma.$transaction(async (tx) => {
      const approval = await tx.approval.create({
        data: {
          purchaseRequestId: pr.id,
          approverId: actor.id,
          decision: input.decision,
          comments: input.comments || null,
        },
        include: {
          approver: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      const updatedPR = await tx.purchaseRequest.update({
        where: { id: pr.id },
        data: { status: targetStatus },
        include: { items: true },
      });

      return { approval, purchaseRequest: updatedPR };
    });

    await AuditService.log({
      entityName: 'Approval',
      entityId: result.approval.id,
      action: `PR_${input.decision}`,
      userId: actor.id,
      details: {
        purchaseRequestId: pr.id,
        prNumber: pr.prNumber,
        decision: input.decision,
        comments: input.comments,
      },
    });

    return result;
  }
}
