import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  Matches,
  Max,
} from 'class-validator';
import { MAX_ODC_INTEGER } from '../../domain/input-boundaries';

export class OdcLineItemDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  description: string;

  @IsInt()
  @IsPositive()
  @Max(MAX_ODC_INTEGER)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  unit: string;

  @IsInt()
  @IsPositive()
  @Max(MAX_ODC_INTEGER)
  unitPriceCents: number;
}
