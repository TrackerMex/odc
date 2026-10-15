import { ValidateBy, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { isCalendarDate } from '../../domain/input-boundaries';

// T7 body: paymentDate/paymentMethod match the domain's TransitionData
// required fields; paymentReference/paymentNotes stay optional (R1).
export class RegisterPaymentDto {
  @ValidateBy(
    { name: 'isCalendarDate', validator: { validate: isCalendarDate } },
    {
      message:
        '$property debe ser una fecha real YYYY-MM-DD, sin hora ni zona.',
    },
  )
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
