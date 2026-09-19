import { useRealtime } from '@/lib/realtime/realtime-provider';

interface RealtimeStatusDotProps {
  className?: string;
}

export const RealtimeStatusDot = ({ className = '' }: RealtimeStatusDotProps) => {
  const { connectionState } = useRealtime();

  if (connectionState !== 'connecting') {
    return null;
  }

  return (
    <span
      className={`bg-amber-500 absolute -top-1 -right-1 h-2.5 w-2.5 animate-pulse rounded-full ${className}`}
      role="status"
      aria-label="Reconnecting..."
    />
  );
};
