import type { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton = ({ className = '', ...props }: SkeletonProps) => {
  return (
    <div
      role="status"
      aria-label="Loading..."
      className={`animate-pulse rounded-none bg-border-default/20 ${className}`}
      {...props}
    />
  );
};
