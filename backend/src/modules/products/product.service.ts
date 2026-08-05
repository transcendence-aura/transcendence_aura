import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ProductType } from './product.model';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string): Promise<ProductType> {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        media: { orderBy: { position: 'asc' } },
        variants: true,
        categories: true,
        productFamilies: true,
        collections: true,
      },
    });
    if (!product) {
      throw new NotFoundException('PRODUCT_NOT_FOUND');
    }

    const media = product.media.map((m) => ({
      ...m,
      altText: m.altText ?? undefined,
    }));

    const variants = product.variants.map((v) => ({
      ...v,
      price: v.price.toNumber(),
    }));

    return {
      ...product,
      description: product.description ?? undefined,
      media,
      variants,
      categories: product.categories,
      productFamilies: product.productFamilies,
      collections: product.collections,
    };
  }
}
