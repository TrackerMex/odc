import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
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
  // Only the public_id is returned, never secure_url or any other URL field.
  async upload(input: UploadFileInput): Promise<UploadFileResult> {
    const dataUri = `data:${input.mimeType};base64,${input.buffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: input.folder,
      resource_type: 'auto',
      type: 'authenticated',
    });
    return { publicId: result.public_id };
  }

  // cloudinary.url() is synchronous; wrapped in a resolved promise to match
  // the FileStorageService interface (a real remote lookup for other
  // storage backends would be async).
  getSignedUrl(input: GetSignedUrlInput): Promise<string> {
    const expiresAt = Math.floor(Date.now() / 1000) + SIGNED_URL_EXPIRY_SECONDS;
    return Promise.resolve(
      cloudinary.url(input.publicId, {
        sign_url: true,
        type: 'authenticated',
        resource_type: 'auto',
        expires_at: expiresAt,
      }),
    );
  }
}
