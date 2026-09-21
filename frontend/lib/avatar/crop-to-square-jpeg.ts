// The backend only accepts square JPEGs of 5 MB maximum, so any picture the user chooses is
// centre-cropped to a square, resized and encoded as JPEG here, before the upload.
const AVATAR_SIZE_PX = 512;
const JPEG_QUALITY = 0.9;
// JPEG has no transparency: a transparent PNG would otherwise turn black.
const BACKGROUND_COLOR = '#ffffff';

export type AvatarImageErrorCode = 'NOT_AN_IMAGE' | 'UNREADABLE_IMAGE';

export class AvatarImageError extends Error {
  constructor(readonly code: AvatarImageErrorCode) {
    super(code);
  }
}

export async function cropToSquareJpeg(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new AvatarImageError('NOT_AN_IMAGE');
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new AvatarImageError('UNREADABLE_IMAGE');
  }

  const canvas = document.createElement('canvas');
  canvas.width = AVATAR_SIZE_PX;
  canvas.height = AVATAR_SIZE_PX;
  const context = canvas.getContext('2d');

  if (!context) {
    bitmap.close();
    throw new AvatarImageError('UNREADABLE_IMAGE');
  }

  const side = Math.min(bitmap.width, bitmap.height);
  const sourceX = (bitmap.width - side) / 2;
  const sourceY = (bitmap.height - side) / 2;

  context.fillStyle = BACKGROUND_COLOR;
  context.fillRect(0, 0, AVATAR_SIZE_PX, AVATAR_SIZE_PX);
  context.drawImage(bitmap, sourceX, sourceY, side, side, 0, 0, AVATAR_SIZE_PX, AVATAR_SIZE_PX);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new AvatarImageError('UNREADABLE_IMAGE'))),
      'image/jpeg',
      JPEG_QUALITY,
    );
  });
}
