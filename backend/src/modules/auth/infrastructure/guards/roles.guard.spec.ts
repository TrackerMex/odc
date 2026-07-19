import {
  ClassProvider,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { AppModule } from '../../../../app.module';
import { ROLES_KEY, Roles } from '../decorators/roles.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

function createExecutionContext(user?: {
  sub: string;
  role: string;
}): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => 'handler',
    getClass: () => 'class',
  } as unknown as ExecutionContext;
}

function createReflectorMock(roles: string[] | undefined): Reflector {
  return {
    getAllAndOverride: jest.fn().mockReturnValue(roles),
  } as unknown as Reflector;
}

describe('R9: RolesGuard enforces @Roles(...) metadata', () => {
  it('throws 403 when the JWT role is not in the declared list', () => {
    const guard = new RolesGuard(createReflectorMock(['DIRECTOR_GENERAL']));
    const context = createExecutionContext({
      sub: 'user-id',
      role: 'DIRECTOR_OPS',
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('lets the request proceed when the JWT role is in the list', () => {
    const guard = new RolesGuard(
      createReflectorMock(['DIRECTOR_OPS', 'ADMINISTRACION']),
    );
    const context = createExecutionContext({
      sub: 'user-id',
      role: 'DIRECTOR_OPS',
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('lets the request proceed when the endpoint declares no roles', () => {
    const guard = new RolesGuard(createReflectorMock(undefined));
    const context = createExecutionContext({
      sub: 'user-id',
      role: 'DIRECTOR_OPS',
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('@Roles(...) stores the role list under the roles metadata key', () => {
    class Dummy {
      @Roles('DIRECTOR_GENERAL', 'ADMINISTRACION')
      handler(): void {}
    }

    expect(Reflect.getMetadata(ROLES_KEY, Dummy.prototype.handler)).toEqual([
      'DIRECTOR_GENERAL',
      'ADMINISTRACION',
    ]);
  });

  it('registers RolesGuard as a global APP_GUARD evaluated after JwtAuthGuard', () => {
    const providers = (Reflect.getMetadata('providers', AppModule) ??
      []) as unknown[];
    const guardClasses = providers
      .filter(
        (provider): provider is ClassProvider =>
          typeof provider === 'object' &&
          provider !== null &&
          (provider as ClassProvider).provide === APP_GUARD,
      )
      .map((provider) => provider.useClass);

    expect(guardClasses).toEqual([JwtAuthGuard, RolesGuard]);
  });
});
