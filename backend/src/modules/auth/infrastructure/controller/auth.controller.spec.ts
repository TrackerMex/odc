import { RequestMethod, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { LoginUseCase } from '../../application/use-cases/login.usecase';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';
import { SESSION_COOKIE_NAME } from '../session-cookie';
import { AuthController } from './auth.controller';

interface ResponseMock {
  cookie: jest.Mock;
  clearCookie: jest.Mock;
}

function createResponseMock(): ResponseMock {
  return {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  };
}

function createController(
  overrides: { loginUseCase?: Partial<LoginUseCase> } = {},
): AuthController {
  const loginUseCase = (overrides.loginUseCase ?? {
    execute: jest.fn(),
  }) as LoginUseCase;
  return new AuthController(loginUseCase);
}

describe('R5: POST /api/auth/login responds { user } and sets the session cookie', () => {
  const loginResult = {
    user: {
      id: 'a3d1c9a2-0000-4000-8000-000000000001',
      email: 'ops@odc.local',
      fullName: 'Operations Director',
      role: 'DIRECTOR_OPS' as const,
    },
    token: 'signed-token',
  };

  it("exposes the handler as POST on route 'login' with HTTP 200", () => {
    expect(Reflect.getMetadata('path', AuthController)).toBe('auth');
    const handler = AuthController.prototype.login;
    expect(Reflect.getMetadata('path', handler)).toBe('login');
    expect(Reflect.getMetadata('method', handler)).toBe(RequestMethod.POST);
    expect(Reflect.getMetadata('__httpCode__', handler)).toBe(200);
  });

  it('returns { user } without passwordHash', async () => {
    const controller = createController({
      loginUseCase: { execute: jest.fn().mockResolvedValue(loginResult) },
    });
    const response = createResponseMock();

    const body = await controller.login(
      { email: 'ops@odc.local', password: 'secret-password' },
      response as unknown as Response,
    );

    expect(body).toEqual({ user: loginResult.user });
    expect(body.user).not.toHaveProperty('passwordHash');
  });

  it('sets the httpOnly SameSite=Lax session cookie with the token', async () => {
    const controller = createController({
      loginUseCase: { execute: jest.fn().mockResolvedValue(loginResult) },
    });
    const response = createResponseMock();

    await controller.login(
      { email: 'ops@odc.local', password: 'secret-password' },
      response as unknown as Response,
    );

    expect(response.cookie).toHaveBeenCalledTimes(1);
    const [cookieName, cookieValue, cookieOptions] = response.cookie.mock
      .calls[0] as [string, string, Record<string, unknown>];
    expect(cookieName).toBe(SESSION_COOKIE_NAME);
    expect(cookieValue).toBe('signed-token');
    expect(cookieOptions).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
    });
  });
});

describe('R7: failed login responds 401 without setting any cookie', () => {
  it('translates InvalidCredentialsError into UnauthorizedException and sets no cookie', async () => {
    const controller = createController({
      loginUseCase: {
        execute: jest.fn().mockRejectedValue(new InvalidCredentialsError()),
      },
    });
    const response = createResponseMock();

    await expect(
      controller.login(
        { email: 'nobody@odc.local', password: 'wrong' },
        response as unknown as Response,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(response.cookie).not.toHaveBeenCalled();
  });
});
