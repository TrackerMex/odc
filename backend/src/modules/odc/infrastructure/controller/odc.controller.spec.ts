import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  RequestMethod,
} from '@nestjs/common';
import { ROLES_KEY } from '../../../auth/infrastructure/decorators/roles.decorator';
import { PurchaseOrder } from '../../domain/entities/purchase-order.entity';
import { InvalidRoleTransitionError } from '../../domain/errors/invalid-role-transition.error';
import { InvalidStatusTransitionError } from '../../domain/errors/invalid-status-transition.error';
import { OdcAccessDeniedError } from '../../domain/errors/odc-access-denied.error';
import { OdcNotFoundError } from '../../domain/errors/odc-not-found.error';
import { PaymentEvidenceNotFoundError } from '../../domain/errors/payment-evidence-not-found.error';
import { ApproveBudgetUseCase } from '../../application/use-cases/approve-budget.usecase';
import { ApprovePurchaseUseCase } from '../../application/use-cases/approve-purchase.usecase';
import { CreateDraftUseCase } from '../../application/use-cases/create-draft.usecase';
import { GetOdcUseCase } from '../../application/use-cases/get-odc.usecase';
import { GetPaymentEvidenceFileUseCase } from '../../application/use-cases/get-payment-evidence-file.usecase';
import { ListOdcsUseCase } from '../../application/use-cases/list-odcs.usecase';
import { RegisterPaymentUseCase } from '../../application/use-cases/register-payment.usecase';
import { RejectOdcUseCase } from '../../application/use-cases/reject-odc.usecase';
import { SubmitOdcUseCase } from '../../application/use-cases/submit-odc.usecase';
import { UpdateDraftUseCase } from '../../application/use-cases/update-draft.usecase';
import { UploadPaymentEvidenceUseCase } from '../../application/use-cases/upload-payment-evidence.usecase';
import {
  toOdcPageResponse,
  toOdcResponse,
} from '../mappers/odc-response.mapper';
import { createPaymentEvidenceFilePipe, OdcController } from './odc.controller';

const OPS_ID = 'a3d1c9a2-0000-4000-8000-000000000001';
const ODC_ID = 'b4e2d8b3-0000-4000-8000-000000000010';

function getHandler(name: string): object {
  const descriptor = Object.getOwnPropertyDescriptor(
    OdcController.prototype,
    name,
  );
  return descriptor?.value as object;
}

interface ControllerOverrides {
  createDraftUseCase?: Partial<CreateDraftUseCase>;
  submitOdcUseCase?: Partial<SubmitOdcUseCase>;
  updateDraftUseCase?: Partial<UpdateDraftUseCase>;
  listOdcsUseCase?: Partial<ListOdcsUseCase>;
  getOdcUseCase?: Partial<GetOdcUseCase>;
  approveBudgetUseCase?: Partial<ApproveBudgetUseCase>;
  approvePurchaseUseCase?: Partial<ApprovePurchaseUseCase>;
  rejectOdcUseCase?: Partial<RejectOdcUseCase>;
  registerPaymentUseCase?: Partial<RegisterPaymentUseCase>;
  uploadPaymentEvidenceUseCase?: Partial<UploadPaymentEvidenceUseCase>;
  getPaymentEvidenceFileUseCase?: Partial<GetPaymentEvidenceFileUseCase>;
}

function createController(overrides: ControllerOverrides = {}): OdcController {
  const createDraftUseCase = (overrides.createDraftUseCase ?? {
    execute: jest.fn(),
  }) as CreateDraftUseCase;
  const submitOdcUseCase = (overrides.submitOdcUseCase ?? {
    execute: jest.fn(),
  }) as SubmitOdcUseCase;
  const updateDraftUseCase = (overrides.updateDraftUseCase ?? {
    execute: jest.fn(),
  }) as UpdateDraftUseCase;
  const listOdcsUseCase = (overrides.listOdcsUseCase ?? {
    execute: jest.fn(),
  }) as ListOdcsUseCase;
  const getOdcUseCase = (overrides.getOdcUseCase ?? {
    execute: jest.fn(),
  }) as GetOdcUseCase;
  const approveBudgetUseCase = (overrides.approveBudgetUseCase ?? {
    execute: jest.fn(),
  }) as ApproveBudgetUseCase;
  const approvePurchaseUseCase = (overrides.approvePurchaseUseCase ?? {
    execute: jest.fn(),
  }) as ApprovePurchaseUseCase;
  const rejectOdcUseCase = (overrides.rejectOdcUseCase ?? {
    execute: jest.fn(),
  }) as RejectOdcUseCase;
  const registerPaymentUseCase = (overrides.registerPaymentUseCase ?? {
    execute: jest.fn(),
  }) as RegisterPaymentUseCase;
  const uploadPaymentEvidenceUseCase =
    (overrides.uploadPaymentEvidenceUseCase ?? {
      execute: jest.fn(),
    }) as UploadPaymentEvidenceUseCase;
  const getPaymentEvidenceFileUseCase =
    (overrides.getPaymentEvidenceFileUseCase ?? {
      execute: jest.fn(),
    }) as GetPaymentEvidenceFileUseCase;
  return new OdcController(
    createDraftUseCase,
    submitOdcUseCase,
    updateDraftUseCase,
    listOdcsUseCase,
    getOdcUseCase,
    approveBudgetUseCase,
    approvePurchaseUseCase,
    rejectOdcUseCase,
    registerPaymentUseCase,
    uploadPaymentEvidenceUseCase,
    getPaymentEvidenceFileUseCase,
  );
}

