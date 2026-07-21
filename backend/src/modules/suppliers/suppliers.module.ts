import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListSuppliersUseCase } from './application/use-cases/list-suppliers.usecase';
import { SeedSuppliersUseCase } from './application/use-cases/seed-suppliers.usecase';
import { SupplierController } from './infrastructure/controller/supplier.controller';
import { SupplierOrmEntity } from './infrastructure/entities/supplier.orm-entity';
import { SupplierTypeOrmRepository } from './infrastructure/repositories/supplier.typeorm.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SupplierOrmEntity])],
  controllers: [SupplierController],
  providers: [
    ListSuppliersUseCase,
    SeedSuppliersUseCase,
    { provide: 'SupplierRepository', useClass: SupplierTypeOrmRepository },
  ],
  exports: ['SupplierRepository'],
})
export class SuppliersModule {}
