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

  async findAll(): Promise<PublicCategory[]> {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true, collection: { isActive: true } },
      include: { collection: { select: { slug: true } } },
      orderBy: { name: 'asc' },
    });
    return categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description ?? undefined,
      collectionSlug: c.collection.slug,
    }));
  }
}
