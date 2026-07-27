import { Inject, Injectable } from '@nestjs/common';
import {
  MonthlyPurchase,
  MONTHLY_PURCHASE_STATUSES,
} from '../../domain/repositories/purchase-order.repository';
import type { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository';

export interface MonthlyStageMetric {
  status: (typeof MONTHLY_PURCHASE_STATUSES)[number];
  count: number;
  totalCents: number;
}

export interface MonthlyPurchaseSummary {
  month: string;
  totalCents: number;
  purchaseCount: number;
  averageTicketCents: number;
  averageWarehouseDays: number | null;
  stages: MonthlyStageMetric[];
  purchases: MonthlyPurchase[];
}

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

function daysBetween(start: string, end: string): number {
  const startTime = Date.parse(`${start.slice(0, 10)}T00:00:00.000Z`);
  const endTime = Date.parse(`${end.slice(0, 10)}T00:00:00.000Z`);
  return Math.max(0, Math.round((endTime - startTime) / DAY_IN_MILLISECONDS));
}

@Injectable()
export class GetMonthlyPurchaseSummaryUseCase {
  constructor(
    @Inject('PurchaseOrderRepository')
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
  ) {}

  async execute(month: string): Promise<MonthlyPurchaseSummary> {
    const purchases =
      await this.purchaseOrderRepository.findMonthlyPurchases(month);
    const totalCents = purchases.reduce(
      (total, purchase) => total + purchase.totalCents,
      0,
    );
    const stages = MONTHLY_PURCHASE_STATUSES.map((status) => ({
      status,
      count: 0,
      totalCents: 0,
    }));
    const warehouseDays = purchases.flatMap((purchase) =>
      purchase.warehouseEntryDate
        ? [daysBetween(purchase.paymentDate, purchase.warehouseEntryDate)]
        : [],
    );

    for (const purchase of purchases) {
      const stage = stages.find((item) => item.status === purchase.status);
      if (stage) {
        stage.count += 1;
        stage.totalCents += purchase.totalCents;
      }
    }

    return {
      month,
      totalCents,
      purchaseCount: purchases.length,
      averageTicketCents:
        purchases.length === 0 ? 0 : Math.round(totalCents / purchases.length),
      averageWarehouseDays:
        warehouseDays.length === 0
          ? null
          : Math.round(
              warehouseDays.reduce((total, days) => total + days, 0) /
                warehouseDays.length,
            ),
      stages,
      purchases,
    };
  }
}
