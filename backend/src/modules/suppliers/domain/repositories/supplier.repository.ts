import { Supplier } from '../entities/supplier.entity';

export interface SupplierRepository {
  findAll(): Promise<Supplier[]>;
  findByName(name: string): Promise<Supplier | null>;
  create(supplier: Supplier): Promise<Supplier>;
}
