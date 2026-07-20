import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Roles } from '../../../auth/infrastructure/decorators/roles.decorator';
import type { SessionTokenPayload } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { CreateOdcDto } from '../../application/dto/create-odc.dto';
import { ListOdcsQueryDto } from '../../application/dto/list-odcs.query.dto';
import { UpdateOdcDto } from '../../application/dto/update-odc.dto';
import { CreateDraftUseCase } from '../../application/use-cases/create-draft.usecase';
import { GetOdcUseCase } from '../../application/use-cases/get-odc.usecase';
import { ListOdcsUseCase } from '../../application/use-cases/list-odcs.usecase';
import { SubmitOdcUseCase } from '../../application/use-cases/submit-odc.usecase';
import { UpdateDraftUseCase } from '../../application/use-cases/update-draft.usecase';
import {
  OdcActor,
  PurchaseOrder,
} from '../../domain/entities/purchase-order.entity';
import { InvalidRoleTransitionError } from '../../domain/errors/invalid-role-transition.error';
import { InvalidStatusTransitionError } from '../../domain/errors/invalid-status-transition.error';
import { MissingTransitionDataError } from '../../domain/errors/missing-transition-data.error';
import { OdcAccessDeniedError } from '../../domain/errors/odc-access-denied.error';
import { OdcNotFoundError } from '../../domain/errors/odc-not-found.error';
import { OdcPage } from '../../domain/repositories/purchase-order.repository';

interface RequestWithSession {
  user: SessionTokenPayload;
}

function actorFrom(request: RequestWithSession): OdcActor {
  return { userId: request.user.sub, role: request.user.role };
}

// Domain errors -> HTTP, following the table in docs/conventions.md.
function rethrowDomainError(error: unknown): never {
  if (
    error instanceof InvalidRoleTransitionError ||
    error instanceof OdcAccessDeniedError
  ) {
    throw new ForbiddenException(error.message);
  }
  if (error instanceof InvalidStatusTransitionError) {
    throw new ConflictException(error.message);
  }
  if (error instanceof MissingTransitionDataError) {
    throw new BadRequestException(error.message);
  }
  if (error instanceof OdcNotFoundError) {
    throw new NotFoundException(error.message);
  }
  throw error;
}

@Controller('odcs')
export class OdcController {
  constructor(
    private readonly createDraftUseCase: CreateDraftUseCase,
    private readonly submitOdcUseCase: SubmitOdcUseCase,
    private readonly updateDraftUseCase: UpdateDraftUseCase,
    private readonly listOdcsUseCase: ListOdcsUseCase,
    private readonly getOdcUseCase: GetOdcUseCase,
  ) {}

  @Post()
  @Roles('DIRECTOR_OPS')
  async create(
    @Body() dto: CreateOdcDto,
    @Req() request: RequestWithSession,
  ): Promise<PurchaseOrder> {
    try {
      return await this.createDraftUseCase.execute(dto, actorFrom(request));
    } catch (error) {
      rethrowDomainError(error);
    }
  }

  @Post(':id/submit')
  @HttpCode(200)
  @Roles('DIRECTOR_OPS')
  async submit(
    @Param('id') id: string,
    @Req() request: RequestWithSession,
  ): Promise<PurchaseOrder> {
    try {
      return await this.submitOdcUseCase.execute(id, actorFrom(request));
    } catch (error) {
      rethrowDomainError(error);
    }
  }

  @Patch(':id')
  @Roles('DIRECTOR_OPS')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOdcDto,
    @Req() request: RequestWithSession,
  ): Promise<PurchaseOrder> {
    try {
      return await this.updateDraftUseCase.execute(id, dto, actorFrom(request));
    } catch (error) {
      rethrowDomainError(error);
    }
  }

  // No @Roles: the 3 roles may list, with BORRADOR visibility enforced by
  // the use-case/repository (R12).
  @Get()
  async list(
    @Query() query: ListOdcsQueryDto,
    @Req() request: RequestWithSession,
  ): Promise<OdcPage> {
    return this.listOdcsUseCase.execute(
      {
        status: query.status,
        page: query.page !== undefined ? Number(query.page) : undefined,
      },
      actorFrom(request),
    );
  }

  // No @Roles: the 3 roles may view a detail; visibility of BORRADOR is
  // enforced by the use-case (R13).
  @Get(':id')
  async detail(
    @Param('id') id: string,
    @Req() request: RequestWithSession,
  ): Promise<PurchaseOrder> {
    try {
      return await this.getOdcUseCase.execute(id, actorFrom(request));
    } catch (error) {
      rethrowDomainError(error);
    }
  }
}
