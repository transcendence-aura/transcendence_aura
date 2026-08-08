import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ProductMediaType, ProductPageType, ProductType } from './product.model';
import { PriceSortOrder, ProductPaginationInput, ProductsFilterInput } from './product.input';

const PLACEHOLDER_IMAGE: ProductMediaType = {
  id: 'placeholder',
  url: 'https://placehold.co/800x800?text=No%20image',
  altText: 'No image available',
  position: 0,
  isPrimary: true,
};

function mapMedia(
  raw: { id: string; url: string; altText: string | null; position: number }[],
): ProductMediaType[] {
  if (raw.length === 0) return [PLACEHOLDER_IMAGE];
  return raw.map((m, i) => ({ ...m, altText: m.altText ?? undefined, isPrimary: i === 0 }));
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // Strips accents, lowercases, and appends :* to each word for prefix matching.
  private buildTsQuery(search: string): string | null {
    const terms = search
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => /\w/.test(w));
    if (terms.length === 0) return null;
    return terms.map((w) => `${w}:*`).join(' & ');
  }

  private buildOrmWhere(filter: ProductsFilterInput, extraIds?: string[]) {
    return {
      isActive: true,
      ...(extraIds && { id: { in: extraIds } }),
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
  }

  private mapProduct(p: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    isActive: boolean;
    badges: string[];
    createdAt: Date;
    updatedAt: Date;
    media: { id: string; url: string; altText: string | null; position: number }[];
    variants: {
      id: string;
      label: string;
      isAvailable: boolean;
      price: { toNumber(): number };
      productId: string;
      createdAt: Date;
      updatedAt: Date;
    }[];
    categories: { id: string; name: string; slug: string }[];
    productFamilies: { id: string; name: string; slug: string }[];
    collections: { id: string; name: string; slug: string }[];
  }) {
    const media = mapMedia(p.media);
    const variants = p.variants.map((v) => ({ ...v, price: v.price.toNumber() }));
    const availablePrices = p.variants.filter((v) => v.isAvailable).map((v) => v.price.toNumber());
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
  }

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

    const media = mapMedia(product.media);
    const variants = product.variants.map((v) => ({ ...v, price: v.price.toNumber() }));

    return {
      ...product,
      description: product.description ?? undefined,
      media,
      primaryImage: media[0],
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
    const skip = (pagination.page - 1) * pagination.limit;
    const tsQuery = filter.search?.trim() ? this.buildTsQuery(filter.search) : null;

    let rankedIds: string[] | undefined;
    if (tsQuery) {
      // Prisma.sql tagged template — parameterized, no SQL injection possible
      const ftsRows = await this.prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
        SELECT id
        FROM products
        WHERE "isActive" = true
          AND to_tsvector('simple',
                unaccent(coalesce(name, '')) || ' ' || unaccent(coalesce(description, '')))
              @@ to_tsquery('simple', ${tsQuery})
        ORDER BY ts_rank(
          to_tsvector('simple', unaccent(coalesce(name, '')) || ' ' || unaccent(coalesce(description, ''))),
          to_tsquery('simple', ${tsQuery})
        ) DESC
      `);

      rankedIds = ftsRows.map((r) => r.id);
      if (rankedIds.length === 0) {
        return { items: [], total: 0, hasNextPage: false };
      }
    }

    const where = this.buildOrmWhere(filter, rankedIds);

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

    const mapped = rawItems.map((p) => this.mapProduct(p));

    const rankMap = rankedIds ? new Map(rankedIds.map((id, i) => [id, i])) : null;

    // price sort takes priority; otherwise respect ts_rank order when searching
    const items = filter.sortByPrice
      ? mapped.sort((a, b) => {
          const aPrice = a.minPrice ?? Infinity;
          const bPrice = b.minPrice ?? Infinity;
          return filter.sortByPrice === PriceSortOrder.ASC ? aPrice - bPrice : bPrice - aPrice;
        })
      : rankMap
        ? mapped.sort((a, b) => (rankMap.get(a.id) ?? 0) - (rankMap.get(b.id) ?? 0))
        : mapped;

    return {
      items,
      total,
      hasNextPage: skip + items.length < total,
    };
  }
}
