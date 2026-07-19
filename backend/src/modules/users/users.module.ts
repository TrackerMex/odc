import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOrmEntity } from './infrastructure/entities/user.orm-entity';
import { UserTypeOrmRepository } from './infrastructure/repositories/user.typeorm.repository';

@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity])],
  providers: [
    { provide: 'UserRepository', useClass: UserTypeOrmRepository },
  ],
  exports: ['UserRepository'],
})
export class UsersModule {}
