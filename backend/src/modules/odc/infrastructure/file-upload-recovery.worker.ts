import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import type { PurchaseOrderRepository } from '../domain/repositories/purchase-order.repository';
import type { FileStorageService } from '../../files/domain/services/file-storage.service';
import { recoverFileUpload } from '../application/recover-file-upload';

@Injectable()
export class FileUploadRecoveryWorker implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private running = false;
  private readonly logger = new Logger(FileUploadRecoveryWorker.name);
  constructor(
    @Inject('PurchaseOrderRepository')
    private readonly repo: PurchaseOrderRepository,
    @Inject('FileStorageService') private readonly storage: FileStorageService,
  ) {}
  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.run();
    }, 60_000);
    this.timer.unref();
    void this.run();
  }
  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }
  async run(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      for (const id of await this.repo.findFileRecoveries()) {
        if (!(await recoverFileUpload(this.repo, this.storage, id)))
          this.logger.warn(`file_recovery_deferred job=${id}`);
      }
    } catch {
      this.logger.warn('file_recovery_database_unavailable');
    } finally {
      this.running = false;
    }
  }
}
