import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  FileTypeValidator,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  NotFoundException,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  Redirect,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Roles } from '../../../auth/infrastructure/decorators/roles.decorator';
import type { SessionTokenPayload } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { CreateOdcDto } from '../../application/dto/create-odc.dto';
import { ListOdcsQueryDto } from '../../application/dto/list-odcs.query.dto';
import { RegisterPaymentDto } from '../../application/dto/register-payment.dto';
import { RejectOdcDto } from '../../application/dto/reject-odc.dto';
import { UpdateOdcDto } from '../../application/dto/update-odc.dto';
import { UploadInvoiceDto } from '../../application/dto/upload-invoice.dto';
import { UploadPaymentEvidenceDto } from '../../application/dto/upload-payment-evidence.dto';
import { ApproveBudgetUseCase } from '../../application/use-cases/approve-budget.usecase';
import { ApprovePurchaseUseCase } from '../../application/use-cases/approve-purchase.usecase';
import { CreateDraftUseCase } from '../../application/use-cases/create-draft.usecase';
import { GetInvoiceFileUseCase } from '../../application/use-cases/get-invoice-file.usecase';
import { GetOdcUseCase } from '../../application/use-cases/get-odc.usecase';
import { GetPaymentEvidenceFileUseCase } from '../../application/use-cases/get-payment-evidence-file.usecase';
import { ListOdcsUseCase } from '../../application/use-cases/list-odcs.usecase';
import { RegisterPaymentUseCase } from '../../application/use-cases/register-payment.usecase';
import { RejectOdcUseCase } from '../../application/use-cases/reject-odc.usecase';
import { SubmitOdcUseCase } from '../../application/use-cases/submit-odc.usecase';
import { UpdateDraftUseCase } from '../../application/use-cases/update-draft.usecase';
import { UploadInvoiceUseCase } from '../../application/use-cases/upload-invoice.usecase';
import { UploadPaymentEvidenceUseCase } from '../../application/use-cases/upload-payment-evidence.usecase';
import { OdcActor } from '../../domain/entities/purchase-order.entity';
import { InvalidRoleTransitionError } from '../../domain/errors/invalid-role-transition.error';
import { InvalidStatusTransitionError } from '../../domain/errors/invalid-status-transition.error';
import { InvoiceNotFoundError } from '../../domain/errors/invoice-not-found.error';
import { MissingTransitionDataError } from '../../domain/errors/missing-transition-data.error';
import { OdcAccessDeniedError } from '../../domain/errors/odc-access-denied.error';
import { OdcNotFoundError } from '../../domain/errors/odc-not-found.error';
import { PaymentEvidenceNotFoundError } from '../../domain/errors/payment-evidence-not-found.error';
import { UnknownSupplierError } from '../../domain/errors/unknown-supplier.error';
import {
  OdcPageResponseDto,
  OdcResponseDto,
  toOdcPageResponse,
  toOdcResponse,
} from '../mappers/odc-response.mapper';

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
  if (
    error instanceof MissingTransitionDataError ||
    error instanceof UnknownSupplierError
  ) {
    throw new BadRequestException(error.message);
  }
  if (
    error instanceof OdcNotFoundError ||
    error instanceof PaymentEvidenceNotFoundError ||
    error instanceof InvoiceNotFoundError
  ) {
    throw new NotFoundException(error.message);
  }
  throw error;
}

const MAX_PAYMENT_EVIDENCE_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB (R1)
const ALLOWED_PAYMENT_EVIDENCE_MIME_TYPES =
  /^(application\/pdf|image\/jpeg|image\/png)$/;

// Exported so the controller spec can exercise the exact pipe configuration
// used by the payment-evidence route (R1): MIME allowlist + size cap, both
// checked in-memory before Cloudinary is ever invoked. skipMagicNumbersValidation
// keeps this a plain mimetype-string check, avoiding a dependency on the
// `file-type` ESM package for magic-number sniffing.
export function createPaymentEvidenceFilePipe(): ParseFilePipe {
  return new ParseFilePipe({
    validators: [
      new FileTypeValidator({
        fileType: ALLOWED_PAYMENT_EVIDENCE_MIME_TYPES,
        skipMagicNumbersValidation: true,
      }),
      // Nest's MaxFileSizeValidator rejects when size >= maxSize, so +1
      // keeps a file of exactly 10485760 bytes ("<= 10MB") valid.
      new MaxFileSizeValidator({
        maxSize: MAX_PAYMENT_EVIDENCE_FILE_SIZE_BYTES + 1,
      }),
    ],
    fileIsRequired: true,
    errorHttpStatusCode: HttpStatus.BAD_REQUEST,
  });
}

