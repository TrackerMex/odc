import { Matches } from 'class-validator';
import { ExecutiveTableQueryDto } from './executive-table.query.dto';

export class GetExecutiveDashboardQueryDto extends ExecutiveTableQueryDto {
  @Matches(/^[1-9]\d{3}-(0[1-9]|1[0-2])$/, {
    message: 'month must use the YYYY-MM format',
  })
  month: string;
}
