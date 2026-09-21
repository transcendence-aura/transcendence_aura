'use client';

import type { ChangeEvent, RefObject } from 'react';
import { Camera } from 'lucide-react';
import { Avatar } from '@/components/ui/display/avatar';

interface AvatarPickerProps {
  name: string;
  src?: string;
  isBusy: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onPick: () => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

// The avatar is the button: clicking it opens the image picker.
export function AvatarPicker({
  name,
  src,
  isBusy,
  inputRef,
  onPick,
  onFileChange,
}: AvatarPickerProps) {
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={onPick}
        disabled={isBusy}
        aria-label="Change photo"
        className="group focus-visible:outline-border-focus relative flex w-fit cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed"
      >
        {/* New key when the source changes: the Avatar remembers a failed load otherwise. */}
        <Avatar key={src} name={name} src={src} size="lg" />
        <span
          aria-hidden="true"
          className="bg-brand-dark/50 text-text-inverse absolute inset-0 flex items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          <Camera className="h-5 w-5" />
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
      />
    </div>
  );
}
