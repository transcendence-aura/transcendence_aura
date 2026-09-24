'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApolloClient, useQuery } from '@apollo/client/react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useIsAuthenticated } from '@/lib/auth/use-is-authenticated';
import { useRealtime } from '@/lib/realtime/realtime-provider';
import { Skeleton } from '@/components/ui/feedback/skeleton';
import { Button } from '@/components/ui/form/button';
import { CIRCLE_FEED_QUERY, type CircleFeedItem } from '@/lib/graphql/queries/circle-feed';
import { FeedItem } from '@/components/community/FeedItem';
import { PeopleTab } from '@/components/community/PeopleTab';
import { MessageTab } from '@/components/community/MessageTab';
import { Tabs } from '@/components/ui/display/tabs';

// Caps how many live-pushed items can pile up before the next fetch/refetch
// folds them into `data` - without this, a tab left open for a while would
// grow `liveItems` forever.
const MAX_LIVE_ITEMS = 50;
const PAGE_SIZE = 20;

type Tab = 'activity' | 'people' | 'message';

export default function CommunityPage() {
  const isAuthenticated = useIsAuthenticated();
  const t = useTranslations('CircleFeed');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { on } = useRealtime();
  const client = useApolloClient();
  const [liveItems, setLiveItems] = useState<CircleFeedItem[]>([]);
  const [olderItems, setOlderItems] = useState<CircleFeedItem[]>([]);
  const [page, setPage] = useState(1);
  const [nextPageOverride, setNextPageOverride] = useState<boolean | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [manualTab, setManualTab] = useState<Tab | null>(null);
  // A `?tab=` param (e.g. a MESSAGE notification's link, or the People list's Message button)
  // always wins over it - read straight from the URL every render (not just on mount) so
  // navigating here while already on the page also switches the tab, not just the URL.
  const requestedTab = searchParams.get('tab');

  const { data, loading, error, refetch } = useQuery(CIRCLE_FEED_QUERY, {
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network',
    variables: { pagination: { page: 1, limit: PAGE_SIZE } },
  });

  useEffect(() => {
    return on('circleFeedActivity', (...args) => {
      const item = args[0] as CircleFeedItem;
      setLiveItems((prev) =>
        prev.some((existing) => existing.id === item.id)
          ? prev
          : [item, ...prev].slice(0, MAX_LIVE_ITEMS),
      );
    });
  }, [on]);

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const { data: more } = await client.query({
        query: CIRCLE_FEED_QUERY,
        variables: { pagination: { page: nextPage, limit: PAGE_SIZE } },
        fetchPolicy: 'network-only',
      });
      if (!more) return;
      setOlderItems((prev) => [...prev, ...more.circleFeed.items]);
      setNextPageOverride(more.circleFeed.hasNextPage);
      setPage(nextPage);
    } finally {
      setLoadingMore(false);
    }
  };

  const fetchedItems = data?.circleFeed.items ?? [];
  const items = [
    ...liveItems.filter((item) => !fetchedItems.some((f) => f.id === item.id)),
    ...fetchedItems,
    ...olderItems,
  ];
  const hasNextPage = nextPageOverride ?? data?.circleFeed.hasNextPage ?? false;

  const tab: Tab =
    requestedTab === 'activity' || requestedTab === 'people' || requestedTab === 'message'
      ? requestedTab
      : (manualTab ?? (fetchedItems.length === 0 ? 'people' : 'activity'));

  const previousTabRef = useRef<Tab | null>(null);
  useEffect(() => {
    if (tab === 'activity' && previousTabRef.current !== null && previousTabRef.current !== tab) {
      refetch();
    }
    previousTabRef.current = tab;
  }, [tab, refetch]);

  if (loading && requestedTab === null && manualTab === null && items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12 md:px-8">
        <div className="flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 md:px-8">
      <Tabs
        className="mb-8"
        items={[
          { id: 'activity', label: t('activityTab') },
          { id: 'people', label: t('peopleTab') },
          { id: 'message', label: t('messageTab') },
        ]}
        activeId={tab}
        onChange={(id) => {
          setManualTab(id as Tab);
          router.replace(`/community?tab=${id}`, { scroll: false });
        }}
      />

      {tab === 'people' ? (
        <PeopleTab />
      ) : tab === 'message' ? (
        <MessageTab />
      ) : error && items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-body-base text-text-muted mb-6">{t('failedToLoad')}</p>
          <Button onClick={() => refetch()} className="px-6 py-3">
            {t('tryAgain')}
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-body-base text-text-muted mb-6">{t('empty')}</p>
          <Link
            href="/catalogue"
            className="bg-brand-dark text-text-inverse hover:bg-brand-darker inline-block rounded px-6 py-3 text-xs font-medium uppercase transition-colors"
          >
            {t('emptyCta')}
          </Link>
        </div>
      ) : (
        <div className="border-border-default border-t">
          {items.map((item) => (
            <FeedItem key={item.id} item={item} />
          ))}
          {hasNextPage && (
            <div className="flex justify-center py-8">
              <Button onClick={handleLoadMore} disabled={loadingMore} className="px-6 py-3">
                {t('loadMore')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
