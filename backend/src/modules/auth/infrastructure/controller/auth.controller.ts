import {
  Body,
  Controller,
  HttpCode,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { LoginDto } from '../../application/dto/login.dto';
import {
  AuthenticatedUser,
  LoginResult,
  LoginUseCase,
} from '../../application/use-cases/login.usecase';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';
import { Public } from '../decorators/public.decorator';
import { SESSION_COOKIE_NAME, sessionCookieOptions } from '../session-cookie';

@Controller('auth')
export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

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
}
