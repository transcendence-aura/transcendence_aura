import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Avatar } from '@/components/ui/display/avatar';
import { ProductCard } from '@/components/cards/ProductCard';
import { formatRelativeTime } from '@/lib/format-relative-time';
import type { CircleFeedItem } from '@/lib/graphql/queries/circle-feed';

interface FeedItemProps {
  item: CircleFeedItem;
}

export function FeedItem({ item }: FeedItemProps) {
  const t = useTranslations('CircleFeed');

  const text =
    item.type === 'NEW_FOLLOW'
      ? item.followedUser
        ? t('newFollow', { actor: item.actor.name, followedUser: item.followedUser.name })
        : t('newFollowFallback', { actor: item.actor.name })
      : t('wishlistAdded', { actor: item.actor.name });

  return (
    <div className="border-border-default flex gap-3 border-b px-4 py-4 last:border-b-0">
      <Link href={`/profile/${item.actor.handle}`} className="shrink-0">
        <Avatar name={item.actor.name} size="md" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-body-sm text-text-primary">{text}</span>
          <span className="shrink-0 text-[9px] leading-[1.5] tracking-[0.06em] text-text-muted">
            {formatRelativeTime(item.createdAt, t('now'))}
          </span>
        </div>
        {item.type === 'WISHLIST_ITEM_ADDED' && item.product && (
          <ProductCard product={item.product} className="max-w-xs" />
        )}
      </div>
    </div>
  );
}
