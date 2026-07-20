import { IsNotEmpty, IsString } from 'class-validator';

// T4/T6 body: rejectionReason matches the domain's TransitionData field
// (R3), not the plan's abbreviated "reason" from the API surface table.
export class RejectOdcDto {
  @IsString()
  @IsNotEmpty()
  rejectionReason: string;
}
