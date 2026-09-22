'use client';

import { use } from 'react';
import { useQuery } from '@apollo/client/react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Avatar } from '@/components/ui/display/avatar';
import { Skeleton } from '@/components/ui/feedback/skeleton';
import { Button } from '@/components/ui/form/button';
import { ProductCard } from '@/components/cards/ProductCard';
import { useIsAuthenticated } from '@/lib/auth/use-is-authenticated';
import { ME_QUERY } from '@/lib/graphql/queries/me';
import { PUBLIC_PROFILE_QUERY } from '@/lib/graphql/queries/profile';
import { ProfileHeader, ProfileHeaderSkeleton } from '@/components/profile/ProfileHeader';
import { FollowButton } from '@/components/profile/FollowButton';
import { TEXT_SUBTITLE } from '@/lib/typography';

interface PublicProfilePageProps {
  params: Promise<{ handle: string }>;
}

export default function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { handle } = use(params);
  const t = useTranslations('PublicProfile');
  const isAuthenticated = useIsAuthenticated();

  const { data: meData } = useQuery(ME_QUERY, { skip: !isAuthenticated });
  const { data, loading, error, refetch } = useQuery(PUBLIC_PROFILE_QUERY, {
    variables: { handle },
  });

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-3xl">
        <ProfileHeaderSkeleton />
        <div className="flex flex-col gap-4 px-6 py-8 md:px-8">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12 text-center md:px-8">
        <p className="text-body-base text-text-muted mb-6">{t('notFound')}</p>
        <Button onClick={() => refetch()} className="px-6 py-3">
          {t('tryAgain')}
        </Button>
      </div>
    );
  }

  const profile = data.userProfile;
  const isOwnProfile = meData?.me.handle === profile.handle;

  return (
    <div className="mx-auto max-w-3xl">
      <ProfileHeader
        name={profile.name}
        handle={profile.handle}
        bio={profile.bio}
        followingCount={profile.followingCount}
        followersCount={profile.followersCount}
        avatar={<Avatar name={profile.name} src={`/api/v1/users/${profile.id}/avatar`} size="lg" />}
        status={
          !isOwnProfile && (
            <FollowButton
              targetUserId={profile.id}
              handle={profile.handle}
              isFollowing={profile.isFollowing}
            />
          )
        }
      />

      <div className="flex flex-col gap-8 px-6 py-8 md:px-8">
        {profile.recentFollows.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className={`text-text-primary ${TEXT_SUBTITLE}`}>{t('recentlyFollowed')}</h2>
            <div className="flex flex-col gap-3">
              {profile.recentFollows.map((followed) => (
                <Link
                  key={followed.id}
                  href={`/profile/${followed.handle}`}
                  className="hover:bg-page flex items-center gap-3 rounded p-2 transition-colors"
                >
                  <Avatar name={followed.name} size="sm" />
                  <div className="flex flex-col">
                    <span className="text-body-sm text-text-primary">{followed.name}</span>
                    <span className="text-[11px] text-text-muted">@{followed.handle}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {profile.recentWishlistAdds.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className={`text-text-primary ${TEXT_SUBTITLE}`}>{t('recentlyAdded')}</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {profile.recentWishlistAdds.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {profile.recentFollows.length === 0 && profile.recentWishlistAdds.length === 0 && (
          <p className="text-body-sm text-text-muted text-center py-8">{t('noActivity')}</p>
        )}
      </div>
    </div>
  );
}
