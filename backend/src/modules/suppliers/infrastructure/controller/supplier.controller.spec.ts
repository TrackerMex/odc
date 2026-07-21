import { RequestMethod } from '@nestjs/common';
import { ROLES_KEY } from '../../../auth/infrastructure/decorators/roles.decorator';
import { Supplier } from '../../domain/entities/supplier.entity';
import { ListSuppliersUseCase } from '../../application/use-cases/list-suppliers.usecase';
import { SupplierController } from './supplier.controller';

function getHandler(name: string): object {
  const descriptor = Object.getOwnPropertyDescriptor(
    SupplierController.prototype,
    name,
  );
  return descriptor?.value as object;
}

describe('R4: GET /api/suppliers lists the catalog for any authenticated role', () => {
  it("exposes the handler as GET on the 'suppliers' route without @Roles restriction", () => {
    expect(Reflect.getMetadata('path', SupplierController)).toBe('suppliers');
    const handler = getHandler('list');
    expect(Reflect.getMetadata('path', handler)).toBe('/');
    expect(Reflect.getMetadata('method', handler)).toBe(RequestMethod.GET);
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toBeUndefined();
  });

  it('delegates to the list use-case and returns id/name pairs ordered by the use-case', async () => {
    const execute = jest
      .fn()
      .mockResolvedValue([
        new Supplier('id-1', 'BSJ', null),
        new Supplier('id-2', 'Fireflux', null),
      ]);
    const controller = new SupplierController({
      execute,
    } as unknown as ListSuppliersUseCase);

    const body = await controller.list();

    expect(execute).toHaveBeenCalledTimes(1);
    expect(body).toEqual([
      { id: 'id-1', name: 'BSJ' },
      { id: 'id-2', name: 'Fireflux' },
    ]);
  });
});
