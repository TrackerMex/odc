import { IsOptional, Matches } from 'class-validator';
import { ExecutiveTableQueryDto } from './executive-table.query.dto';

export class GetExecutiveTasksQueryDto extends ExecutiveTableQueryDto {
  @IsOptional()
  @Matches(/^(?:[1-9]\d{3}-(0[1-9]|1[0-2])|all)$/)
  month?: string;
}
