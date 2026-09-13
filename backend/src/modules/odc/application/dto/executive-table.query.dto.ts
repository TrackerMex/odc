import 'reflect-metadata';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
} from 'class-validator';
import { ODC_STATUSES } from '../../domain/entities/purchase-order.entity';
import type { OdcStatus } from '../../domain/entities/purchase-order.entity';

export class ExecutiveTableQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(2147483647)
  page?: number;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsIn(ODC_STATUSES)
  status?: OdcStatus;

  @IsOptional()
  @IsIn(['newest', 'oldest'])
  order?: 'newest' | 'oldest';
}
