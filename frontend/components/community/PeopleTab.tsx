'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { useTranslations } from 'next-intl';
import { Avatar } from '@/components/ui/display/avatar';
import { Input } from '@/components/ui/form/input';
import { Skeleton } from '@/components/ui/feedback/skeleton';
import { Button } from '@/components/ui/form/button';
import { Dialog } from '@/components/ui/overlay/dialog';
import { ProfileContent } from '@/components/profile/ProfileContent';
import { MessageButton } from '@/components/profile/MessageButton';
import { useIsAuthenticated } from '@/lib/auth/use-is-authenticated';
import { PROFILE_DIRECTORY_QUERY } from '@/lib/graphql/queries/profile';

const PAGE_SIZE = 20;

export function PeopleTab() {
  const t = useTranslations('PeopleDirectory');
  const isAuthenticated = useIsAuthenticated();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedHandle, setSelectedHandle] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery(PROFILE_DIRECTORY_QUERY, {
    variables: { input: { page, limit: PAGE_SIZE, search: search || undefined } },
    fetchPolicy: 'cache-and-network',
  });

  const items = data?.profileDirectory.items ?? [];
  const hasNextPage = data?.profileDirectory.hasNextPage ?? false;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div>
      <Input
        placeholder={t('searchPlaceholder')}
        value={search}
        onChange={(e) => handleSearchChange(e.target.value)}
        className="mb-6"
      />

      {loading && items.length === 0 && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {error && items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-body-base text-text-muted mb-6">{t('failedToLoad')}</p>
          <Button onClick={() => refetch()} className="px-6 py-3">
            {t('tryAgain')}
          </Button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="text-body-sm text-text-muted text-center py-12">{t('empty')}</p>
      )}

      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          {items.map((person) => (
            <div
              key={person.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedHandle(person.handle)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedHandle(person.handle);
                }
              }}
              className="hover:bg-page flex cursor-pointer items-center gap-3 rounded p-3 transition-colors"
            >
              <Avatar name={person.name} src={`/api/v1/users/${person.id}/avatar`} size="md" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-body-sm text-text-primary">{person.name}</span>
                <span className="text-[11px] text-text-muted">@{person.handle}</span>
                {person.bio && (
                  <span className="text-[11px] text-text-muted line-clamp-1">{person.bio}</span>
                )}
              </div>
              {isAuthenticated && <MessageButton targetUserId={person.id} />}
            </div>
          ))}
        </div>
      )}

      {(page > 1 || hasNextPage) && items.length > 0 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2"
          >
            {t('previous')}
          </Button>
          <Button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNextPage}
            className="px-4 py-2"
          >
            {t('next')}
          </Button>
        </div>
      )}

      <Dialog
        isOpen={selectedHandle !== null}
        onClose={() => setSelectedHandle(null)}
        title={selectedHandle ?? ''}
        side="right"
        hideHeader
      >
        {selectedHandle && <ProfileContent handle={selectedHandle} />}
      </Dialog>
    </div>
  );
}
