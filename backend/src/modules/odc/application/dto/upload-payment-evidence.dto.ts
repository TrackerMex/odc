import { IsOptional, IsString } from 'class-validator';

// T8 body: the file itself travels outside this DTO via multer/@UploadedFile
// (see odc.controller.ts); only the optional text field is validated here,
// same pattern as paymentReference/paymentNotes in RegisterPaymentDto (R1).
export class UploadPaymentEvidenceDto {
  @IsOptional()
  @IsString()
  evidenceReference?: string;
}
