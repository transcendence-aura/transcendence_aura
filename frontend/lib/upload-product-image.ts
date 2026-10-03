import { getAccessToken } from './auth/token-store';
import type { ProductMedia } from './graphql/queries/admin-products';

interface UploadProductImageOptions {
  productId: string;
  file: File;
  onProgress?: (percent: number) => void;
}

// Plain XHR rather than fetch: fetch has no upload progress event, and the
// "shows progress" acceptance criterion needs one.
export function uploadProductImage({
  productId,
  file,
  onProgress,
}: UploadProductImageOptions): Promise<ProductMedia> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/v1/admin/products/${productId}/images`);

    const accessToken = getAccessToken();
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
        resolve(JSON.parse(xhr.responseText) as ProductMedia);
        return;
      }
      try {
        const body = JSON.parse(xhr.responseText) as { message?: string };
        reject(new Error(body.message ?? 'UPLOAD_FAILED'));
      } catch {
        reject(new Error('UPLOAD_FAILED'));
      }
    };

    xhr.onerror = () => reject(new Error('UPLOAD_FAILED'));

    const formData = new FormData();
    formData.append('file', file);
    xhr.send(formData);
  });
}
