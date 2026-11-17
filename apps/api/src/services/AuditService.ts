import { prisma } from '../prisma';

export class AuditService {
  static async log(params: {
    entityName: string;
    entityId: string;
    action: string;
    userId?: string | null;
    details?: any;
    ipAddress?: string | null;
  }) {
    try {
      return await prisma.auditEvent.create({
        data: {
          entityName: params.entityName,
          entityId: params.entityId,
          action: params.action,
          userId: params.userId || null,
          details: params.details ? JSON.stringify(params.details) : null,
          ipAddress: params.ipAddress || null,
        },
      });
    } catch (err) {
      console.error('[AUDIT_ERROR] Failed to record audit event:', err);
    }
  }

  static async listEvents(limit = 100, offset = 0) {
    return prisma.auditEvent.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }
}
