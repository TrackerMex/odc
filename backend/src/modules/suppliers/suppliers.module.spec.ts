import { ClassProvider } from '@nestjs/common';
import { SupplierTypeOrmRepository } from './infrastructure/repositories/supplier.typeorm.repository';
import { SuppliersModule } from './suppliers.module';

describe("R2: SuppliersModule registers the repository under the 'SupplierRepository' token", () => {
  it("provides SupplierTypeOrmRepository under the string token 'SupplierRepository'", () => {
    const providers = (Reflect.getMetadata('providers', SuppliersModule) ??
      []) as unknown[];
    const repositoryProvider = providers.find(
      (provider): provider is ClassProvider =>
        typeof provider === 'object' &&
        provider !== null &&
        (provider as ClassProvider).provide === 'SupplierRepository',
    );

    expect(repositoryProvider).toBeDefined();
    expect(repositoryProvider?.useClass).toBe(SupplierTypeOrmRepository);
  });

  it("exports the 'SupplierRepository' token for other modules", () => {
    const moduleExports = (Reflect.getMetadata('exports', SuppliersModule) ??
      []) as unknown[];

    expect(moduleExports).toContain('SupplierRepository');
  });
});
