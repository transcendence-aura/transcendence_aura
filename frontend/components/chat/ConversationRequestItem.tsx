import { Check, X } from 'lucide-react';
import { Avatar } from '@/components/ui/display/avatar';

interface ConversationRequestItemProps {
  name: string;
  avatarUrl?: string;
  onClick?: () => void;
  onAccept: () => void;
  onDecline: () => void;
}

export const ConversationRequestItem = ({
  name,
  avatarUrl,
  onClick,
  onAccept,
  onDecline,
}: ConversationRequestItemProps) => {
  return (
    <div className="flex w-full items-center gap-3 px-4 py-3">
      <button type="button" onClick={onClick} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={name} src={avatarUrl} size="sm" />
        <span className="truncate text-xs leading-[1.8] font-medium text-text-primary">{name}</span>
      </button>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          aria-label="Accept"
          onClick={onAccept}
          className="text-status-online hover:opacity-70"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Decline"
          onClick={onDecline}
          className="text-status-error hover:opacity-70"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
