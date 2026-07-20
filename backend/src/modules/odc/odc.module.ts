import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateDraftUseCase } from './application/use-cases/create-draft.usecase';
import { ListOdcsUseCase } from './application/use-cases/list-odcs.usecase';
import { SubmitOdcUseCase } from './application/use-cases/submit-odc.usecase';
import { UpdateDraftUseCase } from './application/use-cases/update-draft.usecase';
import { OdcController } from './infrastructure/controller/odc.controller';
import { OdcStatusHistoryOrmEntity } from './infrastructure/entities/odc-status-history.orm-entity';
import { PurchaseOrderOrmEntity } from './infrastructure/entities/purchase-order.orm-entity';
import { PurchaseOrderTypeOrmRepository } from './infrastructure/repositories/purchase-order.typeorm.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseOrderOrmEntity,
      OdcStatusHistoryOrmEntity,
    ]),
  ],
  controllers: [OdcController],
  providers: [
    CreateDraftUseCase,
    SubmitOdcUseCase,
    UpdateDraftUseCase,
    ListOdcsUseCase,
    {
      provide: 'PurchaseOrderRepository',
      useClass: PurchaseOrderTypeOrmRepository,
    },
  ],
})
export class OdcModule {}
