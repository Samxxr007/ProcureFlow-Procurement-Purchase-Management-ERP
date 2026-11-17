import { prisma } from '../prisma';
import { PRStatus, POStatus, InvoiceStatus } from '@procureflow/shared';

export class DashboardService {
  static async getOperationalOverview() {
    const [
      totalPRs,
      pendingApprovals,
      activePOs,
      goodsAwaitingReceipt,
      outstandingInvoices,
      allPayments,
      allPRs,
      recentPRs,
      recentAuditEvents,
    ] = await Promise.all([
      prisma.purchaseRequest.count(),
      prisma.purchaseRequest.count({ where: { status: PRStatus.SUBMITTED } }),
      prisma.purchaseOrder.count({ where: { status: { in: [POStatus.ISSUED, POStatus.PARTIALLY_RECEIVED] } } }),
      prisma.purchaseOrder.count({ where: { status: POStatus.ISSUED } }),
      prisma.invoice.count({ where: { status: { in: [InvoiceStatus.PENDING, InvoiceStatus.VERIFIED] } } }),
      prisma.payment.findMany({
        where: { status: 'COMPLETED' },
        select: { amount: true, paidAt: true },
      }),
      prisma.purchaseRequest.findMany({
        select: { status: true, totalAmount: true, createdAt: true },
      }),
      prisma.purchaseRequest.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          requestedBy: { select: { name: true, department: true } },
        },
      }),
      prisma.auditEvent.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, role: true } },
        },
      }),
    ]);

    const totalExpenditure = allPayments.reduce((sum, p) => sum + p.amount, 0);

    // Group PRs by status
    const statusDistribution: Record<string, number> = {};
    for (const pr of allPRs) {
      statusDistribution[pr.status] = (statusDistribution[pr.status] || 0) + 1;
    }

    // Monthly expenditure aggregation (last 6 months)
    const monthlyExpenditureMap: Record<string, number> = {};
    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (const m of months) monthlyExpenditureMap[m] = 0;

    for (const payment of allPayments) {
      const monthName = payment.paidAt.toLocaleString('en-US', { month: 'short' });
      monthlyExpenditureMap[monthName] = (monthlyExpenditureMap[monthName] || 0) + payment.amount;
    }

    const monthlyExpenditure = Object.keys(monthlyExpenditureMap).map((m) => ({
      month: m,
      amount: Math.round(monthlyExpenditureMap[m]),
    }));

    return {
      metrics: {
        totalPurchaseRequests: totalPRs,
        pendingApprovals,
        activePurchaseOrders: activePOs,
        goodsAwaitingReceipt,
        outstandingInvoices,
        totalExpenditure: Math.round(totalExpenditure * 100) / 100,
      },
      statusDistribution,
      monthlyExpenditure,
      recentPurchaseRequests: recentPRs,
      recentAuditEvents,
    };
  }
}
