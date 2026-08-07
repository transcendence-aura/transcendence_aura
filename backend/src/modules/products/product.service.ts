import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ProductPageType, ProductType } from './product.model';
import { PriceSortOrder, ProductPaginationInput, ProductsFilterInput } from './product.input';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string): Promise<ProductType> {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        media: { orderBy: { position: 'asc' } },
        variants: { orderBy: { price: 'asc' } },
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

  async findMany(
    filter: ProductsFilterInput,
    pagination: ProductPaginationInput,
  ): Promise<ProductPageType> {
    const where = {
      isActive: true,
      ...(filter.collectionSlug && { collections: { some: { slug: filter.collectionSlug } } }),
      ...(filter.categorySlug && { categories: { some: { slug: filter.categorySlug } } }),
      ...(filter.productFamilySlug && {
        productFamilies: { some: { slug: filter.productFamilySlug } },
      }),
      ...(filter.badge && { badges: { has: filter.badge } }),
      ...((filter.minPrice !== undefined || filter.maxPrice !== undefined) && {
        variants: {
          some: {
            isAvailable: true,
            price: {
              ...(filter.minPrice !== undefined && { gte: filter.minPrice }),
              ...(filter.maxPrice !== undefined && { lte: filter.maxPrice }),
            },
          },
        },
      }),
    };

    const skip = (pagination.page - 1) * pagination.limit;

    const [rawItems, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: pagination.limit,
        include: {
          media: { orderBy: { position: 'asc' } },
          variants: { orderBy: { price: 'asc' } },
          categories: true,
          productFamilies: true,
          collections: true,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const mapped = rawItems.map((p) => {
      const media = p.media.map((m) => ({ ...m, altText: m.altText ?? undefined }));
      const variants = p.variants.map((v) => ({ ...v, price: v.price.toNumber() }));
      const availablePrices = p.variants
        .filter((v) => v.isAvailable)
        .map((v) => v.price.toNumber());

      return {
        ...p,
        description: p.description ?? undefined,
        media,
        variants,
        primaryImage: media[0],
        minPrice: availablePrices.length > 0 ? Math.min(...availablePrices) : undefined,
        categories: p.categories,
        productFamilies: p.productFamilies,
        collections: p.collections,
      };
    });

    // sort by min price in memory since Prisma doesn't support orderBy on relation aggregates
    const items = filter.sortByPrice
      ? mapped.sort((a, b) => {
          const aPrice = a.minPrice ?? Infinity;
          const bPrice = b.minPrice ?? Infinity;
          return filter.sortByPrice === PriceSortOrder.ASC ? aPrice - bPrice : bPrice - aPrice;
        })
      : mapped;

    return {
      items,
      total,
      hasNextPage: skip + items.length < total,
    };
  }
}
