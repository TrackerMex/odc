import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { FileStorageUnavailableError } from '../../domain/errors/file-storage-unavailable.error';
import { StoredFileNotFoundError } from '../../domain/errors/stored-file-not-found.error';
import { CloudinaryFileStorageService } from './cloudinary-file-storage.service';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: { upload: jest.fn() },
    api: { resource: jest.fn() },
    url: jest.fn(),
  },
}));

const mockedCloudinary = cloudinary as unknown as {
  config: jest.Mock;
  uploader: { upload: jest.Mock };
  api: { resource: jest.Mock };
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

describe('R1: CloudinaryFileStorageService.upload returns private delivery metadata', () => {
  beforeEach(() => jest.clearAllMocks());

  it('invokes cloudinary.uploader.upload with resource_type auto, type authenticated and the given folder', async () => {
    mockedCloudinary.uploader.upload.mockResolvedValue({
      public_id: 'odc/ODC-2026-00001/evidence/abc123',
      resource_type: 'image',
      format: 'pdf',
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
    expect(result).toEqual({
      publicId: 'odc/ODC-2026-00001/evidence/abc123',
      resourceType: 'image',
      format: 'pdf',
    });
    expect(result).not.toHaveProperty('secure_url');
    expect(result).not.toHaveProperty('url');
  });
});

describe('R2: CloudinaryFileStorageService signs with the real delivery type and format', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uses image/authenticated with the uploaded format and never auto', async () => {
    mockedCloudinary.url.mockReturnValue(
      'https://res.cloudinary.com/odc-cloud/image/authenticated/s--signature--/v1/odc/file.png',
    );
    const service = new CloudinaryFileStorageService(createConfigService());
    const before = Math.floor(Date.now() / 1000);

    await service.getSignedUrl({
      publicId: 'odc/ODC-2026-00001/evidence/abc123',
      resourceType: 'image',
      format: 'png',
    });

    expect(mockedCloudinary.api.resource).not.toHaveBeenCalled();
    expect(mockedCloudinary.url).toHaveBeenCalledWith(
      'odc/ODC-2026-00001/evidence/abc123',
      expect.objectContaining({
        sign_url: true,
        type: 'authenticated',
        resource_type: 'image',
        format: 'png',
      }),
    );
    const [, options] = mockedCloudinary.url.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(options.resource_type).not.toBe('auto');
    expect(options.expires_at as number).toBeGreaterThan(before);
    expect(options.expires_at as number).toBeLessThanOrEqual(before + 5 * 60);
  });
});

describe('R3: CloudinaryFileStorageService resolves historical references', () => {
  beforeEach(() => jest.clearAllMocks());

  it('looks up missing metadata before signing without re-uploading', async () => {
    mockedCloudinary.api.resource.mockResolvedValue({
      public_id: 'odc/ODC-2026-00001/invoice/legacy123',
      resource_type: 'image',
      format: 'pdf',
    });
    mockedCloudinary.url.mockReturnValue('https://signed.example/invoice.pdf');
    const service = new CloudinaryFileStorageService(createConfigService());

    await expect(
      service.getSignedUrl({
        publicId: 'odc/ODC-2026-00001/invoice/legacy123',
      }),
    ).resolves.toBe('https://signed.example/invoice.pdf');

    expect(mockedCloudinary.uploader.upload).not.toHaveBeenCalled();
    expect(mockedCloudinary.api.resource).toHaveBeenCalledWith(
      'odc/ODC-2026-00001/invoice/legacy123',
      { resource_type: 'image', type: 'authenticated' },
    );
    expect(mockedCloudinary.url).toHaveBeenCalledWith(
      'odc/ODC-2026-00001/invoice/legacy123',
      expect.objectContaining({ resource_type: 'image', format: 'pdf' }),
    );
  });

  it('translates a confirmed Cloudinary 404 to StoredFileNotFoundError', async () => {
    mockedCloudinary.api.resource.mockRejectedValue({ http_code: 404 });
    const service = new CloudinaryFileStorageService(createConfigService());

    await expect(
      service.getSignedUrl({ publicId: 'odc/missing' }),
    ).rejects.toBeInstanceOf(StoredFileNotFoundError);
  });

  it('translates a recoverable Cloudinary failure to FileStorageUnavailableError', async () => {
    mockedCloudinary.api.resource.mockRejectedValue(new Error('timeout'));
    const service = new CloudinaryFileStorageService(createConfigService());

    await expect(
      service.getSignedUrl({ publicId: 'odc/unavailable' }),
    ).rejects.toBeInstanceOf(FileStorageUnavailableError);
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
      resourceType: 'image',
      format: 'png',
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
    expect(options.expires_at as number).toBeLessThanOrEqual(before + 5 * 60);
    expect(url).toBe(
      'https://res.cloudinary.com/odc-cloud/raw/authenticated/s--signature--/abc123',
    );
  });
});
