import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ClassProvider } from '@nestjs/common';
import { AppModule } from '../../../../app.module';
import { HealthController } from '../../../../health.controller';
import { AuthController } from '../controller/auth.controller';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SESSION_COOKIE_NAME } from '../session-cookie';
import { JwtAuthGuard } from './jwt-auth.guard';

interface RequestMock {
  cookies?: Record<string, string>;
  user?: unknown;
}

function createExecutionContext(request: RequestMock): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => 'handler',
    getClass: () => 'class',
  } as unknown as ExecutionContext;
}

function createReflectorMock(isPublic: boolean): Reflector {
  return {
    getAllAndOverride: jest.fn().mockReturnValue(isPublic),
  } as unknown as Reflector;
}

describe('R8: JwtAuthGuard rejects requests without a valid session JWT', () => {
  it('throws 401 when the session cookie is absent', async () => {
    const jwtService = {
      verifyAsync: jest.fn(),
    } as unknown as JwtService;
    const guard = new JwtAuthGuard(jwtService, createReflectorMock(false));

    await expect(
      guard.canActivate(createExecutionContext({ cookies: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws 401 when the token is invalid or expired', async () => {
    const jwtService = {
      verifyAsync: jest.fn().mockRejectedValue(new Error('jwt expired')),
    } as unknown as JwtService;
    const guard = new JwtAuthGuard(jwtService, createReflectorMock(false));

    await expect(
      guard.canActivate(
        createExecutionContext({
          cookies: { [SESSION_COOKIE_NAME]: 'tampered-token' },
        }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('lets a valid token pass and attaches the payload to request.user', async () => {
    const payload = { sub: 'user-id', role: 'DIRECTOR_OPS' };
    const jwtService = {
      verifyAsync: jest.fn().mockResolvedValue(payload),
    } as unknown as JwtService;
    const guard = new JwtAuthGuard(jwtService, createReflectorMock(false));
    const request: RequestMock = {
      cookies: { [SESSION_COOKIE_NAME]: 'valid-token' },
    };

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).resolves.toBe(true);
    expect(request.user).toEqual(payload);
  });

  it('lets a handler marked with @Public() pass without any token', async () => {
    const jwtService = {
      verifyAsync: jest.fn(),
    } as unknown as JwtService;
    const reflector = createReflectorMock(true);
    const guard = new JwtAuthGuard(jwtService, reflector);

    await expect(
      guard.canActivate(createExecutionContext({ cookies: {} })),
    ).resolves.toBe(true);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });
});

describe('R8: login and health are the only public endpoints', () => {
  it('marks POST /api/auth/login with the public metadata', () => {
    expect(
      Reflect.getMetadata(IS_PUBLIC_KEY, AuthController.prototype.login),
    ).toBe(true);
  });

  it('marks GET /api/health with the public metadata', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, HealthController)).toBe(true);
  });

  it('registers JwtAuthGuard as a global APP_GUARD in AppModule', () => {
    const providers = (Reflect.getMetadata('providers', AppModule) ??
      []) as unknown[];
    const guardProvider = providers.find(
      (provider): provider is ClassProvider =>
        typeof provider === 'object' &&
        provider !== null &&
        (provider as ClassProvider).provide === APP_GUARD &&
        (provider as ClassProvider).useClass === JwtAuthGuard,
    );

    expect(guardProvider).toBeDefined();
  });
});
