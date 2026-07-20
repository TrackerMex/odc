// class-transformer's @Type() reads/writes design-type metadata at decoration
// time, so the reflect-metadata polyfill must be loaded before it runs.
import 'reflect-metadata';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsPositive } from 'class-validator';
import { ODC_STATUSES } from '../../domain/entities/purchase-order.entity';
import type { OdcStatus } from '../../domain/entities/purchase-order.entity';

// Both filters are optional query params (R12). page arrives as a query
// string and is transformed to an integer for validation.
export class ListOdcsQueryDto {
  @IsOptional()
  @IsIn(ODC_STATUSES)
  status?: OdcStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  page?: number;
}
