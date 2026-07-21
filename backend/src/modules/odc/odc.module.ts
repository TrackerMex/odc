import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesModule } from '../files/files.module';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { ApproveBudgetUseCase } from './application/use-cases/approve-budget.usecase';
import { ApprovePurchaseUseCase } from './application/use-cases/approve-purchase.usecase';
import { CreateDraftUseCase } from './application/use-cases/create-draft.usecase';
import { GetInvoiceFileUseCase } from './application/use-cases/get-invoice-file.usecase';
import { GetOdcUseCase } from './application/use-cases/get-odc.usecase';
import { GetPaymentEvidenceFileUseCase } from './application/use-cases/get-payment-evidence-file.usecase';
import { ListOdcsUseCase } from './application/use-cases/list-odcs.usecase';
import { RegisterPaymentUseCase } from './application/use-cases/register-payment.usecase';
import { RejectOdcUseCase } from './application/use-cases/reject-odc.usecase';
import { SubmitOdcUseCase } from './application/use-cases/submit-odc.usecase';
import { UpdateDraftUseCase } from './application/use-cases/update-draft.usecase';
import { UploadInvoiceUseCase } from './application/use-cases/upload-invoice.usecase';
import { UploadPaymentEvidenceUseCase } from './application/use-cases/upload-payment-evidence.usecase';
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
    FilesModule,
    SuppliersModule,
  ],
  controllers: [OdcController],
  providers: [
    CreateDraftUseCase,
    SubmitOdcUseCase,
    UpdateDraftUseCase,
    ListOdcsUseCase,
    GetOdcUseCase,
    ApproveBudgetUseCase,
    ApprovePurchaseUseCase,
    RejectOdcUseCase,
    RegisterPaymentUseCase,
    UploadPaymentEvidenceUseCase,
    GetPaymentEvidenceFileUseCase,
    UploadInvoiceUseCase,
    GetInvoiceFileUseCase,
    {
      provide: 'PurchaseOrderRepository',
      useClass: PurchaseOrderTypeOrmRepository,
    },
  ],
})
export class OdcModule {}
