import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { OdcStatus } from '../../../odc/domain/entities/purchase-order.entity';
import type { OdcViewer } from '../../../odc/domain/repositories/purchase-order.repository';
import { UserOrmEntity } from '../../../users/infrastructure/entities/user.orm-entity';
import type {
  NotificationFeed,
  NotificationItem,
} from '../../domain/entities/notification.entity';
import type { NotificationRepository } from '../../domain/repositories/notification.repository';

interface NotificationRow {
  id: string;
  odcId: string;
  odcNumber: string;
  fromStatus: OdcStatus | null;
  toStatus: OdcStatus;
  actorName: string;
  createdAt: Date;
  isRead: boolean;
}

@Injectable()
export class NotificationTypeOrmRepository implements NotificationRepository {
  constructor(private readonly dataSource: DataSource) {}

  async listForUser(
    viewer: OdcViewer,
    limit: number,
  ): Promise<NotificationFeed> {
    const items = await this.dataSource.manager.query<NotificationRow[]>(
      `SELECT h.id,
              h."odcId" AS "odcId",
              o."odcNumber" AS "odcNumber",
              h."fromStatus" AS "fromStatus",
              h."toStatus" AS "toStatus",
              actor."fullName" AS "actorName",
              h."createdAt" AS "createdAt",
              (viewer."notificationsReadAt" IS NOT NULL
                AND h."createdAt" <= viewer."notificationsReadAt") AS "isRead"
       FROM odc_status_history h
       INNER JOIN purchase_orders o ON o.id = h."odcId"
       INNER JOIN users actor ON actor.id = h."userId"
       INNER JOIN users viewer ON viewer.id = $1
       WHERE (h."toStatus" <> 'BORRADOR' OR o."createdById" = $1)
       ORDER BY h."createdAt" DESC, h.id DESC
       LIMIT $2`,
      [viewer.userId, limit],
    );
    const [count] = await this.dataSource.manager.query<
      { unreadCount: string }[]
    >(
      `SELECT COUNT(*) AS "unreadCount"
       FROM odc_status_history h
       INNER JOIN purchase_orders o ON o.id = h."odcId"
       INNER JOIN users viewer ON viewer.id = $1
       WHERE (h."toStatus" <> 'BORRADOR' OR o."createdById" = $1)
         AND (viewer."notificationsReadAt" IS NULL
           OR h."createdAt" > viewer."notificationsReadAt")`,
      [viewer.userId],
    );

    return {
      items: items.map(toNotificationItem),
      unreadCount: Number(count?.unreadCount ?? 0),
    };
  }

  async markAllRead(userId: string, at: Date): Promise<void> {
    await this.dataSource.manager.update(
      UserOrmEntity,
      { id: userId },
      { notificationsReadAt: at },
    );
  }
}

function toNotificationItem(row: NotificationRow): NotificationItem {
  return {
    ...row,
    createdAt: new Date(row.createdAt),
    isRead: row.isRead,
  };
}
