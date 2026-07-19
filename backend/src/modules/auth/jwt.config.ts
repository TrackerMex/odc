import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export function jwtModuleOptionsFactory(
  configService: ConfigService,
): JwtModuleOptions {
  return {
    secret: configService.get<string>('JWT_SECRET'),
    signOptions: { expiresIn: '8h' },
  };
}
