import {
  ConflictException,
  ForbiddenException,
  RequestMethod,
} from '@nestjs/common';
import { ROLES_KEY } from '../../../auth/infrastructure/decorators/roles.decorator';
import { PurchaseOrder } from '../../domain/entities/purchase-order.entity';
import { InvalidRoleTransitionError } from '../../domain/errors/invalid-role-transition.error';
import { CreateDraftUseCase } from '../../application/use-cases/create-draft.usecase';
import { OdcController } from './odc.controller';

const OPS_ID = 'a3d1c9a2-0000-4000-8000-000000000001';

function getHandler(name: string): object {
  const descriptor = Object.getOwnPropertyDescriptor(
    OdcController.prototype,
    name,
  );
  return descriptor?.value as object;
}

interface ControllerOverrides {
  createDraftUseCase?: Partial<CreateDraftUseCase>;
}

function createController(overrides: ControllerOverrides = {}): OdcController {
  const createDraftUseCase = (overrides.createDraftUseCase ?? {
    execute: jest.fn(),
  }) as CreateDraftUseCase;
  return new OdcController(createDraftUseCase);
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
