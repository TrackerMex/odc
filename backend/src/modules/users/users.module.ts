import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedUsersUseCase } from './application/use-cases/seed-users.usecase';
import { UserOrmEntity } from './infrastructure/entities/user.orm-entity';
import { UserTypeOrmRepository } from './infrastructure/repositories/user.typeorm.repository';

@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity])],
  providers: [
    SeedUsersUseCase,
    { provide: 'UserRepository', useClass: UserTypeOrmRepository },
  ],
  exports: ['UserRepository'],
})
export class UsersModule {}
