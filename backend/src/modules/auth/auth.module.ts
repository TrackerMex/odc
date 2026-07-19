import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
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
  providers: [LoginUseCase],
})
export class AuthModule {}
