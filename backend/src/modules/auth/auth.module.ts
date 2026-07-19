import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { GetMeUseCase } from './application/use-cases/get-me.usecase';
import { LoginUseCase } from './application/use-cases/login.usecase';
import { AuthController } from './infrastructure/controller/auth.controller';
import { jwtModuleOptionsFactory } from './jwt.config';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: jwtModuleOptionsFactory,
    }),
  ],
  controllers: [AuthController],
  providers: [LoginUseCase, GetMeUseCase],
  // JwtModule is exported so the APP_GUARD registered in AppModule can
  // resolve JwtService from the root injector (R8).
  exports: [JwtModule],
})
export class AuthModule {}
