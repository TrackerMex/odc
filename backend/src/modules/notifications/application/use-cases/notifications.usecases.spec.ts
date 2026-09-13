import type { NotificationRepository } from '../../domain/repositories/notification.repository';
import { GetNotificationsUseCase } from './get-notifications.usecase';
import { MarkNotificationsReadUseCase } from './mark-notifications-read.usecase';

const viewer = {
  userId: '00000000-0000-4000-8000-000000000001',
  role: 'ADMINISTRACION' as const,
};

describe('odc-notifications R1-R3: notification use cases', () => {
  const repository: jest.Mocked<NotificationRepository> = {
    listForUser: jest.fn(),
    markAllRead: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('returns the role-filtered feed with the fixed professional panel limit', async () => {
    const feed = { items: [], unreadCount: 0 };
    repository.listForUser.mockResolvedValue(feed);

    await expect(
      new GetNotificationsUseCase(repository).execute(viewer),
    ).resolves.toBe(feed);
    expect(repository.listForUser.mock.calls).toEqual([[viewer, 20]]);
  });

  it('persists a read cutoff for only the authenticated user', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-13T19:00:00Z'));
    repository.markAllRead.mockResolvedValue(undefined);

    await expect(
      new MarkNotificationsReadUseCase(repository).execute(viewer.userId),
    ).resolves.toEqual({ success: true });
    expect(repository.markAllRead.mock.calls).toEqual([
      [viewer.userId, new Date('2026-09-13T19:00:00Z')],
    ]);
    jest.useRealTimers();
  });
});
