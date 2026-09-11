import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AdminCollectionType } from './admin-collection.model';
import { AdminCollectionFilterInput } from './admin-collection.input';

function mapCollection(collection: {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  heroImageUrl: string;
  isActive: boolean;
}): AdminCollectionType {
  return { ...collection, description: collection.description ?? undefined };
}

@Injectable()
export class AdminCollectionService {
  constructor(private readonly prisma: PrismaService) {}

  async listCollections(filter: AdminCollectionFilterInput): Promise<AdminCollectionType[]> {
    const collections = await this.prisma.collection.findMany({
      where: { isActive: filter.isActive },
      orderBy: { name: 'asc' },
    });
    return collections.map(mapCollection);
  }
}

