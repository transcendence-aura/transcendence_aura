import { gql } from '@apollo/client';

export type AnalyticsPeriod = 'TODAY' | 'LAST_WEEK' | 'LAST_MONTH' | 'LAST_6_MONTHS' | 'ALL_TIME';

export interface AnalyticsTimeSeriesPoint {
  bucket: string;
  count: number;
}

export interface RegistrationsOverTimeResponse {
  registrationsOverTime: AnalyticsTimeSeriesPoint[];
}

export const GET_REGISTRATIONS_OVER_TIME = gql`
  query RegistrationsOverTime($period: AnalyticsPeriod!) {
    registrationsOverTime(period: $period) {
      bucket
      count
    }
  }
`;
