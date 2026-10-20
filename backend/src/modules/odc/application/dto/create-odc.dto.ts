import 'reflect-metadata';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  Max,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Validate,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MAX_ODC_INTEGER } from '../../domain/input-boundaries';
import { OdcLineItemDto } from './odc-line-item.dto';
import { ExclusiveLineItemFormatConstraint } from './line-item-format.constraint';

// T1 fields only. totalCents is deliberately not declared: the domain
// computes it and the global whitelist ValidationPipe strips it (R2).
export class CreateOdcDto {
  @ValidateIf((dto: CreateOdcDto) => dto.items !== undefined)
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OdcLineItemDto)
  @Validate(ExclusiveLineItemFormatConstraint)
  items?: OdcLineItemDto[];

  @ValidateIf((dto: CreateOdcDto) => dto.items === undefined)
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ValidateIf((dto: CreateOdcDto) => dto.items === undefined)
  @IsInt()
  @IsPositive()
  @Max(MAX_ODC_INTEGER)
  quantity?: number;

  @ValidateIf((dto: CreateOdcDto) => dto.items === undefined)
  @IsString()
  @IsNotEmpty()
  unit?: string;

  @ValidateIf((dto: CreateOdcDto) => dto.items === undefined)
  @IsInt()
  @IsPositive()
  @Max(MAX_ODC_INTEGER)
  unitPriceCents?: number;

  @IsString()
  @IsNotEmpty()
  supplier: string;

  @IsOptional()
  @IsString()
  comments?: string;
}
