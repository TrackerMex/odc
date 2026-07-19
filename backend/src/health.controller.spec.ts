import { RequestMethod } from '@nestjs/common';
import { HealthController } from './health.controller';

describe("R7: GET /api/health responds { status: 'ok' }", () => {
  it("returns exactly { status: 'ok' }", () => {
    const controller = new HealthController();

    expect(controller.check()).toEqual({ status: 'ok' });
  });

  it("exposes the handler as GET on route 'health'", () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      HealthController.prototype,
      'check',
    );
    expect(descriptor).toBeDefined();
    const handler = descriptor?.value as object;

    expect(Reflect.getMetadata('path', handler)).toBe('health');
    expect(Reflect.getMetadata('method', handler)).toBe(RequestMethod.GET);
  });
});
