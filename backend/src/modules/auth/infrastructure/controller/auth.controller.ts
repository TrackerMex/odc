import { Body, Controller, HttpCode, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { LoginDto } from '../../application/dto/login.dto';
import {
  AuthenticatedUser,
  LoginUseCase,
} from '../../application/use-cases/login.usecase';
import { SESSION_COOKIE_NAME, sessionCookieOptions } from '../session-cookie';

@Controller('auth')
export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ user: AuthenticatedUser }> {
    const { user, token } = await this.loginUseCase.execute(
      dto.email,
      dto.password,
    );
    response.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions());
    return { user };
  }
}
