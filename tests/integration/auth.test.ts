import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../apps/api/src/app';

describe('Authentication & Session Management Integration Tests', () => {
  it('should authenticate valid user and issue access and refresh tokens', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@procureflow.com', password: 'Admin@123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user.role).toBe('ADMIN');
  });

  it('should reject invalid password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@procureflow.com', password: 'WrongPassword!' });

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Invalid credentials');
  });

  it('should access protected profile route with valid token', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'diana@procureflow.com', password: 'Password123!' });

    const token = loginRes.body.accessToken;

    const profileRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.email).toBe('diana@procureflow.com');
  });

  it('should invalidate session upon logout', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'evan@procureflow.com', password: 'Password123!' });

    const token = loginRes.body.accessToken;

    // Logout
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(logoutRes.status).toBe(200);

    // Attempt using token after session revocation
    const profileRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(profileRes.status).toBe(401);
    expect(profileRes.body.error).toContain('invalidated or expired');
  });

  it('should rotate tokens and prevent reuse', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'charlie@procureflow.com', password: 'Password123!' });

    const initialRefreshToken = loginRes.body.refreshToken;

    // Refresh token exchange
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: initialRefreshToken });

    if (refreshRes.status !== 200) {
      console.log('REFRESH_ERROR_BODY:', refreshRes.body);
    }

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body).toHaveProperty('accessToken');
    expect(refreshRes.body).toHaveProperty('refreshToken');

    // Attempting to reuse the old refresh token must be rejected
    const reuseRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: initialRefreshToken });

    expect(reuseRes.status).toBe(401);
  });
});
