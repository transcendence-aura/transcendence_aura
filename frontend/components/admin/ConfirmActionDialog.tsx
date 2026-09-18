'use client';

import { Dialog } from '@/components/ui/overlay/dialog';
import { Button } from '@/components/ui/form/button';

interface ConfirmActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  loading?: boolean;
}

export function ConfirmActionDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  loading = false,
}: ConfirmActionDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title} description={description}>
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="text-ui-button bg-status-error cursor-pointer rounded-none px-6 py-3 uppercase text-text-inverse transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? 'Please wait...' : confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
