import { prisma } from '../prisma';
import { ActorContext } from '../policies/AuthorizationPolicy';

export class ProductService {
  static async list(search?: string, category?: string) {
    const where: any = { isActive: true };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { description: { contains: search } },
      ];
    }
    return prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  static async getById(id: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw { status: 404, message: 'Product not found.' };
    return product;
  }

  static async create(
    data: { code: string; name: string; description?: string; unit?: string; category: string; unitPrice: number },
    actor: ActorContext
  ) {
    const existing = await prisma.product.findUnique({ where: { code: data.code } });
    if (existing) throw { status: 400, message: `Product code '${data.code}' already exists.` };

    return prisma.product.create({
      data: {
        code: data.code.toUpperCase().trim(),
        name: data.name.trim(),
        description: data.description?.trim() || null,
        unit: data.unit || 'units',
        category: data.category.trim(),
        unitPrice: data.unitPrice,
      },
    });
  }
}
