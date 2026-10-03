import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AnalyticsEventType } from '../analytics/analytics-event-type.enum';
import { AnalyticsPeriod, resolveAnalyticsPeriod } from './analytics-period.enum';
import { AnalyticsTimeSeriesPointType, TopWishlistedProductType } from './analytics-reports.model';

const DEFAULT_TOP_PRODUCTS_LIMIT = 10;

// Present in every raw aggregation row; Postgres COUNT() returns bigint,
// which node-postgres may hand back as either a bigint or a numeric string
// depending on driver config — Number() normalizes both.
interface RawCountRow {
  bucket: Date;
  count: bigint | number;
}

@Injectable()
export class AnalyticsReportsService {
  constructor(private readonly prisma: PrismaService) {}

  registrationsOverTime(period: AnalyticsPeriod): Promise<AnalyticsTimeSeriesPointType[]> {
    return this.getEventCountSeries(AnalyticsEventType.USER_REGISTERED, period);
  }

  messagesOverTime(period: AnalyticsPeriod): Promise<AnalyticsTimeSeriesPointType[]> {
    return this.getEventCountSeries(AnalyticsEventType.MESSAGE_SENT, period);
  }

  followsOverTime(period: AnalyticsPeriod): Promise<AnalyticsTimeSeriesPointType[]> {
    return this.getEventCountSeries(AnalyticsEventType.USER_FOLLOWED, period);
  }

  async activeUsersOverTime(period: AnalyticsPeriod): Promise<AnalyticsTimeSeriesPointType[]> {
    const { from, to, bucket } = resolveAnalyticsPeriod(period);

    const rows = await this.prisma.$queryRaw<RawCountRow[]>(Prisma.sql`
      SELECT date_trunc(${bucket}, "occurredAt") AS bucket,
             COUNT(DISTINCT "actorId") AS count
      FROM "analytics_events"
      WHERE "occurredAt" <= ${to}
        ${from ? Prisma.sql`AND "occurredAt" >= ${from}` : Prisma.empty}
      GROUP BY bucket
      ORDER BY bucket ASC
    `);

    return rows.map((row) => ({ bucket: row.bucket, count: Number(row.count) }));
  }

  async topProductsByWishlistAdds(
    period: AnalyticsPeriod,
    limit: number = DEFAULT_TOP_PRODUCTS_LIMIT,
  ): Promise<TopWishlistedProductType[]> {
    const { from, to } = resolveAnalyticsPeriod(period);

    const rows = await this.prisma.$queryRaw<
      { productId: string; name: string; slug: string; wishlistAdds: bigint | number }[]
    >(Prisma.sql`
      SELECT p.id AS "productId", p.name, p.slug, COUNT(*) AS "wishlistAdds"
      FROM "analytics_events" e
      JOIN "products" p ON p.id = e."targetId"
      WHERE e."eventType" = ${AnalyticsEventType.WISHLIST_ITEM_ADDED}
        AND e."occurredAt" <= ${to}
        ${from ? Prisma.sql`AND e."occurredAt" >= ${from}` : Prisma.empty}
      GROUP BY p.id, p.name, p.slug
      ORDER BY "wishlistAdds" DESC
      LIMIT ${limit}
    `);

    return rows.map((row) => ({ ...row, wishlistAdds: Number(row.wishlistAdds) }));
  }

  private async getEventCountSeries(
    eventType: AnalyticsEventType,
    period: AnalyticsPeriod,
  ): Promise<AnalyticsTimeSeriesPointType[]> {
    const { from, to, bucket } = resolveAnalyticsPeriod(period);

    const rows = await this.prisma.$queryRaw<RawCountRow[]>(Prisma.sql`
      SELECT date_trunc(${bucket}, "occurredAt") AS bucket,
             COUNT(*) AS count
      FROM "analytics_events"
      WHERE "eventType" = ${eventType}
        AND "occurredAt" <= ${to}
        ${from ? Prisma.sql`AND "occurredAt" >= ${from}` : Prisma.empty}
      GROUP BY bucket
      ORDER BY bucket ASC
    `);

    return rows.map((row) => ({ bucket: row.bucket, count: Number(row.count) }));
  }
}
