import { Inject, Injectable } from '@nestjs/common';
import type { NotificationRepository } from '../../domain/repositories/notification.repository';

@Injectable()
export class MarkNotificationsReadUseCase {
  constructor(
    @Inject('NotificationRepository')
    private readonly repository: NotificationRepository,
  ) {}

  async execute(userId: string): Promise<{ success: true }> {
    await this.repository.markAllRead(userId, new Date());
    return { success: true };
  }
}
