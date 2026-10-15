import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { createHash } from 'node:crypto';
import { FileStorageUnavailableError } from '../../domain/errors/file-storage-unavailable.error';
import { CloudinaryFileStorageService } from './cloudinary-file-storage.service';

const SECRET = 'dummy-secret-not-a-real-credential';
const PUBLIC_ID = 'odc/test35/document';
const NOW = new Date('2026-10-05T00:00:00Z');

function signature(params: URLSearchParams) {
  const signed = [...params.entries()]
    .filter(([key]) => key !== 'api_key' && key !== 'signature')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value.replace(/&/g, '%26')}`)
    .join('&');
  return createHash('sha1')
    .update(signed + SECRET)
    .digest('hex');
}

describe('R1,R2: real Cloudinary SDK generates a signed five-minute API download (#35)', () => {
  let service: CloudinaryFileStorageService;
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
    cloudinary.config({ signature_algorithm: 'sha1', signature_version: 2 });
    const config = {
      CLOUDINARY_CLOUD_NAME: 'test35-dummy-cloud',
      CLOUDINARY_API_KEY: 'dummy-key',
      CLOUDINARY_API_SECRET: SECRET,
    };
    service = new CloudinaryFileStorageService({
      get: (key: keyof typeof config) => config[key],
    } as unknown as ConfigService);
  });
  afterEach(() => jest.useRealTimers());

  it.each(['pdf', 'jpg', 'jpeg', 'png'])(
    'signs authenticated %s with exactly 300 seconds',
    async (format) => {
      const url = new URL(
        await service.getSignedUrl({
          publicId: PUBLIC_ID,
          resourceType: 'image',
          format,
        }),
      );
      expect(url.origin).toBe('https://api.cloudinary.com');
      expect(url.pathname).toBe('/v1_1/test35-dummy-cloud/image/download');
      expect(url.searchParams.get('public_id')).toBe(PUBLIC_ID);
      expect(url.searchParams.get('format')).toBe(format);
      expect(url.searchParams.get('type')).toBe('authenticated');
      expect(url.searchParams.get('expires_at')).toBe(
        String(NOW.getTime() / 1000 + 300),
      );
      expect(url.searchParams.get('timestamp')).toBe(
        String(NOW.getTime() / 1000),
      );
      expect(url.searchParams.get('signature')).toBe(
        signature(url.searchParams),
      );
      expect(url.toString()).not.toContain(SECRET);
    },
  );

  it('changes expiry and signature when the server clock advances', async () => {
    const reference = {
      publicId: PUBLIC_ID,
      resourceType: 'image',
      format: 'pdf',
    };
    const first = new URL(await service.getSignedUrl(reference));
    jest.setSystemTime(NOW.getTime() + 60_000);
    const second = new URL(await service.getSignedUrl(reference));
    expect(
      Number(second.searchParams.get('expires_at')) -
        Number(first.searchParams.get('expires_at')),
    ).toBe(60);
    expect(second.searchParams.get('signature')).not.toBe(
      first.searchParams.get('signature'),
    );
    expect(second.searchParams.get('signature')).toBe(
      signature(second.searchParams),
    );
  });

  it('does not validate the old signature after expiry or delivery type is tampered', async () => {
    const url = new URL(
      await service.getSignedUrl({
        publicId: PUBLIC_ID,
        resourceType: 'image',
        format: 'png',
      }),
    );
    const original = url.searchParams.get('signature');
    url.searchParams.set('expires_at', String(NOW.getTime() / 1000 + 600));
    expect(original).not.toBe(signature(url.searchParams));
    url.searchParams.set('expires_at', String(NOW.getTime() / 1000 + 300));
    url.searchParams.set('type', 'upload');
    expect(original).not.toBe(signature(url.searchParams));
  });

  it('R3: preserves raw delivery metadata in the API path', async () => {
    const url = new URL(
      await service.getSignedUrl({
        publicId: 'odc/test35/file.pdf',
        resourceType: 'raw',
        format: 'pdf',
      }),
    );
    expect(url.pathname).toBe('/v1_1/test35-dummy-cloud/raw/download');
    expect(url.searchParams.get('signature')).toBe(signature(url.searchParams));
  });

  it.each([
    { resourceType: 'auto', format: 'pdf' },
    { resourceType: 'invalid', format: 'pdf' },
    { resourceType: 'image', format: '' },
  ])('R3: rejects unusable metadata %j', async (metadata) => {
    await expect(
      service.getSignedUrl({ publicId: PUBLIC_ID, ...metadata }),
    ).rejects.toBeInstanceOf(FileStorageUnavailableError);
  });

  it('R3: masks missing signing configuration as a storage error', async () => {
    const unconfigured = new CloudinaryFileStorageService({
      get: () => undefined,
    } as unknown as ConfigService);
    await expect(
      unconfigured.getSignedUrl({
        publicId: PUBLIC_ID,
        resourceType: 'image',
        format: 'pdf',
      }),
    ).rejects.toBeInstanceOf(FileStorageUnavailableError);
  });
});
