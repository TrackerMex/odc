import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryFileStorageService } from './cloudinary-file-storage.service';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: { upload: jest.fn() },
    url: jest.fn(),
  },
}));

const mockedCloudinary = cloudinary as unknown as {
  config: jest.Mock;
  uploader: { upload: jest.Mock };
  url: jest.Mock;
};

function createConfigService(): ConfigService {
  const values: Record<string, string> = {
    CLOUDINARY_CLOUD_NAME: 'odc-cloud',
    CLOUDINARY_API_KEY: 'key-123',
    CLOUDINARY_API_SECRET: 'secret-456',
  };
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

describe('R7: CloudinaryFileStorageService configures the SDK from ConfigService', () => {
  it('calls cloudinary.config with the 3 env-backed credentials on construction', () => {
    new CloudinaryFileStorageService(createConfigService());

    expect(mockedCloudinary.config).toHaveBeenCalledWith({
      cloud_name: 'odc-cloud',
      api_key: 'key-123',
      api_secret: 'secret-456',
    });
  });
});

describe('R7: CloudinaryFileStorageService.upload uploads the buffer and returns only the public_id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('invokes cloudinary.uploader.upload with resource_type auto, type authenticated and the given folder', async () => {
    mockedCloudinary.uploader.upload.mockResolvedValue({
      public_id: 'odc/ODC-2026-00001/evidence/abc123',
      secure_url:
        'https://res.cloudinary.com/odc-cloud/raw/authenticated/abc123',
    });
    const service = new CloudinaryFileStorageService(createConfigService());

    const result = await service.upload({
      buffer: Buffer.from('file-bytes'),
      mimeType: 'application/pdf',
      folder: 'odc/ODC-2026-00001/evidence',
    });

    expect(mockedCloudinary.uploader.upload).toHaveBeenCalledTimes(1);
    const [dataUri, options] = mockedCloudinary.uploader.upload.mock
      .calls[0] as [string, Record<string, unknown>];
    expect(dataUri).toBe(
      `data:application/pdf;base64,${Buffer.from('file-bytes').toString('base64')}`,
    );
    expect(options).toEqual({
      folder: 'odc/ODC-2026-00001/evidence',
      resource_type: 'auto',
      type: 'authenticated',
    });
    expect(result).toEqual({ publicId: 'odc/ODC-2026-00001/evidence/abc123' });
    expect(result).not.toHaveProperty('secure_url');
    expect(result).not.toHaveProperty('url');
  });
});

describe('R7: CloudinaryFileStorageService.getSignedUrl requests a short-lived signed URL', () => {
  beforeEach(() => jest.clearAllMocks());

  it('invokes cloudinary.url with sign_url, type authenticated and an expires_at in the near future', async () => {
    mockedCloudinary.url.mockReturnValue(
      'https://res.cloudinary.com/odc-cloud/raw/authenticated/s--signature--/abc123',
    );
    const service = new CloudinaryFileStorageService(createConfigService());
    const before = Math.floor(Date.now() / 1000);

    const url = await service.getSignedUrl({
      publicId: 'odc/ODC-2026-00001/evidence/abc123',
    });

    expect(mockedCloudinary.url).toHaveBeenCalledTimes(1);
    const [publicId, options] = mockedCloudinary.url.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(publicId).toBe('odc/ODC-2026-00001/evidence/abc123');
    expect(options.sign_url).toBe(true);
    expect(options.type).toBe('authenticated');
    expect(options.expires_at as number).toBeGreaterThan(before);
    // Short expiration: no more than 10 minutes out.
    expect(options.expires_at as number).toBeLessThanOrEqual(before + 10 * 60);
    expect(url).toBe(
      'https://res.cloudinary.com/odc-cloud/raw/authenticated/s--signature--/abc123',
    );
  });
});
