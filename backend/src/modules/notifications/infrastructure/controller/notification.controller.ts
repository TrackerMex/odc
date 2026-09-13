import { Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import type { SessionTokenPayload } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { GetNotificationsUseCase } from '../../application/use-cases/get-notifications.usecase';
import { MarkNotificationsReadUseCase } from '../../application/use-cases/mark-notifications-read.usecase';
import type { NotificationFeed } from '../../domain/entities/notification.entity';

@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly getNotificationsUseCase: GetNotificationsUseCase,
    private readonly markNotificationsReadUseCase: MarkNotificationsReadUseCase,
  ) {}

  @Get()
  list(
    @Req() request: { user: SessionTokenPayload },
  ): Promise<NotificationFeed> {
    return this.getNotificationsUseCase.execute({
      userId: request.user.sub,
      role: request.user.role,
    });
  }

  @Post('read')
  @HttpCode(200)
  markRead(
    @Req() request: { user: SessionTokenPayload },
  ): Promise<{ success: true }> {
    return this.markNotificationsReadUseCase.execute(request.user.sub);
  }
}
