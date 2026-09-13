import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OdcStatusHistoryOrmEntity } from '../odc/infrastructure/entities/odc-status-history.orm-entity';
import { PurchaseOrderOrmEntity } from '../odc/infrastructure/entities/purchase-order.orm-entity';
import { UserOrmEntity } from '../users/infrastructure/entities/user.orm-entity';
import { GetNotificationsUseCase } from './application/use-cases/get-notifications.usecase';
import { MarkNotificationsReadUseCase } from './application/use-cases/mark-notifications-read.usecase';
import { NotificationController } from './infrastructure/controller/notification.controller';
import { NotificationTypeOrmRepository } from './infrastructure/repositories/notification.typeorm.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OdcStatusHistoryOrmEntity,
      PurchaseOrderOrmEntity,
      UserOrmEntity,
    ]),
  ],
  controllers: [NotificationController],
  providers: [
    GetNotificationsUseCase,
    MarkNotificationsReadUseCase,
    {
      provide: 'NotificationRepository',
      useClass: NotificationTypeOrmRepository,
    },
  ],
})
export class NotificationsModule {}