function sessionUser(role = 'DIRECTOR_OPS' as const) {
  return { user: { sub: OPS_ID, role } };
}

function buildMulterFile(
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'evidence.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 2048,
    buffer: Buffer.from('%PDF-1.4 fake evidence'),
    stream: undefined as never,
    destination: '',
    filename: '',
    path: '',
    ...overrides,
  };
}

describe('R7: POST /api/odcs creates a draft only for DIRECTOR_OPS with 201', () => {
  it("exposes the handler as POST on the 'odcs' route restricted to DIRECTOR_OPS", () => {
    expect(Reflect.getMetadata('path', OdcController)).toBe('odcs');
    const handler = getHandler('create');
    expect(Reflect.getMetadata('path', handler)).toBe('/');
    expect(Reflect.getMetadata('method', handler)).toBe(RequestMethod.POST);
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual(['DIRECTOR_OPS']);
    // No @HttpCode override: NestJS answers POST with 201 by default.
    expect(Reflect.getMetadata('__httpCode__', handler)).toBeUndefined();
  });

  it('delegates to the use-case with the dto and the session actor and returns the created ODC', async () => {
    const createdOrder = {
      status: 'BORRADOR',
      paymentEvidenceFile: null,
    } as PurchaseOrder;
    const execute = jest.fn().mockResolvedValue(createdOrder);
    const controller = createController({
      createDraftUseCase: { execute },
    });
    const dto = {
      description: 'Cemento gris 50kg',
      quantity: 10,
      unit: 'bulto',
      unitPriceCents: 18550,
      supplier: 'CEMEX',
    };

    const body = await controller.create(dto, sessionUser());

    expect(execute).toHaveBeenCalledWith(dto, {
      userId: OPS_ID,
      role: 'DIRECTOR_OPS',
    });
    expect(body).toEqual(toOdcResponse(createdOrder));
  });

  it('translates the role domain error into a 403 ForbiddenException', async () => {
    const controller = createController({
      createDraftUseCase: {
        execute: jest
          .fn()
          .mockRejectedValue(
            new InvalidRoleTransitionError('create', 'ADMINISTRACION'),
          ),
      },
    });

    await expect(
      controller.create(
        {
          description: 'Cemento gris 50kg',
          quantity: 10,
          unit: 'bulto',
          unitPriceCents: 18550,
          supplier: 'CEMEX',
        },
        sessionUser(),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lets unknown errors bubble up untranslated', async () => {
    const failure = new Error('database is down');
    const controller = createController({
      createDraftUseCase: { execute: jest.fn().mockRejectedValue(failure) },
    });

    await expect(
      controller.create(
        {
          description: 'Cemento gris 50kg',
          quantity: 10,
          unit: 'bulto',
          unitPriceCents: 18550,
          supplier: 'CEMEX',
        },
        sessionUser(),
      ),
    ).rejects.toBe(failure);
    await expect(
      controller.create(
        {
          description: 'Cemento gris 50kg',
          quantity: 10,
          unit: 'bulto',
          unitPriceCents: 18550,
          supplier: 'CEMEX',
        },
        sessionUser(),
      ),
    ).rejects.not.toBeInstanceOf(ConflictException);
  });
});

describe('R9: POST /api/odcs/:id/submit sends the ODC to admin review with 200', () => {
  it("exposes the handler as POST on ':id/submit' with HTTP 200 restricted to DIRECTOR_OPS", () => {
    const handler = getHandler('submit');
    expect(Reflect.getMetadata('path', handler)).toBe(':id/submit');
    expect(Reflect.getMetadata('method', handler)).toBe(RequestMethod.POST);
    expect(Reflect.getMetadata('__httpCode__', handler)).toBe(200);
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual(['DIRECTOR_OPS']);
  });

  it('delegates to the submit use-case with the id and the session actor', async () => {
    const submitted = {
      status: 'PENDIENTE_ADMIN',
      paymentEvidenceFile: null,
    } as PurchaseOrder;
    const execute = jest.fn().mockResolvedValue(submitted);
    const controller = createController({ submitOdcUseCase: { execute } });

    const body = await controller.submit(ODC_ID, sessionUser());

    expect(execute).toHaveBeenCalledWith(ODC_ID, {
      userId: OPS_ID,
      role: 'DIRECTOR_OPS',
    });
    expect(body).toEqual(toOdcResponse(submitted));
  });

  it('translates the access-denied domain error into a 403 ForbiddenException', async () => {
    const controller = createController({
      submitOdcUseCase: {
        execute: jest
          .fn()
          .mockRejectedValue(new OdcAccessDeniedError('not the creator')),
      },
    });

    await expect(
      controller.submit(ODC_ID, sessionUser()),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('R10: submit from a non-submittable status responds 409', () => {
  it('translates the status domain error into a 409 ConflictException', async () => {
    const controller = createController({
      submitOdcUseCase: {
        execute: jest
          .fn()
          .mockRejectedValue(
            new InvalidStatusTransitionError('submit', 'COMPLETADA'),
          ),
      },
    });

    await expect(
      controller.submit(ODC_ID, sessionUser()),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('R11: PATCH /api/odcs/:id edits an editable ODC for its creator', () => {
  it("exposes the handler as PATCH on ':id' restricted to DIRECTOR_OPS", () => {
    const handler = getHandler('update');
    expect(Reflect.getMetadata('path', handler)).toBe(':id');
    expect(Reflect.getMetadata('method', handler)).toBe(RequestMethod.PATCH);
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual(['DIRECTOR_OPS']);
  });

  it('delegates to the update use-case with the id, dto and session actor', async () => {
    const updated = {
      status: 'BORRADOR',
      totalCents: 8000,
      paymentEvidenceFile: null,
    } as PurchaseOrder;
    const execute = jest.fn().mockResolvedValue(updated);
    const controller = createController({ updateDraftUseCase: { execute } });
    const dto = { quantity: 4, unitPriceCents: 2000 };

    const body = await controller.update(ODC_ID, dto, sessionUser());

    expect(execute).toHaveBeenCalledWith(ODC_ID, dto, {
      userId: OPS_ID,
      role: 'DIRECTOR_OPS',
    });
    expect(body).toEqual(toOdcResponse(updated));
  });

  it('translates the status domain error into a 409 ConflictException', async () => {
    const controller = createController({
      updateDraftUseCase: {
        execute: jest
          .fn()
          .mockRejectedValue(
            new InvalidStatusTransitionError('edit', 'COMPLETADA'),
          ),
      },
    });

    await expect(
      controller.update(ODC_ID, { quantity: 4 }, sessionUser()),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('R12: GET /api/odcs lists ODCs for any authenticated role', () => {
  it('exposes the handler as GET on the collection without extra role restriction', () => {
    const handler = getHandler('list');
    expect(Reflect.getMetadata('path', handler)).toBe('/');
    expect(Reflect.getMetadata('method', handler)).toBe(RequestMethod.GET);
    // Session-only endpoint: the 3 roles may list, so no @Roles metadata.
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toBeUndefined();
  });

  it('delegates to the list use-case with the parsed query and session actor', async () => {
    const page = { items: [], total: 0, page: 2, pageSize: 20 };
    const execute = jest.fn().mockResolvedValue(page);
    const controller = createController({ listOdcsUseCase: { execute } });

    const body = await controller.list(
      { status: 'PENDIENTE_ADMIN', page: '2' },
      sessionUser(),
    );

    expect(execute).toHaveBeenCalledWith(
      { status: 'PENDIENTE_ADMIN', page: 2 },
      { userId: OPS_ID, role: 'DIRECTOR_OPS' },
    );
    expect(body).toEqual(toOdcPageResponse(page));
  });

  it('omits page when the query does not include it', async () => {
    const execute = jest
      .fn()
      .mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
    const controller = createController({ listOdcsUseCase: { execute } });

    await controller.list({}, sessionUser());

    expect(execute).toHaveBeenCalledWith(
      { status: undefined, page: undefined },
      { userId: OPS_ID, role: 'DIRECTOR_OPS' },
    );
  });
});

describe('R13: GET /api/odcs/:id returns the detail with history for any authenticated role', () => {
  it("exposes the handler as GET on ':id' without extra role restriction", () => {
    const handler = getHandler('detail');
    expect(Reflect.getMetadata('path', handler)).toBe(':id');
    expect(Reflect.getMetadata('method', handler)).toBe(RequestMethod.GET);
    // Session-only endpoint: the 3 roles may view a detail, so no @Roles.
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toBeUndefined();
  });

  it('delegates to the get-odc use-case with the id and the session actor', async () => {
    const detail = {
      status: 'PENDIENTE_ADMIN',
      paymentEvidenceFile: null,
    } as PurchaseOrder;
    const execute = jest.fn().mockResolvedValue(detail);
    const controller = createController({ getOdcUseCase: { execute } });

    const body = await controller.detail(ODC_ID, sessionUser());

    expect(execute).toHaveBeenCalledWith(ODC_ID, {
      userId: OPS_ID,
      role: 'DIRECTOR_OPS',
    });
    expect(body).toEqual(toOdcResponse(detail));
  });

  it('translates the not-found domain error into a 404 NotFoundException', async () => {
    const controller = createController({
      getOdcUseCase: {
        execute: jest.fn().mockRejectedValue(new OdcNotFoundError(ODC_ID)),
      },
    });

    await expect(
      controller.detail(ODC_ID, sessionUser()),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('translates the access-denied domain error into a 403 ForbiddenException', async () => {
    const controller = createController({
      getOdcUseCase: {
        execute: jest
          .fn()
          .mockRejectedValue(
            new OdcAccessDeniedError('This ODC draft is not visible to you'),
          ),
      },
    });

    await expect(
      controller.detail(ODC_ID, sessionUser()),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('R4: GET /api/odcs/:id detail never exposes the raw paymentEvidenceFile (odc-payment-evidence)', () => {
  it('replaces paymentEvidenceFile with hasPaymentEvidence: true in the response body', async () => {
    const detail = {
      status: 'EVIDENCIA_PAGO_SUBIDA',
      paymentEvidenceFile: 'odc/ODC-2026-00001/evidence/abc123',
    } as PurchaseOrder;
    const execute = jest.fn().mockResolvedValue(detail);
    const controller = createController({ getOdcUseCase: { execute } });

    const body = await controller.detail(ODC_ID, sessionUser());

    expect(body).not.toHaveProperty('paymentEvidenceFile');
    expect(body).toHaveProperty('hasPaymentEvidence', true);
    expect(JSON.stringify(body)).not.toContain(
      'odc/ODC-2026-00001/evidence/abc123',
    );
  });
});

describe('R1: POST /api/odcs/:id/approve-budget approves the budget with 200 restricted to ADMINISTRACION', () => {
  it("exposes the handler as POST on ':id/approve-budget' with HTTP 200 restricted to ADMINISTRACION", () => {
    const handler = getHandler('approveBudget');
    expect(Reflect.getMetadata('path', handler)).toBe(':id/approve-budget');
    expect(Reflect.getMetadata('method', handler)).toBe(RequestMethod.POST);
    expect(Reflect.getMetadata('__httpCode__', handler)).toBe(200);
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual(['ADMINISTRACION']);
  });

  it('delegates to the approve-budget use-case with the id and the session actor', async () => {
    const approved = {
      status: 'PRESUPUESTO_APROBADO',
      paymentEvidenceFile: null,
    } as PurchaseOrder;
    const execute = jest.fn().mockResolvedValue(approved);
    const controller = createController({ approveBudgetUseCase: { execute } });

    const body = await controller.approveBudget(
      ODC_ID,
      sessionUser('ADMINISTRACION'),
    );

    expect(execute).toHaveBeenCalledWith(ODC_ID, {
      userId: OPS_ID,
      role: 'ADMINISTRACION',
    });
    expect(body).toEqual(toOdcResponse(approved));
  });

  it('translates the role domain error into a 403 ForbiddenException', async () => {
    const controller = createController({
      approveBudgetUseCase: {
        execute: jest
          .fn()
          .mockRejectedValue(
            new InvalidRoleTransitionError('approve_budget', 'DIRECTOR_OPS'),
          ),
      },
    });

    await expect(
      controller.approveBudget(ODC_ID, sessionUser()),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('R2: approve-budget responds 404 for an unknown id and 409 outside PENDIENTE_ADMIN', () => {
  it('translates the not-found domain error into a 404 NotFoundException', async () => {
    const controller = createController({
      approveBudgetUseCase: {
        execute: jest.fn().mockRejectedValue(new OdcNotFoundError(ODC_ID)),
      },
    });

    await expect(
      controller.approveBudget(ODC_ID, sessionUser('ADMINISTRACION')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('translates the status domain error into a 409 ConflictException', async () => {
    const controller = createController({
      approveBudgetUseCase: {
        execute: jest
          .fn()
          .mockRejectedValue(
            new InvalidStatusTransitionError('approve_budget', 'BORRADOR'),
          ),
      },
    });

    await expect(
      controller.approveBudget(ODC_ID, sessionUser('ADMINISTRACION')),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('R4: POST /api/odcs/:id/reject rejects an ODC with 200 restricted to ADMINISTRACION', () => {
  it("exposes the handler as POST on ':id/reject' with HTTP 200 restricted to ADMINISTRACION", () => {
    const handler = getHandler('reject');
    expect(Reflect.getMetadata('path', handler)).toBe(':id/reject');
    expect(Reflect.getMetadata('method', handler)).toBe(RequestMethod.POST);
    expect(Reflect.getMetadata('__httpCode__', handler)).toBe(200);
    // ROLES_KEY updated to ['ADMINISTRACION', 'DIRECTOR_GENERAL']: R3 of
    // odc-purchase-approval (already reviewed/approved) widened this handler's
    // roles after this test was originally written for odc-budget-validation.
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual([
      'ADMINISTRACION',
      'DIRECTOR_GENERAL',
    ]);
  });

  it('delegates to the reject use-case with the id, the dto and the session actor', async () => {
    const rejected = {
      status: 'RECHAZADA',
      rejectionReason: 'Presupuesto excedido',
      paymentEvidenceFile: null,
    } as PurchaseOrder;
    const execute = jest.fn().mockResolvedValue(rejected);
    const controller = createController({ rejectOdcUseCase: { execute } });
    const dto = { rejectionReason: 'Presupuesto excedido' };

    const body = await controller.reject(
      ODC_ID,
      dto,
      sessionUser('ADMINISTRACION'),
    );

    expect(execute).toHaveBeenCalledWith(
      ODC_ID,
      { userId: OPS_ID, role: 'ADMINISTRACION' },
      dto,
    );
    expect(body).toEqual(toOdcResponse(rejected));
  });

  it('translates the role domain error into a 403 ForbiddenException', async () => {
    const controller = createController({
      rejectOdcUseCase: {
        execute: jest
          .fn()
          .mockRejectedValue(
            new InvalidRoleTransitionError('reject', 'DIRECTOR_OPS'),
          ),
      },
    });

    await expect(
      controller.reject(
        ODC_ID,
        { rejectionReason: 'Presupuesto excedido' },
        sessionUser(),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('R5: reject responds 404 for an unknown id, 409 without a rejection rule and 403 on PRESUPUESTO_APROBADO for ADMINISTRACION', () => {
  it('translates the not-found domain error into a 404 NotFoundException', async () => {
    const controller = createController({
      rejectOdcUseCase: {
        execute: jest.fn().mockRejectedValue(new OdcNotFoundError(ODC_ID)),
      },
    });

    await expect(
      controller.reject(
        ODC_ID,
        { rejectionReason: 'Presupuesto excedido' },
        sessionUser('ADMINISTRACION'),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('translates the status domain error into a 409 ConflictException', async () => {
    const controller = createController({
      rejectOdcUseCase: {
        execute: jest
          .fn()
          .mockRejectedValue(
            new InvalidStatusTransitionError('reject', 'BORRADOR'),
          ),
      },
    });

    await expect(
      controller.reject(
        ODC_ID,
        { rejectionReason: 'Presupuesto excedido' },
        sessionUser('ADMINISTRACION'),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('translates the role domain error into a 403 ForbiddenException when ADMINISTRACION targets PRESUPUESTO_APROBADO (T6 reserved to DIRECTOR_GENERAL)', async () => {
    const controller = createController({
      rejectOdcUseCase: {
        execute: jest
          .fn()
          .mockRejectedValue(
            new InvalidRoleTransitionError('reject', 'ADMINISTRACION'),
          ),
      },
    });

    await expect(
      controller.reject(
        ODC_ID,
        { rejectionReason: 'Presupuesto excedido' },
        sessionUser('ADMINISTRACION'),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('R1: POST /api/odcs/:id/approve-purchase approves the purchase with 200 restricted to DIRECTOR_GENERAL', () => {
  it("exposes the handler as POST on ':id/approve-purchase' with HTTP 200 restricted to DIRECTOR_GENERAL", () => {
    const handler = getHandler('approvePurchase');
    expect(Reflect.getMetadata('path', handler)).toBe(':id/approve-purchase');
    expect(Reflect.getMetadata('method', handler)).toBe(RequestMethod.POST);
    expect(Reflect.getMetadata('__httpCode__', handler)).toBe(200);
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual([
      'DIRECTOR_GENERAL',
    ]);
  });

  it('delegates to the approve-purchase use-case with the id and the session actor', async () => {
    const approved = {
      status: 'COMPRA_APROBADA',
      paymentEvidenceFile: null,
    } as PurchaseOrder;
    const execute = jest.fn().mockResolvedValue(approved);
    const controller = createController({
      approvePurchaseUseCase: { execute },
    });

    const body = await controller.approvePurchase(
      ODC_ID,
      sessionUser('DIRECTOR_GENERAL'),
    );

    expect(execute).toHaveBeenCalledWith(ODC_ID, {
      userId: OPS_ID,
      role: 'DIRECTOR_GENERAL',
    });
    expect(body).toEqual(toOdcResponse(approved));
  });

  it('translates the role domain error into a 403 ForbiddenException', async () => {
    const controller = createController({
      approvePurchaseUseCase: {
        execute: jest
          .fn()
          .mockRejectedValue(
            new InvalidRoleTransitionError('approve_purchase', 'DIRECTOR_OPS'),
          ),
      },
    });

    await expect(
      controller.approvePurchase(ODC_ID, sessionUser()),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('R2: approve-purchase responds 404 for an unknown id and 409 outside PRESUPUESTO_APROBADO', () => {
  it('translates the not-found domain error into a 404 NotFoundException', async () => {
    const controller = createController({
      approvePurchaseUseCase: {
        execute: jest.fn().mockRejectedValue(new OdcNotFoundError(ODC_ID)),
      },
    });

    await expect(
      controller.approvePurchase(ODC_ID, sessionUser('DIRECTOR_GENERAL')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('translates the status domain error into a 409 ConflictException', async () => {
    const controller = createController({
      approvePurchaseUseCase: {
        execute: jest
          .fn()
          .mockRejectedValue(
            new InvalidStatusTransitionError('approve_purchase', 'BORRADOR'),
          ),
      },
    });

    await expect(
      controller.approvePurchase(ODC_ID, sessionUser('DIRECTOR_GENERAL')),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('R3: POST /api/odcs/:id/reject widens its roles metadata to ADMINISTRACION and DIRECTOR_GENERAL', () => {
  it("declares the 'reject' handler's ROLES_KEY metadata as exactly ['ADMINISTRACION', 'DIRECTOR_GENERAL']", () => {
    const handler = getHandler('reject');
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual([
      'ADMINISTRACION',
      'DIRECTOR_GENERAL',
    ]);
  });
});

describe('R4: POST /api/odcs/:id/reject accepts DIRECTOR_GENERAL on PRESUPUESTO_APROBADO (T6) with 200', () => {
  it("exposes the handler as POST on ':id/reject' with HTTP 200", () => {
    const handler = getHandler('reject');
    expect(Reflect.getMetadata('path', handler)).toBe(':id/reject');
    expect(Reflect.getMetadata('method', handler)).toBe(RequestMethod.POST);
    expect(Reflect.getMetadata('__httpCode__', handler)).toBe(200);
  });

  it('delegates to the reject use-case with the id, the dto and a DIRECTOR_GENERAL session actor', async () => {
    const rejected = {
      status: 'RECHAZADA',
      rejectionReason: 'Presupuesto excedido',
      paymentEvidenceFile: null,
    } as PurchaseOrder;
    const execute = jest.fn().mockResolvedValue(rejected);
    const controller = createController({ rejectOdcUseCase: { execute } });
    const dto = { rejectionReason: 'Presupuesto excedido' };

    const body = await controller.reject(
      ODC_ID,
      dto,
      sessionUser('DIRECTOR_GENERAL'),
    );

    expect(execute).toHaveBeenCalledWith(
      ODC_ID,
      { userId: OPS_ID, role: 'DIRECTOR_GENERAL' },
      dto,
    );
    expect(body).toEqual(toOdcResponse(rejected));
  });
});

describe('R5: reject regression — ADMINISTRACION on PENDIENTE_ADMIN (T4) keeps returning 200 after the R3 roles widening', () => {
  it('delegates to the reject use-case with the id, the dto and an ADMINISTRACION session actor', async () => {
    const rejected = {
      status: 'RECHAZADA',
      rejectionReason: 'Presupuesto excedido',
      paymentEvidenceFile: null,
    } as PurchaseOrder;
    const execute = jest.fn().mockResolvedValue(rejected);
    const controller = createController({ rejectOdcUseCase: { execute } });
    const dto = { rejectionReason: 'Presupuesto excedido' };

    const body = await controller.reject(
      ODC_ID,
      dto,
      sessionUser('ADMINISTRACION'),
    );

    expect(execute).toHaveBeenCalledWith(
      ODC_ID,
      { userId: OPS_ID, role: 'ADMINISTRACION' },
      dto,
    );
    expect(body).toEqual(toOdcResponse(rejected));
  });

  it('still translates the role domain error into a 403 ForbiddenException for an unrelated role', async () => {
    const controller = createController({
      rejectOdcUseCase: {
        execute: jest
          .fn()
          .mockRejectedValue(
            new InvalidRoleTransitionError('reject', 'DIRECTOR_OPS'),
          ),
      },
    });

    await expect(
      controller.reject(
        ODC_ID,
        { rejectionReason: 'Presupuesto excedido' },
        sessionUser(),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('R6: reject responds 403 on role/status mismatch (DIRECTOR_GENERAL on PENDIENTE_ADMIN, ADMINISTRACION on PRESUPUESTO_APROBADO)', () => {
  it('translates the role domain error into a 403 ForbiddenException when DIRECTOR_GENERAL targets PENDIENTE_ADMIN (T4 reserved to ADMINISTRACION)', async () => {
    const controller = createController({
      rejectOdcUseCase: {
        execute: jest
          .fn()
          .mockRejectedValue(
            new InvalidRoleTransitionError('reject', 'DIRECTOR_GENERAL'),
          ),
      },
    });

    await expect(
      controller.reject(
        ODC_ID,
        { rejectionReason: 'Presupuesto excedido' },
        sessionUser('DIRECTOR_GENERAL'),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('translates the role domain error into a 403 ForbiddenException when ADMINISTRACION targets PRESUPUESTO_APROBADO (T6 reserved to DIRECTOR_GENERAL)', async () => {
    const controller = createController({
      rejectOdcUseCase: {
        execute: jest
          .fn()
          .mockRejectedValue(
            new InvalidRoleTransitionError('reject', 'ADMINISTRACION'),
          ),
      },
    });

    await expect(
      controller.reject(
        ODC_ID,
        { rejectionReason: 'Presupuesto excedido' },
        sessionUser('ADMINISTRACION'),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('reject: 404/409 handling is unaffected by the R3 roles widening', () => {
  it('translates the not-found domain error into a 404 NotFoundException', async () => {
    const controller = createController({
      rejectOdcUseCase: {
        execute: jest.fn().mockRejectedValue(new OdcNotFoundError(ODC_ID)),
      },
    });

    await expect(
      controller.reject(
        ODC_ID,
        { rejectionReason: 'Presupuesto excedido' },
        sessionUser('ADMINISTRACION'),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('translates the status domain error into a 409 ConflictException', async () => {
    const controller = createController({
      rejectOdcUseCase: {
        execute: jest
          .fn()
          .mockRejectedValue(
            new InvalidStatusTransitionError('reject', 'BORRADOR'),
          ),
      },
    });

    await expect(
      controller.reject(
        ODC_ID,
        { rejectionReason: 'Presupuesto excedido' },
        sessionUser('ADMINISTRACION'),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('R2: POST /api/odcs/:id/payment registers the payment with 200 restricted to DIRECTOR_OPS', () => {
  it("exposes the handler as POST on ':id/payment' with HTTP 200 restricted to DIRECTOR_OPS", () => {
    const handler = getHandler('registerPayment');
    expect(Reflect.getMetadata('path', handler)).toBe(':id/payment');
    expect(Reflect.getMetadata('method', handler)).toBe(RequestMethod.POST);
    expect(Reflect.getMetadata('__httpCode__', handler)).toBe(200);
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual(['DIRECTOR_OPS']);
  });

  it('delegates to the register-payment use-case with the id, the dto and the session actor', async () => {
    const paid = {
      status: 'PAGO_REGISTRADO',
      paymentDate: '2026-07-20',
      paymentMethod: 'Transferencia',
      paymentEvidenceFile: null,
    } as PurchaseOrder;
    const execute = jest.fn().mockResolvedValue(paid);
    const controller = createController({
      registerPaymentUseCase: { execute },
    });
    const dto = { paymentDate: '2026-07-20', paymentMethod: 'Transferencia' };

    const body = await controller.registerPayment(ODC_ID, dto, sessionUser());

    expect(execute).toHaveBeenCalledWith(
      ODC_ID,
      { userId: OPS_ID, role: 'DIRECTOR_OPS' },
      dto,
    );
    expect(body).toEqual(toOdcResponse(paid));
  });

  it('translates the role domain error into a 403 ForbiddenException', async () => {
    const controller = createController({
      registerPaymentUseCase: {
        execute: jest
          .fn()
          .mockRejectedValue(
            new InvalidRoleTransitionError(
              'register_payment',
              'ADMINISTRACION',
            ),
          ),
      },
    });

    await expect(
      controller.registerPayment(
        ODC_ID,
        { paymentDate: '2026-07-20', paymentMethod: 'Transferencia' },
        sessionUser('ADMINISTRACION'),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('R3: payment responds 404 for an unknown id and 409 outside COMPRA_APROBADA', () => {
  it('translates the not-found domain error into a 404 NotFoundException', async () => {
    const controller = createController({
      registerPaymentUseCase: {
        execute: jest.fn().mockRejectedValue(new OdcNotFoundError(ODC_ID)),
      },
    });

    await expect(
      controller.registerPayment(
        ODC_ID,
        { paymentDate: '2026-07-20', paymentMethod: 'Transferencia' },
        sessionUser(),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('translates the status domain error into a 409 ConflictException', async () => {
    const controller = createController({
      registerPaymentUseCase: {
        execute: jest
          .fn()
          .mockRejectedValue(
            new InvalidStatusTransitionError('register_payment', 'BORRADOR'),
          ),
      },
    });

    await expect(
      controller.registerPayment(
        ODC_ID,
        { paymentDate: '2026-07-20', paymentMethod: 'Transferencia' },
        sessionUser(),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('R1: payment-evidence file validation (MIME/size) before Cloudinary (odc-payment-evidence)', () => {
  it('accepts a valid pdf/jpg/png file at or under 10MB', async () => {
    const pipe = createPaymentEvidenceFilePipe();

    await expect(pipe.transform(buildMulterFile())).resolves.toBeDefined();
    await expect(
      pipe.transform(buildMulterFile({ mimetype: 'image/jpeg' })),
    ).resolves.toBeDefined();
    await expect(
      pipe.transform(buildMulterFile({ mimetype: 'image/png' })),
    ).resolves.toBeDefined();
    await expect(
      pipe.transform(buildMulterFile({ size: 10 * 1024 * 1024 })),
    ).resolves.toBeDefined();
  });

  it('rejects a missing file with a 400 BadRequestException', async () => {
    const pipe = createPaymentEvidenceFilePipe();

    await expect(pipe.transform(undefined)).rejects.toMatchObject({
      status: 400,
    });
  });

  it('rejects an unsupported MIME type (text/plain) with a 400 BadRequestException', async () => {
    const pipe = createPaymentEvidenceFilePipe();

    await expect(
      pipe.transform(buildMulterFile({ mimetype: 'text/plain' })),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects a file larger than 10MB with a 400 BadRequestException', async () => {
    const pipe = createPaymentEvidenceFilePipe();

    await expect(
      pipe.transform(buildMulterFile({ size: 10 * 1024 * 1024 + 1 })),
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe('R2: POST /api/odcs/:id/payment-evidence uploads to Cloudinary with 200 restricted to ADMINISTRACION', () => {
  it("exposes the handler as POST on ':id/payment-evidence' with HTTP 200 restricted to ADMINISTRACION", () => {
    const handler = getHandler('uploadPaymentEvidence');
    expect(Reflect.getMetadata('path', handler)).toBe(':id/payment-evidence');
    expect(Reflect.getMetadata('method', handler)).toBe(RequestMethod.POST);
    expect(Reflect.getMetadata('__httpCode__', handler)).toBe(200);
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual(['ADMINISTRACION']);
  });

  it('delegates to the upload-payment-evidence use-case with the buffer/mimeType/evidenceReference and returns the updated ODC', async () => {
    const updated = {
      status: 'EVIDENCIA_PAGO_SUBIDA',
      paymentEvidenceFile: 'odc/ODC-2026-00001/evidence/abc123',
    } as PurchaseOrder;
    const execute = jest.fn().mockResolvedValue(updated);
    const controller = createController({
      uploadPaymentEvidenceUseCase: { execute },
    });
    const file = buildMulterFile();
    const dto = { evidenceReference: 'REF-EV-001' };

    const body = await controller.uploadPaymentEvidence(
      ODC_ID,
      file,
      dto,
      sessionUser('ADMINISTRACION'),
    );

    expect(execute).toHaveBeenCalledWith(
      ODC_ID,
      { userId: OPS_ID, role: 'ADMINISTRACION' },
      {
        buffer: file.buffer,
        mimeType: file.mimetype,
        evidenceReference: 'REF-EV-001',
      },
    );
    expect(body).toEqual(toOdcResponse(updated));
    expect(body).not.toHaveProperty('paymentEvidenceFile');
    expect(body).toHaveProperty('hasPaymentEvidence', true);
  });

  it('translates the role domain error into a 403 ForbiddenException without needing Cloudinary', async () => {
    const controller = createController({
      uploadPaymentEvidenceUseCase: {
        execute: jest
          .fn()
          .mockRejectedValue(
            new InvalidRoleTransitionError(
              'upload_payment_evidence',
              'DIRECTOR_OPS',
            ),
          ),
      },
    });

    await expect(
      controller.uploadPaymentEvidence(
        ODC_ID,
        buildMulterFile(),
        {},
        sessionUser(),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('R3: payment-evidence responds 404 for an unknown id and 409 outside PAGO_REGISTRADO', () => {
  it('translates the not-found domain error into a 404 NotFoundException', async () => {
    const controller = createController({
      uploadPaymentEvidenceUseCase: {
        execute: jest.fn().mockRejectedValue(new OdcNotFoundError(ODC_ID)),
      },
    });

    await expect(
      controller.uploadPaymentEvidence(
        ODC_ID,
        buildMulterFile(),
        {},
        sessionUser('ADMINISTRACION'),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('translates the status domain error into a 409 ConflictException', async () => {
    const controller = createController({
      uploadPaymentEvidenceUseCase: {
        execute: jest
          .fn()
          .mockRejectedValue(
            new InvalidStatusTransitionError(
              'upload_payment_evidence',
              'BORRADOR',
            ),
          ),
      },
    });

    await expect(
      controller.uploadPaymentEvidence(
        ODC_ID,
        buildMulterFile(),
        {},
        sessionUser('ADMINISTRACION'),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('R5: GET /api/odcs/:id/files/evidence redirects (302) to a signed Cloudinary URL', () => {
  it("exposes the handler as GET on ':id/files/evidence' with @Redirect() metadata and no @Roles restriction", () => {
    const handler = getHandler('getPaymentEvidenceFile');
    expect(Reflect.getMetadata('path', handler)).toBe(':id/files/evidence');
    expect(Reflect.getMetadata('method', handler)).toBe(RequestMethod.GET);
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toBeUndefined();
    expect(Reflect.getMetadata('__redirect__', handler)).toBeDefined();
  });

  it('delegates to the get-payment-evidence-file use-case and redirects with statusCode 302', async () => {
    const signedUrl =
      'https://res.cloudinary.com/odc-cloud/raw/authenticated/s--signature--/abc123';
    const execute = jest.fn().mockResolvedValue(signedUrl);
    const controller = createController({
      getPaymentEvidenceFileUseCase: { execute },
    });

    const result = await controller.getPaymentEvidenceFile(
      ODC_ID,
      sessionUser(),
    );

    expect(execute).toHaveBeenCalledWith(ODC_ID, {
      userId: OPS_ID,
      role: 'DIRECTOR_OPS',
    });
    expect(result).toEqual({ url: signedUrl, statusCode: 302 });
  });
});

describe('R6: files/evidence responds 404 for an unknown id, 404 without evidence yet, and 403 on a BORRADOR of another creator', () => {
  it('translates the not-found domain error into a 404 NotFoundException', async () => {
    const controller = createController({
      getPaymentEvidenceFileUseCase: {
        execute: jest.fn().mockRejectedValue(new OdcNotFoundError(ODC_ID)),
      },
    });

    await expect(
      controller.getPaymentEvidenceFile(ODC_ID, sessionUser()),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('translates the payment-evidence-not-found domain error into a 404 NotFoundException', async () => {
    const controller = createController({
      getPaymentEvidenceFileUseCase: {
        execute: jest
          .fn()
          .mockRejectedValue(new PaymentEvidenceNotFoundError(ODC_ID)),
      },
    });

    await expect(
      controller.getPaymentEvidenceFile(ODC_ID, sessionUser()),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('translates the access-denied domain error into a 403 ForbiddenException', async () => {
    const controller = createController({
      getPaymentEvidenceFileUseCase: {
        execute: jest
          .fn()
          .mockRejectedValue(
            new OdcAccessDeniedError('This ODC draft is not visible to you'),
          ),
      },
    });

    await expect(
      controller.getPaymentEvidenceFile(ODC_ID, sessionUser()),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
