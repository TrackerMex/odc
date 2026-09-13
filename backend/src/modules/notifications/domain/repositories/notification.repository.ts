import type { OdcViewer } from '../../../odc/domain/repositories/purchase-order.repository';
import type { NotificationFeed } from '../entities/notification.entity';

export interface NotificationRepository {
  listForUser(viewer: OdcViewer, limit: number): Promise<NotificationFeed>;
  markAllRead(userId: string, at: Date): Promise<void>;
}
