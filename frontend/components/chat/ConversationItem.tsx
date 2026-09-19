import { Avatar } from '@/components/ui/display/avatar';

interface ConversationItemProps {
  name: string;
  avatarUrl?: string;
  lastMessage: string;
  timeLabel: string;
  unreadCount?: number;
  isOnline?: boolean;
  isActive?: boolean;
  onClick?: () => void;
}

export const ConversationItem = ({
  name,
  avatarUrl,
  lastMessage,
  timeLabel,
  unreadCount = 0,
  isOnline = false,
  isActive = false,
  onClick,
}: ConversationItemProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
        isActive ? 'bg-subtle' : 'hover:bg-page'
      }`}
    >
      <Avatar name={name} src={avatarUrl} size="sm" showOnlineDot={isOnline} />

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-xs leading-[1.8] font-medium text-text-primary">{name}</span>
        <span className="truncate text-[11px] leading-[1.7] font-light text-text-secondary">
          {lastMessage}
        </span>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-[9px] leading-[1.5] font-light tracking-[0.06em] text-text-muted">
          {timeLabel}
        </span>
        {unreadCount > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-dark px-1 text-[8px] font-medium tracking-[0.08em] text-text-inverse">
            {unreadCount}
          </span>
        )}
      </div>
    </button>
  );
};
