import {
  IsInt,
  Max,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { MAX_ODC_INTEGER } from '../../domain/input-boundaries';

// T1 fields only. totalCents is deliberately not declared: the domain
// computes it and the global whitelist ValidationPipe strips it (R2).
export class CreateOdcDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsInt()
  @IsPositive()
  @Max(MAX_ODC_INTEGER)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsInt()
  @IsPositive()
  @Max(MAX_ODC_INTEGER)
  unitPriceCents: number;

  @IsString()
  @IsNotEmpty()
  supplier: string;

  @IsOptional()
  @IsString()
  comments?: string;
}