// Same MIME allowlist and size cap as the payment-evidence route, replicated
// as its own named pipe function rather than a shared parametrized factory
// (R1, see design.md's "Alternativas descartadas").
const MAX_INVOICE_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB (R1)
const ALLOWED_INVOICE_MIME_TYPES =
  /^(application\/pdf|image\/jpeg|image\/png)$/;

export function createInvoiceFilePipe(): ParseFilePipe {
  return new ParseFilePipe({
    validators: [
      new FileTypeValidator({
        fileType: ALLOWED_INVOICE_MIME_TYPES,
        skipMagicNumbersValidation: true,
      }),
      new MaxFileSizeValidator({
        maxSize: MAX_INVOICE_FILE_SIZE_BYTES + 1,
      }),
    ],
    fileIsRequired: true,
    errorHttpStatusCode: HttpStatus.BAD_REQUEST,
  });
}

@Controller('odcs')
export class OdcController {
  constructor(
    private readonly createDraftUseCase: CreateDraftUseCase,
    private readonly submitOdcUseCase: SubmitOdcUseCase,
    private readonly updateDraftUseCase: UpdateDraftUseCase,
    private readonly listOdcsUseCase: ListOdcsUseCase,
    private readonly getOdcUseCase: GetOdcUseCase,
    private readonly approveBudgetUseCase: ApproveBudgetUseCase,
    private readonly approvePurchaseUseCase: ApprovePurchaseUseCase,
    private readonly rejectOdcUseCase: RejectOdcUseCase,
    private readonly registerPaymentUseCase: RegisterPaymentUseCase,
    private readonly uploadPaymentEvidenceUseCase: UploadPaymentEvidenceUseCase,
    private readonly getPaymentEvidenceFileUseCase: GetPaymentEvidenceFileUseCase,
    private readonly uploadInvoiceUseCase: UploadInvoiceUseCase,
    private readonly getInvoiceFileUseCase: GetInvoiceFileUseCase,
  ) {}

  @Post()
  @Roles('DIRECTOR_OPS')
  async create(
    @Body() dto: CreateOdcDto,
    @Req() request: RequestWithSession,
  ): Promise<OdcResponseDto> {
    try {
      const order = await this.createDraftUseCase.execute(
        dto,
        actorFrom(request),
      );
      return toOdcResponse(order);
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
  ): Promise<OdcResponseDto> {
    try {
      const order = await this.submitOdcUseCase.execute(id, actorFrom(request));
      return toOdcResponse(order);
    } catch (error) {
      rethrowDomainError(error);
    }
  }

  @Post(':id/approve-budget')
  @HttpCode(200)
  @Roles('ADMINISTRACION')
  async approveBudget(
    @Param('id') id: string,
    @Req() request: RequestWithSession,
  ): Promise<OdcResponseDto> {
    try {
      const order = await this.approveBudgetUseCase.execute(
        id,
        actorFrom(request),
      );
      return toOdcResponse(order);
    } catch (error) {
      rethrowDomainError(error);
    }
  }

  @Post(':id/approve-purchase')
  @HttpCode(200)
  @Roles('DIRECTOR_GENERAL')
  async approvePurchase(
    @Param('id') id: string,
    @Req() request: RequestWithSession,
  ): Promise<OdcResponseDto> {
    try {
      const order = await this.approvePurchaseUseCase.execute(
        id,
        actorFrom(request),
      );
      return toOdcResponse(order);
    } catch (error) {
      rethrowDomainError(error);
    }
  }

  // Shared route for T4 (ADMINISTRACION, PENDIENTE_ADMIN) and T6
  // (DIRECTOR_GENERAL, PRESUPUESTO_APROBADO): both are the same domain
  // action 'reject', which already resolves the applicable rule and role
  // from the ODC's current status (see design.md).
  @Post(':id/reject')
  @HttpCode(200)
  @Roles('ADMINISTRACION', 'DIRECTOR_GENERAL')
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectOdcDto,
    @Req() request: RequestWithSession,
  ): Promise<OdcResponseDto> {
    try {
      const order = await this.rejectOdcUseCase.execute(
        id,
        actorFrom(request),
        dto,
      );
      return toOdcResponse(order);
    } catch (error) {
      rethrowDomainError(error);
    }
  }

