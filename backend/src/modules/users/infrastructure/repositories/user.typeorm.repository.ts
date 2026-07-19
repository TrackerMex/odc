import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { UserOrmEntity } from '../entities/user.orm-entity';

function toDomain(row: UserOrmEntity): User {
  return new User(
    row.id,
    row.email,
    row.passwordHash,
    row.fullName,
    row.role,
    row.createdAt,
  );
}

@Injectable()
export class UserTypeOrmRepository implements UserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly ormRepository: Repository<UserOrmEntity>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.ormRepository.findOne({ where: { email } });
    return row ? toDomain(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.ormRepository.findOne({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async create(user: User): Promise<User> {
    const row = this.ormRepository.create({
      email: user.email,
      passwordHash: user.passwordHash,
      fullName: user.fullName,
      role: user.role,
    });
    const saved = await this.ormRepository.save(row);
    return toDomain(saved);
  }
}
