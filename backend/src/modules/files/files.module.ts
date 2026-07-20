import { Module } from '@nestjs/common';
import { CloudinaryFileStorageService } from './infrastructure/services/cloudinary-file-storage.service';

// Dedicated, exported module (R7, arch-module-sharing): OdcModule and the
// future odc-invoice-completion module both import this instead of
// re-declaring the 'FileStorageService' provider.
@Module({
  providers: [
    { provide: 'FileStorageService', useClass: CloudinaryFileStorageService },
  ],
  exports: ['FileStorageService'],
})
export class FilesModule {}
