import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CollectionsType } from './collection.model';

const collectionInclude = {
  categories: {
    where: { isActive: true },
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
    include: { productFamilies: { where: { isActive: true } } },
  },
} satisfies Prisma.CollectionInclude;

type CollectionRow = Prisma.CollectionGetPayload<{ include: typeof collectionInclude }>;

function toCollection(c: CollectionRow): CollectionsType {
  return {
    id: c.id,
    slug: c.slug,
    heroImageUrl: c.heroImageUrl,
    name: c.name,
    description: c.description ?? undefined,
    categories: c.categories.map((cat) => ({
      id: cat.id,
      slug: cat.slug,
      name: cat.name,
      description: cat.description ?? undefined,
      productFamilies: cat.productFamilies.map((f) => ({
        id: f.id,
        slug: f.slug,
        name: f.name,
      })),
    })),
  };
}

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string): Promise<CollectionsType> {
    const collection = await this.prisma.collection.findFirst({
      where: { slug, isActive: true },
      include: collectionInclude,
    });
    if (!collection) {
      throw new NotFoundException('COLLECTION_NOT_FOUND');
    }
    return toCollection(collection);
  }

  async findAll(): Promise<CollectionsType[]> {
    const collections = await this.prisma.collection.findMany({
      where: { isActive: true },
      include: collectionInclude,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });
    return collections.map(toCollection);
  }

  async findPage(
    page: number,
    limit: number,
  ): Promise<{ items: CollectionsType[]; total: number }> {
    const where = { isActive: true };
    const [collections, total] = await Promise.all([
      this.prisma.collection.findMany({
        where,
        include: collectionInclude,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.collection.count({ where }),
    ]);
    return { items: collections.map(toCollection), total };
  }
}
