'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@apollo/client/react';
import { Progress } from '@/components/ui/feedback/progress';
import { useIsAuthenticated } from '@/lib/auth/use-is-authenticated';
import { useAvatarUpload } from '@/lib/hooks/useAvatarUpload';
import { ME_QUERY } from '@/lib/graphql/queries/me';
import { PROFILE_COUNTS_QUERY } from '@/lib/graphql/queries/profile';
import { AvatarPicker } from './AvatarPicker';
import { ProfileHeader, ProfileHeaderSkeleton } from './ProfileHeader';

// The header of the /settings page: the signed-in user's profile, with a way to change the avatar.
export function ProfileHeaderSection() {
  const t = useTranslations('AvatarUpload');
  const isAuthenticated = useIsAuthenticated();
  // The same `me` query as the form below: Apollo serves both from one request.
  const { data: meData, error: meError } = useQuery(ME_QUERY, { skip: !isAuthenticated });
  const me = meData?.me;
  const { data: countsData } = useQuery(PROFILE_COUNTS_QUERY, {
    skip: !me,
    variables: { handle: me?.handle ?? '' },
  });
  const { avatarSrc, progress, isBusy, error, inputRef, openPicker, handleFileChange } =
    useAvatarUpload(me?.id);

  // If `me` fails to load, the form below already shows the error and a retry button.
  if (meError) return null;

  if (!me) {
    return <ProfileHeaderSkeleton />;
  }

  return (
    <ProfileHeader
      name={me.name}
      handle={me.handle}
      bio={me.bio}
      followingCount={countsData?.userProfile.followingCount}
      followersCount={countsData?.userProfile.followersCount}
      avatar={
        <AvatarPicker
          name={me.name}
          src={avatarSrc}
          isBusy={isBusy}
          inputRef={inputRef}
          onPick={openPicker}
          onFileChange={handleFileChange}
        />
      }
      status={
        <>
          {progress !== null && (
            <Progress value={progress} label={t('uploading')} className="max-w-56" />
          )}
          {error && (
            <p role="alert" className="text-status-error text-body-sm">
              {error}
            </p>
          )}
        </>
      }
    />
  );
}
