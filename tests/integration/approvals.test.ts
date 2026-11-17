import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../apps/api/src/app';

describe('Approval Workflow & Separation of Duties Integration Tests', () => {
  let aliceToken: string;
  let managerToken: string;

  beforeAll(async () => {
    const [resAlice, resMgr] = await Promise.all([
      request(app).post('/api/auth/login').send({ email: 'alice@procureflow.com', password: 'Employee@123' }),
      request(app).post('/api/auth/login').send({ email: 'bob@procureflow.com', password: 'Manager@123' }),
    ]);
    aliceToken = resAlice.body.accessToken;
    managerToken = resMgr.body.accessToken;
  });

  it('should prohibit employee self-approval with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/purchase-requests/seed-pr-101/approve')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ decision: 'APPROVED', comments: 'Attempting self-approval' });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Separation of duties');
  });

  it('should permit manager to approve submitted requisition', async () => {
    // Create and submit a new PR first
    const createRes = await request(app)
      .post('/api/purchase-requests')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        title: 'Workstation for New Hire',
        justification: 'Quarterly hiring workstation allocation',
        requiredDate: '2026-12-15T00:00:00Z',
        items: [{ itemDescription: 'Dell Laptop', quantity: 1, unitPrice: 1500.00 }],
      });

    const prId = createRes.body.id;
    await request(app).post(`/api/purchase-requests/${prId}/submit`).set('Authorization', `Bearer ${aliceToken}`);

    const approveRes = await request(app)
      .post(`/api/purchase-requests/${prId}/approve`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ decision: 'APPROVED', comments: 'Approved within budget' });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.purchaseRequest.status).toBe('APPROVED');
    expect(approveRes.body.approval.decision).toBe('APPROVED');
  });
});
