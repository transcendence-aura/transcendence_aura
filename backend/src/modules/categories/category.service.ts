import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface PublicCategory {
  id: string;
  slug: string;
  name: string;
  description?: string;
  collectionSlug: string;
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findPage(page: number, limit: number): Promise<{ items: PublicCategory[]; total: number }> {
    const where = { isActive: true, collection: { isActive: true } };
    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        include: { collection: { select: { slug: true } } },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.category.count({ where }),
    ]);
    return {
      items: categories.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description ?? undefined,
        collectionSlug: c.collection.slug,
      })),
      total,
    };
  }
}
