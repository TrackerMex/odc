import type { DataSource } from 'typeorm';
import { NotificationTypeOrmRepository } from './notification.typeorm.repository';

const viewer = {
  userId: '00000000-0000-4000-8000-000000000001',
  role: 'DIRECTOR_GENERAL' as const,
};

describe('odc-notifications R1-R3: notification projection', () => {
  it('uses history, hides foreign drafts, orders newest first and returns the exact unread count', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([
        {
          id: 'event-2',
          odcId: 'odc-2',
          odcNumber: 'ODC-2026-00002',
          fromStatus: 'PENDIENTE_ADMIN',
          toStatus: 'PRESUPUESTO_APROBADO',
          actorName: 'Ana Administración',
          createdAt: new Date('2026-09-13T18:00:00Z'),
          isRead: false,
        },
      ])
      .mockResolvedValueOnce([{ unreadCount: '7' }]);
    const repository = new NotificationTypeOrmRepository({
      manager: { query },
    } as unknown as DataSource);

    const result = await repository.listForUser(viewer, 20);

    expect(result.unreadCount).toBe(7);
    expect(result.items[0]).toMatchObject({
      id: 'event-2',
      odcNumber: 'ODC-2026-00002',
      isRead: false,
    });
    expect(query).toHaveBeenCalledTimes(2);
    const [feedSql, feedParameters] = query.mock.calls[0] as [
      string,
      unknown[],
    ];
    expect(feedSql).toContain('odc_status_history');
    expect(feedSql).toContain(`h."toStatus" <> 'BORRADOR'`);
    expect(feedSql).toContain('o."createdById" = $1');
    expect(feedSql).toContain('ORDER BY h."createdAt" DESC, h.id DESC');
    expect(feedSql).toContain('LIMIT $2');
    expect(feedParameters).toEqual([viewer.userId, 20]);
  });

  it('updates only the authenticated user read cutoff', async () => {
    const update = jest.fn().mockResolvedValue({ affected: 1 });
    const repository = new NotificationTypeOrmRepository({
      manager: { update },
    } as unknown as DataSource);
    const at = new Date('2026-09-13T19:00:00Z');

    await repository.markAllRead(viewer.userId, at);

    expect(update).toHaveBeenCalledWith(
      expect.any(Function),
      { id: viewer.userId },
      { notificationsReadAt: at },
    );
  });
});
