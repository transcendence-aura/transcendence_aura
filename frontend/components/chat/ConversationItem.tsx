import { Avatar } from '@/components/ui/display/avatar';

interface ConversationItemProps {
  name: string;
  avatarUrl?: string;
  lastMessage: string;
  timeLabel: string;
  isUnread?: boolean;
  isOnline?: boolean;
  isActive?: boolean;
  onClick?: () => void;
}

export const ConversationItem = ({
  name,
  avatarUrl,
  lastMessage,
  timeLabel,
  isUnread = false,
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
        {isUnread && (
          <span className="h-2 w-2 rounded-full bg-brand-dark" role="status" aria-label="Unread" />
        )}
      </div>
    </button>
  );
};
