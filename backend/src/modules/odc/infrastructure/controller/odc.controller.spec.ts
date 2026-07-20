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
import { ApproveBudgetUseCase } from '../../application/use-cases/approve-budget.usecase';
import { CreateDraftUseCase } from '../../application/use-cases/create-draft.usecase';
import { GetOdcUseCase } from '../../application/use-cases/get-odc.usecase';
import { ListOdcsUseCase } from '../../application/use-cases/list-odcs.usecase';
import { SubmitOdcUseCase } from '../../application/use-cases/submit-odc.usecase';
import { UpdateDraftUseCase } from '../../application/use-cases/update-draft.usecase';
import { OdcController } from './odc.controller';

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
  return new OdcController(
    createDraftUseCase,
    submitOdcUseCase,
    updateDraftUseCase,
    listOdcsUseCase,
    getOdcUseCase,
    approveBudgetUseCase,
  );
}

function sessionUser(role = 'DIRECTOR_OPS' as const) {
  return { user: { sub: OPS_ID, role } };
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
    const createdOrder = { status: 'BORRADOR' } as PurchaseOrder;
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
    expect(body).toBe(createdOrder);
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
    const submitted = { status: 'PENDIENTE_ADMIN' } as PurchaseOrder;
    const execute = jest.fn().mockResolvedValue(submitted);
    const controller = createController({ submitOdcUseCase: { execute } });

    const body = await controller.submit(ODC_ID, sessionUser());

    expect(execute).toHaveBeenCalledWith(ODC_ID, {
      userId: OPS_ID,
      role: 'DIRECTOR_OPS',
    });
    expect(body).toBe(submitted);
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
    const updated = { status: 'BORRADOR', totalCents: 8000 } as PurchaseOrder;
    const execute = jest.fn().mockResolvedValue(updated);
    const controller = createController({ updateDraftUseCase: { execute } });
    const dto = { quantity: 4, unitPriceCents: 2000 };

    const body = await controller.update(ODC_ID, dto, sessionUser());

    expect(execute).toHaveBeenCalledWith(ODC_ID, dto, {
      userId: OPS_ID,
      role: 'DIRECTOR_OPS',
    });
    expect(body).toBe(updated);
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
    expect(body).toBe(page);
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
    const detail = { status: 'PENDIENTE_ADMIN' } as PurchaseOrder;
    const execute = jest.fn().mockResolvedValue(detail);
    const controller = createController({ getOdcUseCase: { execute } });

    const body = await controller.detail(ODC_ID, sessionUser());

    expect(execute).toHaveBeenCalledWith(ODC_ID, {
      userId: OPS_ID,
      role: 'DIRECTOR_OPS',
    });
    expect(body).toBe(detail);
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

describe('R1: POST /api/odcs/:id/approve-budget approves the budget with 200 restricted to ADMINISTRACION', () => {
  it("exposes the handler as POST on ':id/approve-budget' with HTTP 200 restricted to ADMINISTRACION", () => {
    const handler = getHandler('approveBudget');
    expect(Reflect.getMetadata('path', handler)).toBe(':id/approve-budget');
    expect(Reflect.getMetadata('method', handler)).toBe(RequestMethod.POST);
    expect(Reflect.getMetadata('__httpCode__', handler)).toBe(200);
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual([
      'ADMINISTRACION',
    ]);
  });

  it('delegates to the approve-budget use-case with the id and the session actor', async () => {
    const approved = { status: 'PRESUPUESTO_APROBADO' } as PurchaseOrder;
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
    expect(body).toBe(approved);
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
