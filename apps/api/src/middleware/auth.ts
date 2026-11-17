import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { prisma } from '../prisma';
import { Role } from '@procureflow/shared';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  sessionId?: string;
  department?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Authentication required. No bearer token provided.' });
    return;
  }

  try {
    const payload = jwt.verify(token, ENV.JWT_SECRET) as any;

    // Check if session is revoked in database
    if (payload.sessionId) {
      const session = await prisma.session.findUnique({
        where: { id: payload.sessionId },
      });

      if (!session || session.revokedAt !== null || session.expiresAt < new Date()) {
        res.status(401).json({ error: 'Session has been invalidated or expired.' });
        return;
      }
    }

    req.user = {
      id: payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      sessionId: payload.sessionId,
      department: payload.department,
    };

    next();
  } catch (err: any) {
    res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

export function requireRole(...allowedRoles: (Role | string)[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized. Authentication required.' });
      return;
    }

    if (req.user.role === Role.ADMIN) {
      next();
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden. Role '${req.user.role}' lacks permission for this operation. Required: [${allowedRoles.join(', ')}]`,
      });
      return;
    }

    next();
  };
}
