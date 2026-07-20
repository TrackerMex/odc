import { ClassProvider } from '@nestjs/common';
import { CloudinaryFileStorageService } from './infrastructure/services/cloudinary-file-storage.service';
import { FilesModule } from './files.module';

describe("R7: FilesModule registers CloudinaryFileStorageService under the 'FileStorageService' token and exports it", () => {
  it("provides CloudinaryFileStorageService under the string token 'FileStorageService'", () => {
    const providers = (Reflect.getMetadata('providers', FilesModule) ??
      []) as unknown[];
    const provider = providers.find(
      (candidate): candidate is ClassProvider =>
        typeof candidate === 'object' &&
        candidate !== null &&
        (candidate as ClassProvider).provide === 'FileStorageService',
    );

    expect(provider).toBeDefined();
    expect(provider?.useClass).toBe(CloudinaryFileStorageService);
  });

  it("exports the 'FileStorageService' token so other modules can import it", () => {
    const exportsMetadata = (Reflect.getMetadata('exports', FilesModule) ??
      []) as unknown[];

    expect(exportsMetadata).toContain('FileStorageService');
  });
});