  // T7: COMPRA_APROBADA -> PAGO_REGISTRADO. Route name fixed literally by
  // the master plan's API surface ("payment", not "register-payment").
  @Post(':id/payment')
  @HttpCode(200)
  @Roles('DIRECTOR_OPS')
  async registerPayment(
    @Param('id') id: string,
    @Body() dto: RegisterPaymentDto,
    @Req() request: RequestWithSession,
  ): Promise<OdcResponseDto> {
    try {
      const order = await this.registerPaymentUseCase.execute(
        id,
        actorFrom(request),
        dto,
      );
      return toOdcResponse(order);
    } catch (error) {
      rethrowDomainError(error);
    }
  }

  // T8: PAGO_REGISTRADO -> EVIDENCIA_PAGO_SUBIDA. multipart/form-data: file
  // validated in-memory (MIME/size) before Cloudinary is ever reached (R1).
  @Post(':id/payment-evidence')
  @HttpCode(200)
  @Roles('ADMINISTRACION')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadPaymentEvidence(
    @Param('id') id: string,
    @UploadedFile(createPaymentEvidenceFilePipe())
    file: Express.Multer.File,
    @Body() dto: UploadPaymentEvidenceDto,
    @Req() request: RequestWithSession,
  ): Promise<OdcResponseDto> {
    try {
      const order = await this.uploadPaymentEvidenceUseCase.execute(
        id,
        actorFrom(request),
        {
          buffer: file.buffer,
          mimeType: file.mimetype,
          evidenceReference: dto.evidenceReference,
        },
      );
      return toOdcResponse(order);
    } catch (error) {
      rethrowDomainError(error);
    }
  }

  // T9: EVIDENCIA_PAGO_SUBIDA -> COMPLETADA. multipart/form-data: file
  // validated in-memory (MIME/size) before Cloudinary is ever reached (R1).
  @Post(':id/invoice')
  @HttpCode(200)
  @Roles('DIRECTOR_OPS')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadInvoice(
    @Param('id') id: string,
    @UploadedFile(createInvoiceFilePipe())
    file: Express.Multer.File,
    @Body() dto: UploadInvoiceDto,
    @Req() request: RequestWithSession,
  ): Promise<OdcResponseDto> {
    try {
      const order = await this.uploadInvoiceUseCase.execute(
        id,
        actorFrom(request),
        {
          buffer: file.buffer,
          mimeType: file.mimetype,
          warehouseEntryDate: dto.warehouseEntryDate,
          invoiceNumber: dto.invoiceNumber,
          invoiceDate: dto.invoiceDate,
          observations: dto.observations,
        },
      );
      return toOdcResponse(order);
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
  ): Promise<OdcResponseDto> {
    try {
      const order = await this.updateDraftUseCase.execute(
        id,
        dto,
        actorFrom(request),
      );
      return toOdcResponse(order);
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
  ): Promise<OdcPageResponseDto> {
    const page = await this.listOdcsUseCase.execute(
      {
        status: query.status,
        page: query.page !== undefined ? Number(query.page) : undefined,
      },
      actorFrom(request),
    );
    return toOdcPageResponse(page);
  }

  // R7: generalized download route, dispatching to GetPaymentEvidenceFileUseCase
  // (kind=evidence) or GetInvoiceFileUseCase (kind=invoice); any other kind is
  // a 400 before either use-case is invoked. Same literal segments as the
  // former :id/files/evidence route, so no existing client URL changes.
  // No @Roles: any authenticated role may follow this redirect once the ODC
  // itself is visible to them (R5/R6).
  @Get(':id/files/:kind')
  @Redirect()
  async getOdcFile(
    @Param('id') id: string,
    @Param('kind') kind: string,
    @Req() request: RequestWithSession,
  ): Promise<{ url: string; statusCode: number }> {
    if (kind !== 'evidence' && kind !== 'invoice') {
      throw new BadRequestException(`Unsupported file kind: ${kind}`);
    }
    try {
      const url =
        kind === 'evidence'
          ? await this.getPaymentEvidenceFileUseCase.execute(
              id,
              actorFrom(request),
            )
          : await this.getInvoiceFileUseCase.execute(id, actorFrom(request));
      return { url, statusCode: HttpStatus.FOUND };
    } catch (error) {
      rethrowDomainError(error);
    }
  }

  // No @Roles: the 3 roles may view a detail; visibility of BORRADOR is
  // enforced by the use-case (R13).
  @Get(':id')
  async detail(
    @Param('id') id: string,
    @Req() request: RequestWithSession,
  ): Promise<OdcResponseDto> {
    try {
      const order = await this.getOdcUseCase.execute(id, actorFrom(request));
      return toOdcResponse(order);
    } catch (error) {
      rethrowDomainError(error);
    }
  }
}
