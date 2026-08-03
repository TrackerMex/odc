import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { FileStorageUnavailableError } from '../../domain/errors/file-storage-unavailable.error';
import { StoredFileNotFoundError } from '../../domain/errors/stored-file-not-found.error';
import {
  FileStorageService,
  GetSignedUrlInput,
  UploadFileInput,
  UploadFileResult,
} from '../../domain/services/file-storage.service';

// Short expiration for signed evidence URLs (R5/R7): 5 minutes.
const SIGNED_URL_EXPIRY_SECONDS = 5 * 60;

@Injectable()
export class CloudinaryFileStorageService implements FileStorageService {
  constructor(configService: ConfigService) {
    cloudinary.config({
      cloud_name: configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  // Uploads via a base64 data URI so the buffer never touches disk;
  // resource_type 'auto' and type 'authenticated' per the brief (R7).
  // Returns only the private delivery descriptor, never a delivery URL.
  async upload(input: UploadFileInput): Promise<UploadFileResult> {
    const dataUri = `data:${input.mimeType};base64,${input.buffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: input.folder,
      resource_type: 'auto',
      type: 'authenticated',
    });
    return {
      publicId: result.public_id,
      resourceType: result.resource_type,
      format: result.format,
    };
  }

  async getSignedUrl(input: GetSignedUrlInput): Promise<string> {
    const reference = await this.resolveDeliveryMetadata(input);
    const expiresAt = Math.floor(Date.now() / 1000) + SIGNED_URL_EXPIRY_SECONDS;
    return cloudinary.url(reference.publicId, {
      sign_url: true,
      type: 'authenticated',
      resource_type: reference.resourceType,
      format: reference.format,
      expires_at: expiresAt,
    });
  }

  private async resolveDeliveryMetadata(
    input: GetSignedUrlInput,
  ): Promise<Required<GetSignedUrlInput>> {
    if (input.resourceType !== undefined && input.format !== undefined) {
      return {
        publicId: input.publicId,
        resourceType: input.resourceType,
        format: input.format,
      };
    }

    try {
      const resource = (await cloudinary.api.resource(input.publicId, {
        resource_type: 'image',
        type: 'authenticated',
      })) as unknown;
      if (!hasDeliveryMetadata(resource)) {
        throw new FileStorageUnavailableError();
      }
      return {
        publicId: input.publicId,
        resourceType: resource.resource_type,
        format: resource.format,
      };
    } catch (error) {
      if (isCloudinaryNotFound(error)) {
        throw new StoredFileNotFoundError();
      }
      if (error instanceof FileStorageUnavailableError) {
        throw error;
      }
      throw new FileStorageUnavailableError();
    }
  }
}

function hasDeliveryMetadata(
  value: unknown,
): value is { resource_type: string; format: string } {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as { resource_type?: unknown; format?: unknown };
  return (
    typeof candidate.resource_type === 'string' &&
    typeof candidate.format === 'string'
  );
}

function isCloudinaryNotFound(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const candidate = error as {
    http_code?: number;
    error?: { http_code?: number };
  };
  return candidate.http_code === 404 || candidate.error?.http_code === 404;
}
