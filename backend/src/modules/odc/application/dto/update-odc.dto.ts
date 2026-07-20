import { PartialType } from '@nestjs/mapped-types';
import { CreateOdcDto } from './create-odc.dto';

export class UpdateOdcDto extends PartialType(CreateOdcDto) {}
