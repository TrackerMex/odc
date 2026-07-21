import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from '../../domain/entities/supplier.entity';
import { SupplierRepository } from '../../domain/repositories/supplier.repository';
import { SupplierOrmEntity } from '../entities/supplier.orm-entity';

function toDomain(row: SupplierOrmEntity): Supplier {
  return new Supplier(row.id, row.name, row.createdAt);
}

@Injectable()
export class SupplierTypeOrmRepository implements SupplierRepository {
  constructor(
    @InjectRepository(SupplierOrmEntity)
    private readonly ormRepository: Repository<SupplierOrmEntity>,
  ) {}

  async findAll(): Promise<Supplier[]> {
    const rows = await this.ormRepository.find();
    return rows.map(toDomain);
  }

  async findByName(name: string): Promise<Supplier | null> {
    const row = await this.ormRepository.findOne({ where: { name } });
    return row ? toDomain(row) : null;
  }

  async create(supplier: Supplier): Promise<Supplier> {
    const row = this.ormRepository.create({ name: supplier.name });
    const saved = await this.ormRepository.save(row);
    return toDomain(saved);
  }
}
