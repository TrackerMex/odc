import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryFileStorageService } from './cloudinary-file-storage.service';
import { FileStorageUnavailableError } from '../../domain/errors/file-storage-unavailable.error';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: { upload: jest.fn() },
    api: {
      resource: jest.fn(),
      delete_resources_by_asset_ids: jest.fn(),
      resources_by_asset_ids: jest.fn(),
    },
  },
}));
const owned = { publicId: 'odc/test/ticket', uploadToken: 'ticket-token' };
const resource = {
  public_id: owned.publicId,
  resource_type: 'image',
  type: 'authenticated',
  asset_id: 'immutable-asset',
  context: { custom: { odc_upload_job: owned.uploadToken } },
};
type OwnedStorage = CloudinaryFileStorageService & {
  deleteIfOwned(input: typeof owned): Promise<string>;
};
let service: OwnedStorage;
beforeEach(() => {
  jest.resetAllMocks();
  service = new CloudinaryFileStorageService({
    get: jest.fn(),
  } as unknown as ConfigService);
  jest.mocked(cloudinary.api.resource).mockResolvedValue(resource);
  jest
    .mocked(cloudinary.api.delete_resources_by_asset_ids)
    .mockResolvedValue({ deleted: {} } as never);
  jest
    .mocked(cloudinary.api.resources_by_asset_ids)
    .mockResolvedValue({ resources: [] } as never);
});
describe('R1,R3: immutable owned asset cleanup', () => {
  it('reserved uploads cannot overwrite and carry the private ownership marker', async () => {
    jest.mocked(cloudinary.uploader.upload).mockResolvedValue({
      public_id: owned.publicId,
      resource_type: 'image',
      format: 'pdf',
    } as never);
    const input = {
      ...owned,
      buffer: Buffer.from('%PDF-'),
      mimeType: 'application/pdf',
      folder: 'odc/test',
    };
    await service.upload(input);
    expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
      expect.any(String),
      {
        public_id: owned.publicId,
        overwrite: false,
        context: { odc_upload_job: owned.uploadToken },
        resource_type: 'image',
        type: 'authenticated',
      },
    );
  });
  it('deletes by immutable asset id and verifies absence', async () => {
    expect(await service.deleteIfOwned(owned)).toBe('deleted');
    expect(cloudinary.api.resource).toHaveBeenCalledWith(owned.publicId, {
      type: 'authenticated',
      resource_type: 'image',
    });
    expect(cloudinary.api.delete_resources_by_asset_ids).toHaveBeenCalledWith([
      'immutable-asset',
    ]);
    expect(cloudinary.api.resources_by_asset_ids).toHaveBeenCalledWith([
      'immutable-asset',
    ]);
  });
  it.each([
    { ...resource, public_id: 'another' },
    { ...resource, asset_id: undefined },
    { ...resource, resource_type: 'raw' },
    { ...resource, type: 'upload' },
    { ...resource, context: undefined },
    { ...resource, context: { custom: { odc_upload_job: 'someone-else' } } },
  ])('protects unowned/old/wrong-type assets %#', async (metadata) => {
    jest.mocked(cloudinary.api.resource).mockResolvedValue(metadata);
    expect(await service.deleteIfOwned(owned)).toBe('not_owned');
    expect(cloudinary.api.delete_resources_by_asset_ids).not.toHaveBeenCalled();
  });
  it('confirmed absence is idempotent', async () => {
    jest
      .mocked(cloudinary.api.resource)
      .mockRejectedValue({ error: { http_code: 404 } });
    expect(await service.deleteIfOwned(owned)).toBe('missing');
    expect(cloudinary.api.delete_resources_by_asset_ids).not.toHaveBeenCalled();
  });
  it.each([401, 429, 500])(
    'metadata failure %s never authorizes deletion',
    async (http_code) => {
      jest.mocked(cloudinary.api.resource).mockRejectedValue({ http_code });
      await expect(service.deleteIfOwned(owned)).rejects.toBeInstanceOf(
        FileStorageUnavailableError,
      );
      expect(
        cloudinary.api.delete_resources_by_asset_ids,
      ).not.toHaveBeenCalled();
    },
  );
  it.each([{ resources: [resource] }, {}, { resources: undefined }])(
    'unconfirmed deletion remains retryable %#',
    async (response) => {
      jest
        .mocked(cloudinary.api.resources_by_asset_ids)
        .mockResolvedValue(response as never);
      await expect(service.deleteIfOwned(owned)).rejects.toBeInstanceOf(
        FileStorageUnavailableError,
      );
    },
  );
});
