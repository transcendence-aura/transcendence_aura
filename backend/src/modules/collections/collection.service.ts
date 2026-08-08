import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CollectionsType } from './collection.model';

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string): Promise<CollectionsType> {
    const collection = await this.prisma.collection.findFirst({
      where: { slug, isActive: true },
      include: { categories: { include: { productFamilies: true } } },
    });
    if (!collection) {
      throw new NotFoundException('COLLECTION_NOT_FOUND');
    }
    return {
      id: collection.id,
      slug: collection.slug,
      heroImageUrl: collection.heroImageUrl,
      name: collection.name,
      description: collection.description ?? undefined,
      categories: collection.categories.map((cat) => ({
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

  async findAll(): Promise<CollectionsType[]> {
    const collections = await this.prisma.collection.findMany({
      where: { isActive: true },
      include: { categories: { include: { productFamilies: true } } },
    });
    return collections.map((c) => ({
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
    }));
  }
}
