import type { ReactNode } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/feedback/skeleton';
import { TEXT_BODY_SM, TEXT_LABEL, TEXT_STAT, TEXT_SUBTITLE } from '@/lib/typography';

interface ProfileHeaderProps {
  name: string;
  handle: string;
  bio?: string | null;
  // Left out until the counts are known.
  followingCount?: number;
  followersCount?: number;
  // The avatar (or a picker around it), and anything to show under the counts (upload progress...).
  avatar: ReactNode;
  status?: ReactNode;
}

function Stat({ value, label }: { value: number; label: string }) {
  const format = useFormatter();

  return (
    <p className="flex items-baseline gap-2">
      <span className={`text-text-primary ${TEXT_STAT}`}>{format.number(value)}</span>
      <span className={`text-text-muted ${TEXT_LABEL}`}>{label}</span>
    </p>
  );
}

// Reusable: the public profile page can render it with its own avatar and actions.
export function ProfileHeader({
  name,
  handle,
  bio,
  followingCount,
  followersCount,
  avatar,
  status,
}: ProfileHeaderProps) {
  const t = useTranslations('ProfileHeader');
  const hasCounts = followingCount !== undefined && followersCount !== undefined;

  return (
    <header className="bg-surface border-border-default border-b px-6 py-8 md:px-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
        {avatar}

        <div className="flex min-w-0 flex-col gap-2">
          <p className={`text-text-primary ${TEXT_SUBTITLE}`}>{name}</p>
          <p className={`text-text-secondary line-clamp-2 ${TEXT_BODY_SM}`}>
            @{handle}
            {bio ? ` · ${bio}` : ''}
          </p>

          {hasCounts && (
            <div className="flex items-center gap-4">
              <Stat value={followingCount} label={t('following')} />
              <span aria-hidden="true" className="bg-border-default h-4 w-px" />
              <Stat value={followersCount} label={t('followers')} />
            </div>
          )}

          {status}
        </div>
      </div>
    </header>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <div className="bg-surface border-border-default border-b px-6 py-8 md:px-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
        <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-6 w-56" />
        </div>
      </div>
    </div>
  );
}
