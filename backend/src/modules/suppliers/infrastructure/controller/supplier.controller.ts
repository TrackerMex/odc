import { Controller, Get } from '@nestjs/common';
import { ListSuppliersUseCase } from '../../application/use-cases/list-suppliers.usecase';
import {
  SupplierResponseDto,
  toSupplierResponse,
} from '../mappers/supplier-response.mapper';

@Controller('suppliers')
export class SupplierController {
  constructor(private readonly listSuppliersUseCase: ListSuppliersUseCase) {}

  // No @Roles: the 3 roles need the catalog to populate the ODC creation
  // form (R4).
  @Get()
  async list(): Promise<SupplierResponseDto[]> {
    const suppliers = await this.listSuppliersUseCase.execute();
    return suppliers.map(toSupplierResponse);
  }
}
