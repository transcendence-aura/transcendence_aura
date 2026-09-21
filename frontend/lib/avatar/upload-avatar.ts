import { getAccessToken } from '@/lib/auth/token-store';
import { refreshAccessToken } from '@/lib/auth/refresh-access-token';

export interface AvatarUploadResult {
  id: string;
  updatedAt: string;
}

export class AvatarUploadError extends Error {
  constructor(
    readonly code: string,
    readonly status?: number,
  ) {
    super(code);
  }
}

function getErrorCode(status: number, responseText: string): string {
  if (status === 413) return 'FILE_TOO_LARGE';
  try {
    const body = JSON.parse(responseText) as { message?: unknown };
    if (typeof body.message === 'string') return body.message;
  } catch {
    // Not JSON: fall through to the generic code.
  }
  return 'UPLOAD_FAILED';
}

// Plain XHR rather than fetch: fetch has no upload progress event.
function send(
  image: Blob,
  accessToken: string | null,
  onProgress?: (percent: number) => void,
): Promise<AvatarUploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/v1/users/me/avatar');

    if (accessToken) {
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as AvatarUploadResult);
        } catch {
          reject(new AvatarUploadError('UPLOAD_FAILED', xhr.status));
        }
        return;
      }
      reject(new AvatarUploadError(getErrorCode(xhr.status, xhr.responseText), xhr.status));
    };

    xhr.onerror = () => reject(new AvatarUploadError('NETWORK_ERROR'));

    const formData = new FormData();
    formData.append('file', image, 'avatar.jpg');
    xhr.send(formData);
  });
}

// The access token lives 15 minutes: on a 401, refresh it once and send the image again.
export async function uploadAvatar(
  image: Blob,
  onProgress?: (percent: number) => void,
): Promise<AvatarUploadResult> {
  try {
    return await send(image, getAccessToken(), onProgress);
  } catch (error) {
    if (error instanceof AvatarUploadError && error.status === 401) {
      const refreshedToken = await refreshAccessToken();
      if (refreshedToken) return send(image, refreshedToken, onProgress);
    }
    throw error;
  }
}
