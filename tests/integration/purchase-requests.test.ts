import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../apps/api/src/app';

describe('Purchase Request Lifecycle Integration Tests', () => {
  let aliceToken: string;
  let bobEmpToken: string;
  let managerToken: string;

  beforeAll(async () => {
    const [resAlice, resBob, resMgr] = await Promise.all([
      request(app).post('/api/auth/login').send({ email: 'alice@procureflow.com', password: 'Employee@123' }),
      request(app).post('/api/auth/login').send({ email: 'bob_emp@procureflow.com', password: 'Password123!' }),
      request(app).post('/api/auth/login').send({ email: 'bob@procureflow.com', password: 'Manager@123' }),
    ]);
    aliceToken = resAlice.body.accessToken;
    bobEmpToken = resBob.body.accessToken;
    managerToken = resMgr.body.accessToken;
  });

  it('should create a valid purchase request with positive quantities and prices', async () => {
    const res = await request(app)
      .post('/api/purchase-requests')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        title: 'High Resolution Monitors for Design Lab',
        justification: 'Hardware upgrade for CAD 3D modeling workstations',
        requiredDate: '2026-12-25T00:00:00Z',
        items: [
          { productId: 'seed-prod-3', itemDescription: 'LG UltraFine 32-inch 4K Monitor', quantity: 2, unitPrice: 620.00 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('DRAFT');
    expect(res.body.totalAmount).toBe(1240.00);
    expect(res.body.items.length).toBe(1);
  });

  it('should reject purchase requests with negative price or zero quantity', async () => {
    const res = await request(app)
      .post('/api/purchase-requests')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        title: 'Faulty Request',
        justification: 'Testing negative amount validation',
        requiredDate: '2026-12-25T00:00:00Z',
        items: [
          { itemDescription: 'Invalid Item', quantity: 0, unitPrice: 100.00 },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('greater than 0');
  });

  it('should prevent Employee B from editing Employee A draft requisition', async () => {
    const res = await request(app)
      .patch('/api/purchase-requests/seed-pr-100')
      .set('Authorization', `Bearer ${bobEmpToken}`)
      .send({ title: 'Tampered Requisition' });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Resource ownership violation');
  });

  it('should submit draft requisition advancing state to SUBMITTED', async () => {
    // Create new draft
    const createRes = await request(app)
      .post('/api/purchase-requests')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        title: 'Draft to Submit Requisition',
        justification: 'Team operational supplies',
        requiredDate: '2026-12-20T00:00:00Z',
        items: [{ itemDescription: 'Office Supplies', quantity: 5, unitPrice: 20.00 }],
      });

    const prId = createRes.body.id;

    const submitRes = await request(app)
      .post(`/api/purchase-requests/${prId}/submit`)
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.status).toBe('SUBMITTED');
  });
});
