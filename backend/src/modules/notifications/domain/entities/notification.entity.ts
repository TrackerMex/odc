import type { OdcStatus } from '../../../odc/domain/entities/purchase-order.entity';

export interface NotificationItem {
  id: string;
  odcId: string;
  odcNumber: string;
  fromStatus: OdcStatus | null;
  toStatus: OdcStatus;
  actorName: string;
  createdAt: Date;
  isRead: boolean;
}

export interface NotificationFeed {
  items: NotificationItem[];
  unreadCount: number;
}
