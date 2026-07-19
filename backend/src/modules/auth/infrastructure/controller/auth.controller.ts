import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { GetMeUseCase } from '../../application/use-cases/get-me.usecase';
import { LoginDto } from '../../application/dto/login.dto';
import {
  AuthenticatedUser,
  LoginResult,
  LoginUseCase,
} from '../../application/use-cases/login.usecase';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';
import { SessionUserNotFoundError } from '../../domain/errors/session-user-not-found.error';
import { Public } from '../decorators/public.decorator';
import type { SessionTokenPayload } from '../guards/jwt-auth.guard';
import { SESSION_COOKIE_NAME, sessionCookieOptions } from '../session-cookie';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly getMeUseCase: GetMeUseCase,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ user: AuthenticatedUser }> {
    let result: LoginResult;
    try {
      result = await this.loginUseCase.execute(dto.email, dto.password);
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        throw new UnauthorizedException(error.message);
      }
      throw error;
    }
    response.cookie(SESSION_COOKIE_NAME, result.token, sessionCookieOptions());
    return { user: result.user };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) response: Response): { success: true } {
    // Same attributes as when the cookie was set, so the browser drops it;
    // the 8h JWT expiration bounds any token that was already captured (R11).
    response.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions());
    return { success: true };
  }

  @Get('me')
  async me(
    @Req() request: { user: SessionTokenPayload },
  ): Promise<AuthenticatedUser> {
    try {
      return await this.getMeUseCase.execute(request.user.sub);
    } catch (error) {
      if (error instanceof SessionUserNotFoundError) {
        throw new UnauthorizedException(error.message);
      }
      throw error;
    }
  }
}
