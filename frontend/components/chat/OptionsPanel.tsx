import { Ban, BellOff, Trash2, X } from 'lucide-react';

interface OptionsPanelProps {
  onClose: () => void;
}

const OPTIONS = [
  { label: 'Mute conversation', icon: BellOff },
  { label: 'Block user', icon: Ban },
  { label: 'Delete conversation', icon: Trash2 },
];

export const OptionsPanel = ({ onClose }: OptionsPanelProps) => {
  return (
    <div className="flex w-72 shrink-0 flex-col border-l border-border-default">
      <div className="flex items-center justify-between border-b border-border-default p-4">
        <span className="text-xs leading-[1.8] font-medium text-text-primary">Options</span>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="text-text-secondary hover:text-text-primary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col p-2">
        {OPTIONS.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-left text-text-secondary hover:bg-page hover:text-text-primary"
          >
            <Icon className="h-4 w-4" />
            <span className="text-xs leading-[1.8] font-light">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
