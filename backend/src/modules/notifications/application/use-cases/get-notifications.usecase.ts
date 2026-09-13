import { Inject, Injectable } from '@nestjs/common';
import type { OdcViewer } from '../../../odc/domain/repositories/purchase-order.repository';
import type { NotificationFeed } from '../../domain/entities/notification.entity';
import type { NotificationRepository } from '../../domain/repositories/notification.repository';

@Injectable()
export class GetNotificationsUseCase {
  constructor(
    @Inject('NotificationRepository')
    private readonly repository: NotificationRepository,
  ) {}

  execute(viewer: OdcViewer): Promise<NotificationFeed> {
    return this.repository.listForUser(viewer, 20);
  }
}
