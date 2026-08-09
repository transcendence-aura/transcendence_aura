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

    // price sort takes priority; otherwise sort by search relevance; otherwise a stable default order.
    const orderByExpr = filter.sortByPrice
      ? Prisma.sql`min_price ${filter.sortByPrice === PriceSortOrder.ASC ? Prisma.sql`ASC` : Prisma.sql`DESC`} NULLS LAST`
      : tsQuery
        ? Prisma.sql`search_rank DESC`
        : Prisma.sql`"createdAt" ASC, id ASC`;

    // Single query: search (optional) -> filters -> sort -> paginate over the whole catalog.
    // Prisma.sql tagged template — parameterized, no SQL injection possible.
    const pageRows = await this.prisma.$queryRaw<
      { ids: string[]; total_count: bigint | number }[]
    >(Prisma.sql`
      WITH filtered AS (
        SELECT
          p.id,
          p."createdAt",
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
      total: items.length,
      hasNextPage: skip + items.length < totalMatches,
    };
  }
}
