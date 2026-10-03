'use client';

import { useState } from 'react';
import Image from 'next/image';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  name: string;
  src?: string;
  alt?: string;
  size?: AvatarSize;
  showOnlineDot?: boolean;
  className?: string;
}

const SIZES: Record<AvatarSize, { container: string; text: string; dot: string }> = {
  sm: { container: 'h-6 w-6', text: 'text-ui-label', dot: 'h-2 w-2' },
  md: { container: 'h-9 w-9', text: 'text-body-sm', dot: 'h-2.5 w-2.5' },
  lg: { container: 'h-16 w-16', text: 'text-body-lg', dot: 'h-3 w-3' },
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const Avatar = ({
  src,
  alt = '',
  name,
  size = 'md',
  showOnlineDot = false,
  className = '',
}: AvatarProps) => {
  // Tracks which src failed, not just whether one did - so a later src (e.g. after
  // uploading a first avatar) is retried instead of being stuck on initials forever.
  const [erroredSrc, setErroredSrc] = useState<string | undefined>(undefined);
  const sizeConfig = SIZES[size];
  const initials = getInitials(name);

  const isImageValid = Boolean(src) && src !== erroredSrc;

  return (
    <div className={`relative inline-flex shrink-0 ${sizeConfig.container} ${className}`}>
      <div
        className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-page text-text-primary border border-border-default ${sizeConfig.text} font-medium select-none`}
      >
        {isImageValid && src ? (
          <Image
            src={src}
            alt={alt || name}
            fill
            unoptimized
            onError={() => setErroredSrc(src)}
            className="object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {showOnlineDot && (
        <span
          className={`bg-status-online absolute bottom-0 right-0 rounded-full ring-2 ring-card rtl:right-auto rtl:left-0 ${sizeConfig.dot}`}
        />
      )}
    </div>
  );
};
