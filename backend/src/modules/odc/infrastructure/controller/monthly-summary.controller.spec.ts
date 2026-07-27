import { RequestMethod } from '@nestjs/common';
import { ROLES_KEY } from '../../../auth/infrastructure/decorators/roles.decorator';
import { OdcController } from './odc.controller';

function handler(name: string): object {
  return Object.getOwnPropertyDescriptor(OdcController.prototype, name)
    ?.value as object;
}

describe('R1,R4: GET /api/odcs/monthly-summary', () => {
  it('is a DIRECTOR_OPS-only GET endpoint and forwards the validated month', async () => {
    const execute = jest.fn().mockResolvedValue({
      month: '2026-07',
      totalCents: 0,
      purchaseCount: 0,
      averageTicketCents: 0,
      averageWarehouseDays: null,
      stages: [],
      purchases: [],
    });
    const Constructor = OdcController as unknown as new (
      ...dependencies: unknown[]
    ) => OdcController;
    const controller = new Constructor(
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      { execute },
    );

    expect(Reflect.getMetadata('path', handler('monthlySummary'))).toBe(
      'monthly-summary',
    );
    expect(Reflect.getMetadata('method', handler('monthlySummary'))).toBe(
      RequestMethod.GET,
    );
    expect(Reflect.getMetadata(ROLES_KEY, handler('monthlySummary'))).toEqual([
      'DIRECTOR_OPS',
    ]);
    await expect(
      controller.monthlySummary({ month: '2026-07' }),
    ).resolves.toMatchObject({ month: '2026-07' });
    expect(execute).toHaveBeenCalledWith('2026-07');
  });
});
