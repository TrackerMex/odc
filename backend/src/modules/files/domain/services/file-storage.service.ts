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
}

export interface GetSignedUrlInput {
  publicId: string;
}

export interface FileStorageService {
  // Uploads a buffer and returns only its publicId (never a URL).
  upload(input: UploadFileInput): Promise<UploadFileResult>;
  // Returns a short-lived signed URL for a previously uploaded publicId.
  getSignedUrl(input: GetSignedUrlInput): Promise<string>;
}
