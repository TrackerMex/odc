import { Inject, Injectable } from '@nestjs/common';
import { Supplier } from '../../domain/entities/supplier.entity';
import type { SupplierRepository } from '../../domain/repositories/supplier.repository';

// Fixed business catalog (specs/odc-suppliers-catalog/requirements.md,
// "Catálogo de proveedores a semillar"). Static data, not env/config (R3).
const SEED_SUPPLIERS: string[] = [
  'Ruptela',
  'Suntech',
  'Sirium',
  'Syscom',
  'RBI Topfly',
  'ISD Telematics',
  'Tecnosinergia',
  'Tech Innovation',
  'Teltonika',
  'BSJ',
  'VAES',
  'Escort',
  'Omnicomm',
  'Cantrack',
  'Fireflux',
  'Electrica Saavedra',
  'Cohesa',
  'Georgina Masso',
  'Mario Ramirez',
  'Steren',
  'Ferreshop',
  'Ontracking GPS Remote',
];

@Injectable()
export class SeedSuppliersUseCase {
  constructor(
    @Inject('SupplierRepository')
    private readonly supplierRepository: SupplierRepository,
  ) {}

  async execute(): Promise<{ created: string[]; skipped: string[] }> {
    const created: string[] = [];
    const skipped: string[] = [];

    for (const name of SEED_SUPPLIERS) {
      const existing = await this.supplierRepository.findByName(name);
      if (existing) {
        skipped.push(name);
        continue;
      }
      await this.supplierRepository.create(new Supplier(null, name, null));
      created.push(name);
    }

    return { created, skipped };
  }
}
