'use client';

import { useQuery } from '@apollo/client/react';
import { ChartCard } from '@/components/admin/analytics/ChartCard';
import { TimeSeriesChart } from '@/components/admin/analytics/TimeSeriesChart';
import { TopWishlistedChart } from '@/components/admin/analytics/TopWishlistedChart';
import {
  GET_REGISTRATIONS_OVER_TIME,
  type RegistrationsOverTimeResponse,
} from '@/lib/graphql/queries/admin-dashboard';
import {
  GET_ACTIVE_USERS_OVER_TIME,
  GET_MESSAGES_OVER_TIME,
  GET_FOLLOWS_OVER_TIME,
  GET_TOP_PRODUCTS_BY_WISHLIST_ADDS,
  type ActiveUsersOverTimeResponse,
  type MessagesOverTimeResponse,
  type FollowsOverTimeResponse,
  type TopProductsByWishlistAddsResponse,
} from '@/lib/graphql/queries/admin-analytics';

const PERIOD = 'LAST_MONTH';

export default function AdminAnalyticsPage() {
  const registrations = useQuery<RegistrationsOverTimeResponse>(GET_REGISTRATIONS_OVER_TIME, {
    variables: { period: PERIOD },
  });
  const activeUsers = useQuery<ActiveUsersOverTimeResponse>(GET_ACTIVE_USERS_OVER_TIME, {
    variables: { period: PERIOD },
  });
  const messages = useQuery<MessagesOverTimeResponse>(GET_MESSAGES_OVER_TIME, {
    variables: { period: PERIOD },
  });
  const follows = useQuery<FollowsOverTimeResponse>(GET_FOLLOWS_OVER_TIME, {
    variables: { period: PERIOD },
  });
  const topWishlisted = useQuery<TopProductsByWishlistAddsResponse>(
    GET_TOP_PRODUCTS_BY_WISHLIST_ADDS,
    { variables: { period: PERIOD, limit: 5 } },
  );

  const registrationsData = registrations.data?.registrationsOverTime ?? [];
  const activeUsersData = activeUsers.data?.activeUsersOverTime ?? [];
  const messagesData = messages.data?.messagesOverTime ?? [];
  const followsData = follows.data?.followsOverTime ?? [];
  const topWishlistedData = topWishlisted.data?.topProductsByWishlistAdds ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-ui-label text-text-muted uppercase tracking-widest">
            Business Intelligence
          </p>
          <h1 className="text-h2 font-bold">Analytics</h1>
        </div>
        <span className="text-ui-label text-text-muted uppercase tracking-widest">
          Last 30 days
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Registrations"
          loading={registrations.loading}
          error={!!registrations.error}
          isEmpty={registrationsData.length === 0}
          onRetry={() => registrations.refetch()}
        >
          <TimeSeriesChart
            data={registrationsData}
            color="#3d7a5e"
            seriesName="Registrations"
            gradientId="registrationsFill"
          />
        </ChartCard>

        <ChartCard
          title="Active Users"
          loading={activeUsers.loading}
          error={!!activeUsers.error}
          isEmpty={activeUsersData.length === 0}
          onRetry={() => activeUsers.refetch()}
        >
          <TimeSeriesChart
            data={activeUsersData}
            color="#2c2420"
            seriesName="Active users"
            gradientId="activeUsersFill"
          />
        </ChartCard>

        <ChartCard
          title="Messages"
          loading={messages.loading}
          error={!!messages.error}
          isEmpty={messagesData.length === 0}
          onRetry={() => messages.refetch()}
        >
          <TimeSeriesChart
            data={messagesData}
            color="#dc9b9b"
            seriesName="Messages"
            gradientId="messagesFill"
          />
        </ChartCard>

        <ChartCard
          title="New Follows"
          loading={follows.loading}
          error={!!follows.error}
          isEmpty={followsData.length === 0}
          onRetry={() => follows.refetch()}
        >
          <TimeSeriesChart
            data={followsData}
            color="#4a4540"
            seriesName="Follows"
            gradientId="followsFill"
          />
        </ChartCard>
      </div>

      <ChartCard
        title="Top Products by Wishlist Adds"
        loading={topWishlisted.loading}
        error={!!topWishlisted.error}
        isEmpty={topWishlistedData.length === 0}
        onRetry={() => topWishlisted.refetch()}
      >
        <TopWishlistedChart data={topWishlistedData} />
      </ChartCard>
    </div>
  );
}
