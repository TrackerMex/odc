import type { OdcStatus } from './purchase-order.entity';

export class OdcStatusHistoryEntry {
  constructor(
    public readonly id: string | null,
    public odcId: string | null,
    public fromStatus: OdcStatus | null,
    public toStatus: OdcStatus,
    public userId: string,
    public note: string | null,
    public createdAt: Date | null,
  ) {}
}
