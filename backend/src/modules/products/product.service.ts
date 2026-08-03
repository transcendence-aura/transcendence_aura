import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ProductType } from './product.model';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string): Promise<ProductType> {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { media: true, variants: true },
    });
    if (!product) {
      throw new NotFoundException('PRODUCT_NOT_FOUND');
    }
    return {
      ...product,
      description: product.description ?? undefined,
      media: product.media.map((m) => ({
        ...m,
        altText: m.altText ?? undefined,
      })),
      variants: product.variants.map((v) => ({
        ...v,
        price: v.price.toNumber(),
      })),
    };
  }
}
