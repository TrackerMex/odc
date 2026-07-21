import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

// T9 body: the file itself travels outside this DTO via multer/@UploadedFile
// (see odc.controller.ts); warehouseEntryDate matches the domain's
// TransitionData required field, same pattern as paymentDate in
// RegisterPaymentDto (T7); invoiceNumber/invoiceDate/observations stay
// optional (R1).
export class UploadInvoiceDto {
  @IsDateString()
  @IsNotEmpty()
  warehouseEntryDate: string;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsOptional()
  @IsDateString()
  invoiceDate?: string;

  @IsOptional()
  @IsString()
  observations?: string;
}
