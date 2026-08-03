// Port for external file storage (R7). No imports of Cloudinary, multer or
// any framework: application/odc depends only on this interface, injected
// under the 'FileStorageService' token (see files.module.ts).
export interface UploadFileInput {
  buffer: Buffer;
  mimeType: string;
  folder: string;
}

export interface UploadFileResult {
  publicId: string;
  resourceType: string;
  format: string;
}

export interface GetSignedUrlInput {
  publicId: string;
  resourceType?: string;
  format?: string;
}

const CLOUDINARY_FILE_REFERENCE_PREFIX = 'cloudinary:v1:';

export function serializeFileReference(reference: GetSignedUrlInput): string {
  if (reference.resourceType === undefined || reference.format === undefined) {
    return reference.publicId;
  }
  return `${CLOUDINARY_FILE_REFERENCE_PREFIX}${reference.resourceType}:${reference.format}:${reference.publicId}`;
}

export function parseFileReference(storedValue: string): GetSignedUrlInput {
  if (!storedValue.startsWith(CLOUDINARY_FILE_REFERENCE_PREFIX)) {
    return { publicId: storedValue };
  }

  const payload = storedValue.slice(CLOUDINARY_FILE_REFERENCE_PREFIX.length);
  const [resourceType, format, ...publicIdParts] = payload.split(':');
  const publicId = publicIdParts.join(':');
  if (!resourceType || !format || !publicId) {
    return { publicId: storedValue };
  }
  return { publicId, resourceType, format };
}

export interface FileStorageService {
  // Uploads a buffer and returns its private delivery descriptor (never a URL).
  upload(input: UploadFileInput): Promise<UploadFileResult>;
  // Returns a short-lived signed URL for a previously uploaded publicId.
  getSignedUrl(input: GetSignedUrlInput): Promise<string>;
}
