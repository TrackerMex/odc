import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function typeOrmModuleOptionsFactory(
  configService: ConfigService,
): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    url: configService.get<string>('DATABASE_URL'),
    autoLoadEntities: true,
    // Dev/test only: production will use migrations (documented debt in design.md)
    synchronize: configService.get<string>('NODE_ENV') !== 'production',
  };
}
