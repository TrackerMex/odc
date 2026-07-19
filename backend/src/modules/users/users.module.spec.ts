import { ClassProvider } from '@nestjs/common';
import { UserTypeOrmRepository } from './infrastructure/repositories/user.typeorm.repository';
import { UsersModule } from './users.module';

describe("R2: UsersModule registers the repository under the 'UserRepository' token", () => {
  it("provides UserTypeOrmRepository under the string token 'UserRepository'", () => {
    const providers = (Reflect.getMetadata('providers', UsersModule) ??
      []) as unknown[];
    const repositoryProvider = providers.find(
      (provider): provider is ClassProvider =>
        typeof provider === 'object' &&
        provider !== null &&
        (provider as ClassProvider).provide === 'UserRepository',
    );

    expect(repositoryProvider).toBeDefined();
    expect(repositoryProvider?.useClass).toBe(UserTypeOrmRepository);
  });

  it("exports the 'UserRepository' token for other modules", () => {
    const moduleExports = (Reflect.getMetadata('exports', UsersModule) ??
      []) as unknown[];

    expect(moduleExports).toContain('UserRepository');
  });
});
