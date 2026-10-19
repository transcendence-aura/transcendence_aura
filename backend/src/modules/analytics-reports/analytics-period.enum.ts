import { registerEnumType } from '@nestjs/graphql';

// Shared by every "over time" analytics query, so the dashboard's period
// selector drives all charts identically.
export enum AnalyticsPeriod {
  TODAY = 'TODAY',
  LAST_WEEK = 'LAST_WEEK',
  LAST_MONTH = 'LAST_MONTH',
  LAST_6_MONTHS = 'LAST_6_MONTHS',
  ALL_TIME = 'ALL_TIME',
}

registerEnumType(AnalyticsPeriod, { name: 'AnalyticsPeriod' });

export type AnalyticsBucket = 'hour' | 'day' | 'week' | 'month';

export interface ResolvedAnalyticsPeriod {
  from: Date | null;
  to: Date;
  bucket: AnalyticsBucket;
}

// Bucket size grows with the period so a chart never renders an unusable
// number of points (e.g. 180 daily bars for "last 6 months").
export function resolveAnalyticsPeriod(
  period: AnalyticsPeriod,
  now: Date = new Date(),
): ResolvedAnalyticsPeriod {
  switch (period) {
    case AnalyticsPeriod.TODAY: {
      const from = new Date(now);
      from.setHours(0, 0, 0, 0);
      return { from, to: now, bucket: 'hour' };
    }
    case AnalyticsPeriod.LAST_WEEK: {
      const from = new Date(now);
      from.setDate(from.getDate() - 7);
      return { from, to: now, bucket: 'day' };
    }
    case AnalyticsPeriod.LAST_MONTH: {
      const from = new Date(now);
      from.setMonth(from.getMonth() - 1);
      return { from, to: now, bucket: 'day' };
    }
    case AnalyticsPeriod.LAST_6_MONTHS: {
      const from = new Date(now);
      from.setMonth(from.getMonth() - 6);
      return { from, to: now, bucket: 'week' };
    }
    case AnalyticsPeriod.ALL_TIME:
      return { from: null, to: now, bucket: 'month' };
  }
}
