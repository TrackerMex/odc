import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  Max,
} from 'class-validator';
import { MAX_ODC_INTEGER } from '../../domain/input-boundaries';

export class OdcLineItemDto {
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
}
