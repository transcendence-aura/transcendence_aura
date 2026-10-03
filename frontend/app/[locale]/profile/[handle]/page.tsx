'use client';

import { use } from 'react';
import { ProfileContent } from '@/components/profile/ProfileContent';

interface PublicProfilePageProps {
  params: Promise<{ handle: string }>;
}

export default function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { handle } = use(params);

  return (
    <div className="mx-auto max-w-3xl">
      <ProfileContent handle={handle} />
    </div>
  );
}
