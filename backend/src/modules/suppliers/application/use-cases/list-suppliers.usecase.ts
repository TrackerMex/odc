import { Inject, Injectable } from '@nestjs/common';
import { Supplier } from '../../domain/entities/supplier.entity';
import type { SupplierRepository } from '../../domain/repositories/supplier.repository';

@Injectable()
export class ListSuppliersUseCase {
  constructor(
    @Inject('SupplierRepository')
    private readonly supplierRepository: SupplierRepository,
  ) {}

  // No paging: the catalog is a small fixed list (~22 rows), see design.md
  // "Alternativas descartadas" (R4).
  async execute(): Promise<Supplier[]> {
    const suppliers = await this.supplierRepository.findAll();
    return [...suppliers].sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
    );
  }
}
