import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedSuppliersUseCase } from './application/use-cases/seed-suppliers.usecase';
import { SupplierOrmEntity } from './infrastructure/entities/supplier.orm-entity';
import { SupplierTypeOrmRepository } from './infrastructure/repositories/supplier.typeorm.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SupplierOrmEntity])],
  providers: [
    SeedSuppliersUseCase,
    { provide: 'SupplierRepository', useClass: SupplierTypeOrmRepository },
  ],
  exports: ['SupplierRepository'],
})
export class SuppliersModule {}
