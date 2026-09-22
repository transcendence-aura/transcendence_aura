'use client';

import { useState } from 'react';
import type { ApolloCache } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useToast } from '@/components/ui/feedback/toast';
import {
  FOLLOW_USER_MUTATION,
  PUBLIC_PROFILE_QUERY,
  UNFOLLOW_USER_MUTATION,
  type PublicProfile,
} from '@/lib/graphql/queries/profile';
import { TEXT_BUTTON } from '@/lib/typography';

interface FollowButtonProps {
  targetUserId: string;
  handle: string;
  isFollowing: boolean;
  isAuthenticated: boolean;
}

export function FollowButton({
  targetUserId,
  handle,
  isFollowing,
  isAuthenticated,
}: FollowButtonProps) {
  const t = useTranslations('ProfileHeader');
  const { toast } = useToast();
  const [pending, setPending] = useState(false);
  const [followUser] = useMutation(FOLLOW_USER_MUTATION);
  const [unfollowUser] = useMutation(UNFOLLOW_USER_MUTATION);

  if (!isAuthenticated) {
    return (
      <Link
        href={`/login?returnTo=${encodeURIComponent(`/profile/${handle}`)}`}
        className={`inline-block w-fit ${TEXT_BUTTON} text-text-inverse bg-brand-dark hover:bg-brand-darker px-3 py-1.5 transition-colors`}
      >
        {t('logInToFollow')}
      </Link>
    );
  }

  const updateCache = (cache: ApolloCache) => {
    const existing = cache.readQuery<{ userProfile: PublicProfile }>({
      query: PUBLIC_PROFILE_QUERY,
      variables: { handle },
    });
    if (!existing) return;

    cache.writeQuery({
      query: PUBLIC_PROFILE_QUERY,
      variables: { handle },
      data: {
        userProfile: {
          ...existing.userProfile,
          isFollowing: !isFollowing,
          followersCount: existing.userProfile.followersCount + (isFollowing ? -1 : 1),
        },
      },
    });
  };

  const handleToggle = async () => {
    if (pending) return;
    setPending(true);

    try {
      if (isFollowing) {
        await unfollowUser({
          variables: { input: { targetUserId } },
          optimisticResponse: { unfollowUser: true },
          update: updateCache,
        });
      } else {
        await followUser({
          variables: { input: { targetUserId } },
          optimisticResponse: { followUser: true },
          update: updateCache,
        });
      }
    } catch {
      toast({ message: t('followFailed'), variant: 'error' });
    } finally {
      setPending(false);
    }
  };

  return (
    <span
      role="button"
      tabIndex={pending ? -1 : 0}
      aria-pressed={isFollowing}
      aria-disabled={pending}
      onClick={handleToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleToggle();
        }
      }}
      className={`inline-block w-fit cursor-pointer select-none ${TEXT_BUTTON} px-3 py-1.5 transition-colors ${
        isFollowing
          ? 'text-text-muted hover:text-status-error border border-border-default'
          : 'text-text-inverse bg-brand-dark hover:bg-brand-darker'
      } ${pending ? 'pointer-events-none opacity-60' : ''}`}
    >
      {isFollowing ? t('followingAction') : t('follow')}
    </span>
  );
}
