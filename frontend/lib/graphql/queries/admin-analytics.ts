import { gql } from '@apollo/client';
import type { AnalyticsTimeSeriesPoint } from './admin-dashboard';

export interface TopWishlistedProduct {
  productId: string;
  name: string;
  slug: string;
  wishlistAdds: number;
}

export interface MessagesOverTimeResponse {
  messagesOverTime: AnalyticsTimeSeriesPoint[];
}

export interface FollowsOverTimeResponse {
  followsOverTime: AnalyticsTimeSeriesPoint[];
}

export interface ActiveUsersOverTimeResponse {
  activeUsersOverTime: AnalyticsTimeSeriesPoint[];
}

export interface TopProductsByWishlistAddsResponse {
  topProductsByWishlistAdds: TopWishlistedProduct[];
}

export const GET_MESSAGES_OVER_TIME = gql`
  query MessagesOverTime($period: AnalyticsPeriod!) {
    messagesOverTime(period: $period) {
      bucket
      count
    }
  }
`;

export const GET_FOLLOWS_OVER_TIME = gql`
  query FollowsOverTime($period: AnalyticsPeriod!) {
    followsOverTime(period: $period) {
      bucket
      count
    }
  }
`;

export const GET_ACTIVE_USERS_OVER_TIME = gql`
  query ActiveUsersOverTime($period: AnalyticsPeriod!) {
    activeUsersOverTime(period: $period) {
      bucket
      count
    }
  }
`;

export const GET_TOP_PRODUCTS_BY_WISHLIST_ADDS = gql`
  query TopProductsByWishlistAdds($period: AnalyticsPeriod!, $limit: Int) {
    topProductsByWishlistAdds(period: $period, limit: $limit) {
      productId
      name
      slug
      wishlistAdds
    }
  }
`;
