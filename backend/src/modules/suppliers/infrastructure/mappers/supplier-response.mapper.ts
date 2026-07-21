import { Supplier } from '../../domain/entities/supplier.entity';

// HTTP-facing shape of a Supplier (R4): only id/name, no createdAt.
export interface SupplierResponseDto {
  id: string | null;
  name: string;
}

export function toSupplierResponse(supplier: Supplier): SupplierResponseDto {
  return { id: supplier.id, name: supplier.name };
}
