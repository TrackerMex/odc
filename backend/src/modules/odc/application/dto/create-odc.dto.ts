import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

// T1 fields only. totalCents is deliberately not declared: the domain
// computes it and the global whitelist ValidationPipe strips it (R2).
export class CreateOdcDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsInt()
  @IsPositive()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsInt()
  @IsPositive()
  unitPriceCents: number;

  @IsString()
  @IsNotEmpty()
  supplier: string;

  @IsOptional()
  @IsString()
  comments?: string;
}
