import { X } from 'lucide-react';
import { Avatar } from '@/components/ui/display/avatar';

interface ProfilePanelProps {
  name: string;
  avatarUrl?: string;
  onClose: () => void;
}

export const ProfilePanel = ({ name, avatarUrl, onClose }: ProfilePanelProps) => {
  return (
    <div className="flex w-72 shrink-0 flex-col border-l border-border-default">
      <div className="flex items-center justify-between border-b border-border-default p-4">
        <span className="text-xs leading-[1.8] font-medium text-text-primary">Profile</span>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="text-text-secondary hover:text-text-primary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col items-center gap-3 p-6">
        <Avatar name={name} src={avatarUrl} size="lg" />
        <span
          className="text-[22px] leading-[1.3] text-text-primary"
          style={{ fontFamily: 'var(--font-family-cormorant)' }}
        >
          {name}
        </span>
      </div>
    </div>
  );
};
