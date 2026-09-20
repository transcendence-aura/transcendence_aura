import { Button } from '@/components/ui/form/button';

interface PendingConversationBarProps {
  isInitiator: boolean;
  otherName: string;
  onAccept: () => void;
  onDecline: () => void;
}

export const PendingConversationBar = ({
  isInitiator,
  otherName,
  onAccept,
  onDecline,
}: PendingConversationBarProps) => {
  if (isInitiator) {
    return (
      <div className="border-t border-border-default p-4 text-center">
        <p className="text-xs leading-[1.8] font-light text-text-muted">
          Waiting for {otherName} to accept your message.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 border-t border-border-default p-4">
      <p className="text-xs leading-[1.8] font-light text-text-secondary">
        {otherName} wants to send you a message.
      </p>
      <div className="flex shrink-0 gap-2">
        <Button variant="ghost" onClick={onDecline}>
          Decline
        </Button>
        <Button onClick={onAccept}>Accept</Button>
      </div>
    </div>
  );
};
