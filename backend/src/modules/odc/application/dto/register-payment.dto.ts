import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

// T7 body: paymentDate/paymentMethod match the domain's TransitionData
// required fields; paymentReference/paymentNotes stay optional (R1).
export class RegisterPaymentDto {
  @IsDateString()
  @IsNotEmpty()
  paymentDate: string;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @IsOptional()
  @IsString()
  paymentReference?: string;

  @IsOptional()
  @IsString()
  paymentNotes?: string;
}
