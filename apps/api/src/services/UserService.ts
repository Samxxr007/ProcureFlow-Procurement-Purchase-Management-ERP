import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';
import { AuthorizationPolicy, ActorContext } from '../policies/AuthorizationPolicy';
import { AuditService } from './AuditService';

export interface CreateUserInput {
  email: string;
  name: string;
  role: string;
  department?: string;
  password?: string;
}

export class UserService {
  static async list() {
    return prisma.user.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { purchaseRequests: true, approvals: true },
        },
      },
    });
  }

  static async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
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
    if (!user) throw { status: 404, message: 'User not found.' };
    return user;
  }

  static async create(input: CreateUserInput, actor: ActorContext) {
    if (!AuthorizationPolicy.isAdmin(actor)) {
      throw { status: 403, message: 'Forbidden: User creation is restricted to Administrators.' };
    }

    if (!input.email || !input.name || !input.role) {
      throw { status: 400, message: 'Email, name, and role are required.' };
    }

    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    if (existing) {
      throw { status: 400, message: `User with email '${input.email}' already exists.` };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password || 'Password123!', salt);

    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase().trim(),
        name: input.name.trim(),
        role: input.role,
        department: input.department?.trim() || null,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        isActive: true,
      },
    });

    await AuditService.log({
      entityName: 'User',
      entityId: user.id,
      action: 'USER_CREATED',
      userId: actor.id,
      details: { email: user.email, role: user.role },
    });

    return user;
  }

  static async update(id: string, updates: Partial<CreateUserInput> & { isActive?: boolean }, actor: ActorContext) {
    if (!AuthorizationPolicy.isAdmin(actor)) {
      throw { status: 403, message: 'Forbidden: User modification is restricted to Administrators.' };
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw { status: 404, message: 'User not found.' };

    const data: any = {};
    if (updates.name) data.name = updates.name.trim();
    if (updates.department !== undefined) data.department = updates.department?.trim() || null;
    if (updates.role) data.role = updates.role;
    if (updates.isActive !== undefined) data.isActive = updates.isActive;
    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      data.passwordHash = await bcrypt.hash(updates.password, salt);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        isActive: true,
      },
    });

    await AuditService.log({
      entityName: 'User',
      entityId: user.id,
      action: 'USER_UPDATED',
      userId: actor.id,
      details: { email: user.email, role: user.role },
    });

    return user;
  }
}
