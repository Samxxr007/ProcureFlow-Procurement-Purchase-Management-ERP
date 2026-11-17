import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { ENV } from '../config/env';
import { AuditService } from './AuditService';
import { Role } from '@procureflow/shared';

export class AuthService {
  static async login(email: string, passwordPlain: string, ipAddress?: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      throw { status: 401, message: 'Invalid credentials or account is deactivated.' };
    }

    const passwordMatch = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!passwordMatch) {
      throw { status: 401, message: 'Invalid credentials or account is deactivated.' };
    }

    // Generate refresh token and session in DB
    const refreshToken = jwt.sign(
      { userId: user.id, nonce: `${Date.now()}-${Math.random().toString(36).substring(2)}` },
      ENV.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt,
      },
    });

    // Generate access token containing sessionId for real-time revocation checking
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        sessionId: session.id,
      },
      ENV.JWT_SECRET,
      { expiresIn: '15m' }
    );

    await AuditService.log({
      entityName: 'User',
      entityId: user.id,
      action: 'USER_LOGIN',
      userId: user.id,
      ipAddress,
      details: { email: user.email, role: user.role },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        isActive: user.isActive,
      },
      accessToken,
      refreshToken,
    };
  }

  static async logout(sessionId?: string, userId?: string, ipAddress?: string) {
    if (sessionId) {
      await prisma.session.update({
        where: { id: sessionId },
        data: { revokedAt: new Date() },
      });
    }

    if (userId) {
      await AuditService.log({
        entityName: 'User',
        entityId: userId,
        action: 'USER_LOGOUT',
        userId,
        ipAddress,
      });
    }

    return { success: true, message: 'Session logged out and revoked successfully.' };
  }

  static async refreshTokens(providedRefreshToken: string) {
    if (!providedRefreshToken) {
      throw { status: 401, message: 'Refresh token is required.' };
    }

    let payload: any;
    try {
      payload = jwt.verify(providedRefreshToken, ENV.JWT_REFRESH_SECRET);
    } catch (err) {
      throw { status: 401, message: 'Invalid or expired refresh token.' };
    }

    const session = await prisma.session.findUnique({
      where: { refreshToken: providedRefreshToken },
      include: { user: true },
    });

    // Reuse detection: if token is expired, revoked, or non-existent, revoke all user sessions
    if (!session || session.revokedAt !== null || session.expiresAt < new Date()) {
      if (payload.userId) {
        // Suspected token reuse: revoke all active sessions for this user
        await prisma.session.updateMany({
          where: { userId: payload.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      throw { status: 401, message: 'Refresh token reuse detected or session is revoked.' };
    }

    // Invalidate old session (token rotation)
    await prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    // Issue new pair with fresh nonce
    const newRefreshToken = jwt.sign(
      { userId: session.user.id, nonce: `${Date.now()}-${Math.random().toString(36).substring(2)}` },
      ENV.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    const newSession = await prisma.session.create({
      data: {
        userId: session.user.id,
        refreshToken: newRefreshToken,
        expiresAt: newExpiresAt,
      },
    });

    const newAccessToken = jwt.sign(
      {
        userId: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        department: session.user.department,
        sessionId: newSession.id,
      },
      ENV.JWT_SECRET,
      { expiresIn: '15m' }
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        department: session.user.department,
      },
    };
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw { status: 404, message: 'User not found.' };
    }

    return user;
  }
}
