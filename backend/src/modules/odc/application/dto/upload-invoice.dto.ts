import {
  ValidateBy,
  ValidateIf,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { isCalendarDate } from '../../domain/input-boundaries';

// T9 body: the file itself travels outside this DTO via multer/@UploadedFile
// (see odc.controller.ts); warehouseEntryDate matches the domain's
// TransitionData required field, same pattern as paymentDate in
// RegisterPaymentDto (T7); invoiceNumber/invoiceDate/observations stay
// optional (R1).
export class UploadInvoiceDto {
  @ValidateBy(
    { name: 'isCalendarDate', validator: { validate: isCalendarDate } },
    {
      message:
        '$property debe ser una fecha real YYYY-MM-DD, sin hora ni zona.',
    },
  )
  @IsNotEmpty()
  warehouseEntryDate: string;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @ValidateBy(
    { name: 'isCalendarDate', validator: { validate: isCalendarDate } },
    {
      message:
        '$property debe ser una fecha real YYYY-MM-DD, sin hora ni zona.',
    },
  )
  invoiceDate?: string;

  @IsOptional()
  @IsString()
  observations?: string;
}
