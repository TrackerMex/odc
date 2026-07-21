import { Module } from '@nestjs/common';
import {
  ConfigModule,
  ConfigModuleOptions,
  ConfigService,
} from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmModuleOptionsFactory } from './config/typeorm.config';
import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/infrastructure/guards/roles.guard';
import { OdcModule } from './modules/odc/odc.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { UsersModule } from './modules/users/users.module';

export const configModuleOptions: ConfigModuleOptions = {
  isGlobal: true,
  envFilePath: '../.env',
};

@Module({
  imports: [
    ConfigModule.forRoot(configModuleOptions),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: typeOrmModuleOptionsFactory,
    }),
    UsersModule,
    AuthModule,
    OdcModule,
    SuppliersModule,
  ],
  controllers: [HealthController],
  providers: [
    // Order matters: authentication first, then role authorization (R8, R9)
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
