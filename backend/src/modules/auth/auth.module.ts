import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { LoginUseCase } from './application/use-cases/login.usecase';
import { AuthController } from './infrastructure/controller/auth.controller';

@Module({
  imports: [UsersModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [LoginUseCase],
})
export class AuthModule {}
