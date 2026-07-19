import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { UserRole } from '../../../users/domain/entities/user.entity';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SESSION_COOKIE_NAME } from '../session-cookie';

export interface SessionTokenPayload {
  sub: string;
  role: UserRole;
}

interface RequestWithSession {
  cookies?: Record<string, string>;
  user?: SessionTokenPayload;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithSession>();
    const token = request.cookies?.[SESSION_COOKIE_NAME];
    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      request.user =
        await this.jwtService.verifyAsync<SessionTokenPayload>(token);
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }
}
