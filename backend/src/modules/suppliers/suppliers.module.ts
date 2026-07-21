import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupplierOrmEntity } from './infrastructure/entities/supplier.orm-entity';
import { SupplierTypeOrmRepository } from './infrastructure/repositories/supplier.typeorm.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SupplierOrmEntity])],
  providers: [
    { provide: 'SupplierRepository', useClass: SupplierTypeOrmRepository },
  ],
  exports: ['SupplierRepository'],
})
export class SuppliersModule {}
