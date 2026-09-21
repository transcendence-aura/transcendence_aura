'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useToast } from '@/components/ui/feedback/toast';
import { AvatarImageError, cropToSquareJpeg } from '@/lib/avatar/crop-to-square-jpeg';
import { AvatarUploadError, uploadAvatar } from '@/lib/avatar/upload-avatar';

function getImageErrorMessage(error: unknown): string {
  if (error instanceof AvatarImageError && error.code === 'NOT_AN_IMAGE') {
    return 'Please choose an image file.';
  }
  return 'This image could not be read. Try another one.';
}

function getUploadErrorMessage(error: unknown): string {
  if (!(error instanceof AvatarUploadError)) return 'Upload failed. Please try again.';
  if (error.status === 401) return 'Your session has expired. Please sign in again.';
  if (error.code === 'NETWORK_ERROR') {
    return 'Network error. Check your connection and try again.';
  }
  if (['IMAGE_TYPE_NOT_ALLOWED', 'IMAGE_MUST_BE_SQUARE', 'FILE_TOO_LARGE'].includes(error.code)) {
    return 'This image cannot be used as an avatar. Try another one.';
  }
  return 'Upload failed. Please try again.';
}

export function useAvatarUpload(userId: string | undefined) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  // The cropped image, shown as a preview during the upload and kept once it succeeded.
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  // null when idle, otherwise the upload progress in percent.
  const [progress, setProgress] = useState<number | null>(null);
  // True from the moment a file is chosen (cropping included) until the upload is over.
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!localUrl) return;
    return () => URL.revokeObjectURL(localUrl);
  }, [localUrl]);

  const openPicker = () => inputRef.current?.click();

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset so that choosing the same file again still triggers a change.
    event.target.value = '';
    if (!file || isBusy) return;

    setIsBusy(true);
    setError(null);

    try {
      let image: Blob;
      try {
        image = await cropToSquareJpeg(file);
      } catch (imageError) {
        setError(getImageErrorMessage(imageError));
        return;
      }

      setLocalUrl(URL.createObjectURL(image));
      setProgress(0);

      try {
        await uploadAvatar(image, setProgress);
        toast({ message: 'Avatar updated', variant: 'success' });
      } catch (uploadError) {
        // Back to the picture the server holds.
        setLocalUrl(null);
        setError(getUploadErrorMessage(uploadError));
      }
    } finally {
      setProgress(null);
      setIsBusy(false);
    }
  };

  return {
    avatarSrc: localUrl ?? (userId ? `/api/v1/users/${userId}/avatar` : undefined),
    progress,
    isBusy,
    error,
    inputRef,
    openPicker,
    handleFileChange,
  };
}
