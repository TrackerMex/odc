import 'reflect-metadata';
import { Matches } from 'class-validator';

export class GetMonthlyPurchaseSummaryQueryDto {
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'month must use the YYYY-MM format',
  })
  month: string;
}
