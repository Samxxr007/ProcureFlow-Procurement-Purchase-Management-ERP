import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../apps/api/src/app';

describe('Payment Processing & Idempotency Integration Tests', () => {
  let financeToken: string;
  let testInvoiceId: string;

  beforeAll(async () => {
    const resFin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'fiona@procureflow.com', password: 'Finance@123' });
    financeToken = resFin.body.accessToken;

    const resEmp = await request(app)
      .post('/api/auth/login')
      .send({ email: 'diana@procureflow.com', password: 'Password123!' });
    const empToken = resEmp.body.accessToken;

    const resMgr = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sarah@procureflow.com', password: 'Manager@123' });
    const mgrToken = resMgr.body.accessToken;

    const resProc = await request(app)
      .post('/api/auth/login')
      .send({ email: 'david@procureflow.com', password: 'Procure@123' });
    const procToken = resProc.body.accessToken;

    // 1. Create PR
    const prRes = await request(app)
      .post('/api/purchase-requests')
      .set('Authorization', `Bearer ${empToken}`)
      .send({
        title: 'Payment Integration Test PR',
        justification: 'Hardware requisition for testing payment processing flow',
        requiredDate: '2026-12-31T00:00:00Z',
        items: [{ itemDescription: 'Server Rack Rails', quantity: 2, unitPrice: 120.00 }],
      });
    const prId = prRes.body.id;

    // 2. Submit & Approve PR
    await request(app).post(`/api/purchase-requests/${prId}/submit`).set('Authorization', `Bearer ${empToken}`);
    await request(app).post(`/api/purchase-requests/${prId}/approve`).set('Authorization', `Bearer ${mgrToken}`).send({ decision: 'APPROVED' });

    // 3. Create PO
    const poRes = await request(app)
      .post('/api/purchase-orders')
      .set('Authorization', `Bearer ${procToken}`)
      .send({
        purchaseRequestId: prId,
        supplierId: 'seed-supp-1',
        items: [{ itemDescription: 'Server Rack Rails', quantity: 2, unitPrice: 120.00 }],
      });
    const poId = poRes.body.id;

    // 4. Record GR
    await request(app)
      .post('/api/goods-receipts')
      .set('Authorization', `Bearer ${procToken}`)
      .send({
        purchaseOrderId: poId,
        items: [{ itemDescription: 'Server Rack Rails', orderedQuantity: 2, receivedQuantity: 2, damagedQuantity: 0 }],
      });

    // 5. Create & Verify Invoice
    const invRes = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        invoiceNumber: `INV-PAY-INT-${Date.now()}`,
        purchaseOrderId: poId,
        supplierId: 'seed-supp-1',
        amount: 240.00,
        dueDate: '2026-12-31',
      });
    testInvoiceId = invRes.body.id;

    await request(app).post(`/api/invoices/${testInvoiceId}/verify`).set('Authorization', `Bearer ${financeToken}`);
  });

  it('should reject payment if invoice is not VERIFIED', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        invoiceId: 'seed-inv-unverified',
        paymentMethod: 'WIRE_TRANSFER',
        idempotencyKey: `idem-key-test-${Date.now()}`,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('must be VERIFIED');
  });

  it('should reject payment if idempotency key is already used', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        invoiceId: 'seed-inv-101',
        paymentMethod: 'EFT_ACH',
        idempotencyKey: 'seed-payment-idem-101', // Already seeded
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('Idempotency Conflict');
  });

  it('should process payment on verified invoice and transition state to PAID', async () => {
    const uniqueKey = `idem-key-test-success-${Date.now()}`;
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        invoiceId: testInvoiceId,
        paymentMethod: 'WIRE_TRANSFER',
        idempotencyKey: uniqueKey,
        referenceNotes: 'Settled full invoice balance',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('COMPLETED');
    expect(res.body.paymentNumber).toContain('PAY-');
  });
});
