import { ClassProvider } from '@nestjs/common';
import { PurchaseOrderTypeOrmRepository } from './infrastructure/repositories/purchase-order.typeorm.repository';
import { OdcModule } from './odc.module';

describe("R5: OdcModule registers the repository under the 'PurchaseOrderRepository' token", () => {
  it("provides PurchaseOrderTypeOrmRepository under the string token 'PurchaseOrderRepository'", () => {
    const providers = (Reflect.getMetadata('providers', OdcModule) ??
      []) as unknown[];
    const repositoryProvider = providers.find(
      (provider): provider is ClassProvider =>
        typeof provider === 'object' &&
        provider !== null &&
        (provider as ClassProvider).provide === 'PurchaseOrderRepository',
    );

    expect(repositoryProvider).toBeDefined();
    expect(repositoryProvider?.useClass).toBe(PurchaseOrderTypeOrmRepository);
  });
});
