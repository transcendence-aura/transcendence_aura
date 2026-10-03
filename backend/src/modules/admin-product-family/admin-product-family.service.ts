import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AdminProductFamilyType } from './admin-product-family.model';
import { AdminProductFamilyFilterInput } from './admin-product-family.input';

function mapProductFamily(family: {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isActive: boolean;
  categoryId: string;
}): AdminProductFamilyType {
  return { ...family, description: family.description ?? undefined };
}

@Injectable()
export class AdminProductFamilyService {
  constructor(private readonly prisma: PrismaService) {}

  async listProductFamilies(
    filter: AdminProductFamilyFilterInput,
  ): Promise<AdminProductFamilyType[]> {
    const families = await this.prisma.productFamily.findMany({
      where: { categoryId: filter.categoryId, isActive: filter.isActive },
      orderBy: { name: 'asc' },
    });
    return families.map(mapProductFamily);
  }
}
