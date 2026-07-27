import type {
  MonthlyPurchase,
  PurchaseOrderRepository,
} from '../../domain/repositories/purchase-order.repository';
import { GetMonthlyPurchaseSummaryUseCase } from './get-monthly-purchase-summary.usecase';

function purchase(overrides: Partial<MonthlyPurchase> = {}): MonthlyPurchase {
  return {
    id: 'odc-1',
    odcNumber: 'ODC-2026-00001',
    status: 'COMPLETADA',
    requesterName: 'Rodrigo Espinosa',
    description: 'Sensores GPS',
    supplier: 'Suntech',
    quantity: 2,
    unit: 'pieza',
    totalCents: 12_500,
    paymentDate: '2026-07-10',
    warehouseEntryDate: '2026-07-13',
    hasInvoice: true,
    comments: null,
    observations: null,
    ...overrides,
  };
}

describe('R1,R2,R6: monthly paid purchase summary', () => {
  it('queries the requested payment month and calculates money and stage KPIs in cents', async () => {
    const findMonthlyPurchases = jest
      .fn()
      .mockResolvedValue([
        purchase(),
        purchase({ id: 'odc-2', status: 'PAGO_REGISTRADO', totalCents: 7_500 }),
      ]);
    const repository = {
      findMonthlyPurchases,
    } as unknown as PurchaseOrderRepository;
    const useCase = new GetMonthlyPurchaseSummaryUseCase(repository);

    const result = await useCase.execute('2026-07');

    expect(findMonthlyPurchases).toHaveBeenCalledWith('2026-07');
    expect(result).toMatchObject({
      month: '2026-07',
      totalCents: 20_000,
      purchaseCount: 2,
      averageTicketCents: 10_000,
    });
    expect(result.stages).toEqual([
      { status: 'PAGO_REGISTRADO', count: 1, totalCents: 7_500 },
      { status: 'EVIDENCIA_PAGO_SUBIDA', count: 0, totalCents: 0 },
      { status: 'COMPLETADA', count: 1, totalCents: 12_500 },
    ]);
  });

  it('reports the average warehouse time only for purchases with both dates and returns safe zero values for an empty month', async () => {
    const findMonthlyPurchases = jest
      .fn()
      .mockResolvedValueOnce([
        purchase({ warehouseEntryDate: '2026-07-13' }),
        purchase({ id: 'odc-2', warehouseEntryDate: null }),
      ])
      .mockResolvedValueOnce([]);
    const repository = {
      findMonthlyPurchases,
    } as unknown as PurchaseOrderRepository;
    const useCase = new GetMonthlyPurchaseSummaryUseCase(repository);

    await expect(useCase.execute('2026-07')).resolves.toMatchObject({
      averageWarehouseDays: 3,
    });
    await expect(useCase.execute('2026-08')).resolves.toMatchObject({
      totalCents: 0,
      purchaseCount: 0,
      averageTicketCents: 0,
      averageWarehouseDays: null,
      purchases: [],
    });
  });
});
