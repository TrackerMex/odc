import { Inject, Injectable } from '@nestjs/common';
import type { UserRepository } from '../../../users/domain/repositories/user.repository';
import { SessionUserNotFoundError } from '../../domain/errors/session-user-not-found.error';
import type { AuthenticatedUser } from './login.usecase';

@Injectable()
export class GetMeUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}

  async execute(userId: string): Promise<AuthenticatedUser> {
    const user = await this.userRepository.findById(userId);
    if (!user || user.id === null) {
      throw new SessionUserNotFoundError();
    }
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
  }
}
