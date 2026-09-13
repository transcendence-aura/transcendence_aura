import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ProductMediaType, ProductPageType, ProductType } from './product.model';
import { ProductSortOrder, ProductPaginationInput, ProductsFilterInput } from './product.input';

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

  // Builds the SQL WHERE clauses shared by every product listing query:
  // active products, optional full-text search match, and all other filters.
  private buildSearchFilterClauses(
    filter: ProductsFilterInput,
    tsQuery: string | null,
  ): Prisma.Sql[] {
    const clauses: Prisma.Sql[] = [Prisma.sql`p."isActive" = true`];

    if (tsQuery) {
      clauses.push(Prisma.sql`
        (
          setweight(to_tsvector('simple', unaccent(coalesce(p.name, ''))), 'A') ||
          setweight(to_tsvector('simple', unaccent(coalesce(p.description, ''))), 'B')
        ) @@ to_tsquery('simple', ${tsQuery})
      `);
    }

    if (filter.collectionSlug) {
      clauses.push(Prisma.sql`
        EXISTS (
          SELECT 1
          FROM "_CollectionToProduct" cp
          JOIN "collections" c ON c.id = cp."A"
          WHERE cp."B" = p.id
            AND c.slug = ${filter.collectionSlug}
        )
      `);
    }

    if (filter.categorySlug) {
      clauses.push(Prisma.sql`
        EXISTS (
          SELECT 1
          FROM "_CategoryToProduct" cp
          JOIN "categories" c ON c.id = cp."A"
          WHERE cp."B" = p.id
            AND c.slug = ${filter.categorySlug}
        )
      `);
    }

    if (filter.productFamilySlug) {
      clauses.push(Prisma.sql`
        EXISTS (
          SELECT 1
          FROM "_ProductToProductFamily" pf
          JOIN "product_families" f ON f.id = pf."B"
          WHERE pf."A" = p.id
            AND f.slug = ${filter.productFamilySlug}
        )
      `);
    }

    if (filter.badge) {
      clauses.push(Prisma.sql`p.badges @> ARRAY[${filter.badge}]::text[]`);
    }

    if (filter.onlyAvailable) {
      clauses.push(Prisma.sql`
        EXISTS (
          SELECT 1
          FROM "product_variants" pv
          WHERE pv."productId" = p.id
            AND pv."isAvailable" = true
        )
      `);
    }

    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      const variantPriceClauses: Prisma.Sql[] = [
        Prisma.sql`pv."productId" = p.id`,
        Prisma.sql`pv."isAvailable" = true`,
      ];

      if (filter.minPrice !== undefined) {
        variantPriceClauses.push(Prisma.sql`pv.price >= ${filter.minPrice}`);
      }

      if (filter.maxPrice !== undefined) {
        variantPriceClauses.push(Prisma.sql`pv.price <= ${filter.maxPrice}`);
      }

      clauses.push(Prisma.sql`
        EXISTS (
          SELECT 1
          FROM "product_variants" pv
          WHERE ${Prisma.join(variantPriceClauses, ' AND ')}
        )
      `);
    }

    return clauses;
  }

  private mapProduct(p: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    isActive: boolean;
    badges: string[];
    popularityScore: number;
    createdAt: Date;
    updatedAt: Date;
    media: { id: string; url: string; altText: string | null; position: number }[];
    variants: {
      id: string;
      label: string;
      isAvailable: boolean;
      price: { toNumber(): number };
      isOnSale: boolean;
      discountPercentage: { toNumber(): number };
      productId: string;
      createdAt: Date;
      updatedAt: Date;
    }[];
    categories: { id: string; name: string; slug: string }[];
    productFamilies: { id: string; name: string; slug: string }[];
    collections: { id: string; name: string; slug: string }[];
  }): ProductType {
    const media = mapMedia(p.media);
    const variants = p.variants.map((v) => ({
      ...v,
      price: v.price.toNumber(),
      discountPercentage: v.discountPercentage.toNumber(),
    }));
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
      where: { slug, isActive: true },
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
    const variants = product.variants.map((v) => ({
      ...v,
      price: v.price.toNumber(),
      discountPercentage: v.discountPercentage.toNumber(),
    }));

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

  async findById(id: string): Promise<ProductType> {
    const product = await this.prisma.product.findUnique({
      where: { id },
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

    return this.mapProduct(product);
  }

  async findByIds(productIds: string[]): Promise<ProductType[]> {
    if (productIds.length === 0) return [];

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: {
        media: { orderBy: { position: 'asc' } },
        variants: { orderBy: { price: 'asc' } },
        categories: true,
        productFamilies: true,
        collections: true,
      },
    });

    const byId = new Map(products.map((p) => [p.id, this.mapProduct(p)]));
    return productIds
      .map((id) => byId.get(id))
      .filter((product): product is ProductType => product !== undefined);
  }

  async findMany(
    filter: ProductsFilterInput,
    pagination: ProductPaginationInput,
  ): Promise<ProductPageType> {
    if (
      filter.minPrice !== undefined &&
      filter.maxPrice !== undefined &&
      filter.minPrice > filter.maxPrice
    ) {
      throw new BadRequestException('minPrice must not exceed maxPrice');
    }

    const skip = (pagination.page - 1) * pagination.limit;
    const tsQuery = filter.search?.trim() ? this.buildTsQuery(filter.search) : null;

    const whereClauses = this.buildSearchFilterClauses(filter, tsQuery);

    const rankExpr = tsQuery
      ? Prisma.sql`
          ts_rank(
            setweight(to_tsvector('simple', unaccent(coalesce(p.name, ''))), 'A') ||
            setweight(to_tsvector('simple', unaccent(coalesce(p.description, ''))), 'B'),
            to_tsquery('simple', ${tsQuery})
          )
        `
      : Prisma.sql`0`;

    const orderByExpr = (() => {
      switch (filter.sort) {
        case ProductSortOrder.PRICE_ASC:
          return Prisma.sql`min_price ASC NULLS LAST`;
        case ProductSortOrder.PRICE_DESC:
          return Prisma.sql`min_price DESC NULLS LAST`;
        case ProductSortOrder.NEWEST:
          return Prisma.sql`"createdAt" DESC, id DESC`;
        case ProductSortOrder.POPULARITY:
          return Prisma.sql`popularity_score DESC, "createdAt" DESC`;
        default:
          return tsQuery ? Prisma.sql`search_rank DESC` : Prisma.sql`"createdAt" ASC, id ASC`;
      }
    })();

    const pageRows = await this.prisma.$queryRaw<
      { ids: string[]; total_count: bigint | number }[]
    >(Prisma.sql`
      WITH filtered AS (
        SELECT
          p.id,
          p."createdAt",
          p."popularityScore" AS popularity_score,
          price.min_price,
          ${rankExpr} AS search_rank
        FROM "products" p
        LEFT JOIN LATERAL (
          SELECT MIN(pv.price) AS min_price
          FROM "product_variants" pv
          WHERE pv."productId" = p.id
            AND pv."isAvailable" = true
        ) price ON true
        WHERE ${Prisma.join(whereClauses, ' AND ')}
      ),
      total_cte AS (
        SELECT COUNT(*) AS total_count FROM filtered
      ),
      paged AS (
        SELECT id
        FROM filtered
        ORDER BY ${orderByExpr}
        OFFSET ${skip}
        LIMIT ${pagination.limit}
      )
      SELECT
        COALESCE(array_agg(paged.id), ARRAY[]::uuid[])::text[] AS ids,
        total_cte.total_count
      FROM paged
      CROSS JOIN total_cte
      GROUP BY total_cte.total_count
    `);

    const firstRow = pageRows[0];
    const totalMatches = firstRow ? Number(firstRow.total_count) : 0;
    const pageIds = firstRow?.ids ?? [];

    if (pageIds.length === 0) {
      return { items: [], total: 0, hasNextPage: false };
    }

    const rawItems = await this.prisma.product.findMany({
      where: { id: { in: pageIds } },
      include: {
        media: { orderBy: { position: 'asc' } },
        variants: { orderBy: { price: 'asc' } },
        categories: true,
        productFamilies: true,
        collections: true,
      },
    });

    // `id IN (...)` does not preserve array order, so we re-apply the page order explicitly.
    const pageOrderMap = new Map(pageIds.map((id, i) => [id, i]));
    const items = rawItems
      .map((p) => this.mapProduct(p))
      .sort((a, b) => (pageOrderMap.get(a.id) ?? 0) - (pageOrderMap.get(b.id) ?? 0));

    return {
      items,
      total: totalMatches,
      hasNextPage: skip + items.length < totalMatches,
    };
  }
}
