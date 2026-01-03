export interface SignedUploadResponse {
  bucket: string;
  objectPath: string;
  uploadUrl: string;
  publicUrl: string;
  expiresAt: string;
  visibility: 'public' | 'temp';
}

const MEDIA_API_BASE = import.meta.env.VITE_MEDIA_API_BASE || 'http://localhost:4000';

export const requestSignedUpload = async (file: File, visibility: 'public' | 'temp' = 'public') => {
  const payload = {
    filename: file.name,
    contentType: file.type || 'application/octet-stream',
    visibility,
  };

  const response = await fetch(`${MEDIA_API_BASE}/media/sign-upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to request signed URL (${response.status})`);
  }

  return (await response.json()) as SignedUploadResponse;
};

export const uploadToSignedUrl = async (file: File, uploadUrl: string) => {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  });

  if (!res.ok) {
    throw new Error(`Upload failed (${res.status})`);
  }
};
