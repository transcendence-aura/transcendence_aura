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
  sm: { container: 'h-[26px] w-[26px]', text: 'text-[10px]', dot: 'h-2 w-2' },
  md: { container: 'h-[36px] w-[36px]', text: 'text-xs', dot: 'h-2.5 w-2.5' },
  lg: { container: 'h-[72px] w-[72px]', text: 'text-xl', dot: 'h-3.5 w-3.5' },
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
  const [hasError, setHasError] = useState(false);
  const sizeConfig = SIZES[size];
  const initials = getInitials(name);

  const isImageValid = Boolean(src) && !hasError;

  return (
    <div className={`relative inline-flex shrink-0 ${sizeConfig.container} ${className}`}>
      <div
        className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-zinc-900 border border-black/10 dark:bg-zinc-800 dark:text-zinc-100 dark:border-white/10 ${sizeConfig.text} font-medium select-none`}
      >
        {isImageValid && src ? (
          <Image
            src={src}
            alt={alt || name}
            fill
            onError={() => setHasError(true)}
            className="object-cover"
            unoptimized // Optionnel : évite la dépendance à un serveur d'optimisation si URLs externes
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {showOnlineDot && (
        <span
          className={`bg-brand-accent absolute bottom-0 right-0 rounded-full ring-2 ring-white dark:ring-black rtl:right-auto rtl:left-0 ${sizeConfig.dot}`}
        />
      )}
    </div>
  );
};
