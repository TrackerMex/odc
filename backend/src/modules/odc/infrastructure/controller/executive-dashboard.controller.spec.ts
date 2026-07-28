import { RequestMethod } from '@nestjs/common';
import { OdcController } from './odc.controller';

function handler(name: string): object {
  return Object.getOwnPropertyDescriptor(OdcController.prototype, name)
    ?.value as object;
}

describe('R1,R10: GET /api/odcs/executive-dashboard', () => {
  it('uses the authenticated session identity and never accepts client supplied user or role filters', async () => {
    const execute = jest.fn().mockResolvedValue({ month: '2026-07' });
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
      {},
      { execute },
    );

    expect(Reflect.getMetadata('path', handler('executiveDashboard'))).toBe(
      'executive-dashboard',
    );
    expect(Reflect.getMetadata('method', handler('executiveDashboard'))).toBe(
      RequestMethod.GET,
    );
    await expect(
      controller.executiveDashboard(
        { month: '2026-07' },
        { user: { sub: 'session-user', role: 'ADMINISTRACION' } },
      ),
    ).resolves.toEqual({ month: '2026-07' });
    expect(execute).toHaveBeenCalledWith('2026-07', {
      userId: 'session-user',
      role: 'ADMINISTRACION',
    });
  });
});
