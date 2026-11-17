import { prisma } from '../prisma';
import { AuthorizationPolicy, ActorContext } from '../policies/AuthorizationPolicy';
import { AuditService } from './AuditService';

export interface CreateSupplierInput {
  code: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  taxId?: string;
}

export class SupplierService {
  static async list(search?: string, activeOnly = false) {
    const where: any = {};
    if (activeOnly) where.isActive = true;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { email: { contains: search } },
      ];
    }
    return prisma.supplier.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { purchaseOrders: true, invoices: true },
        },
      },
    });
  }

  static async getById(id: string) {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        purchaseOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!supplier) {
      throw { status: 404, message: 'Supplier not found.' };
    }
    return supplier;
  }

  static async create(input: CreateSupplierInput, actor: ActorContext) {
    if (!AuthorizationPolicy.canManageSuppliers(actor)) {
      throw { status: 403, message: 'Forbidden: Only Procurement officers or Administrators can create suppliers.' };
    }

    if (!input.name || !input.code || !input.email) {
      throw { status: 400, message: 'Supplier code, name, and email are required.' };
    }

    const existing = await prisma.supplier.findUnique({
      where: { code: input.code },
    });
    if (existing) {
      throw { status: 400, message: `Supplier with code '${input.code}' already exists.` };
    }

    const supplier = await prisma.supplier.create({
      data: {
        code: input.code.toUpperCase().trim(),
        name: input.name.trim(),
        email: input.email.toLowerCase().trim(),
        phone: input.phone?.trim() || null,
        address: input.address?.trim() || null,
        taxId: input.taxId?.trim() || null,
      },
    });

    await AuditService.log({
      entityName: 'Supplier',
      entityId: supplier.id,
      action: 'SUPPLIER_CREATED',
      userId: actor.id,
      details: { code: supplier.code, name: supplier.name },
    });

    return supplier;
  }

  static async update(id: string, updates: Partial<CreateSupplierInput> & { isActive?: boolean }, actor: ActorContext) {
    if (!AuthorizationPolicy.canManageSuppliers(actor)) {
      throw { status: 403, message: 'Forbidden: Only Procurement officers or Administrators can update suppliers.' };
    }

    const existing = await prisma.supplier.findUnique({ where: { id } });
    if (!existing) {
      throw { status: 404, message: 'Supplier not found.' };
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        name: updates.name ? updates.name.trim() : undefined,
        email: updates.email ? updates.email.toLowerCase().trim() : undefined,
        phone: updates.phone !== undefined ? updates.phone?.trim() || null : undefined,
        address: updates.address !== undefined ? updates.address?.trim() || null : undefined,
        taxId: updates.taxId !== undefined ? updates.taxId?.trim() || null : undefined,
        isActive: updates.isActive !== undefined ? updates.isActive : undefined,
      },
    });

    await AuditService.log({
      entityName: 'Supplier',
      entityId: updated.id,
      action: 'SUPPLIER_UPDATED',
      userId: actor.id,
      details: { code: updated.code, updates },
    });

    return updated;
  }
}
