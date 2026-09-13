import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AdminCategoryType } from './admin-category.model';
import { AdminCategoryFilterInput } from './admin-category.input';

function mapCategory(category: {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isActive: boolean;
  collectionId: string;
}): AdminCategoryType {
  return { ...category, description: category.description ?? undefined };
}

@Injectable()
export class AdminCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories(filter: AdminCategoryFilterInput): Promise<AdminCategoryType[]> {
    const categories = await this.prisma.category.findMany({
      where: { collectionId: filter.collectionId, isActive: filter.isActive },
      orderBy: { name: 'asc' },
    });
    return categories.map(mapCategory);
  }
}

