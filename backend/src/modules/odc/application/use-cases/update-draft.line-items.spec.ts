import { PurchaseOrder } from '../../domain/entities/purchase-order.entity';
import { UpdateOdcDto } from '../dto/update-odc.dto';
import { UpdateDraftUseCase } from './update-draft.usecase';

const OWNER = 'ops-user';
const ODC_ID = 'b4e2d8b3-0000-4000-8000-000000000010';
const actor = { userId: OWNER, role: 'DIRECTOR_OPS' as const };
const first = {
  description: 'Cemento',
  quantity: 2,
  unit: 'bulto',
  unitPriceCents: 1250,
};
const second = {
  description: 'Arena',
  quantity: 3,
  unit: 'm3',
  unitPriceCents: 2000,
};

function multiLineOrder(status: 'BORRADOR' | 'RECHAZADA' = 'BORRADOR') {
  const { order } = PurchaseOrder.createDraft(
    { items: [first, second], supplier: 'Proveedor' },
    actor,
  );
  return new PurchaseOrder({ ...order, id: ODC_ID, status });
}

function useCaseFor(order: PurchaseOrder) {
  const repository = {
    findById: jest.fn().mockResolvedValue(order),
    update: jest
      .fn()
      .mockImplementation((saved: PurchaseOrder) => Promise.resolve(saved)),
  };
  const suppliers = { findByName: jest.fn().mockResolvedValue(null) };
  return {
    useCase: new UpdateDraftUseCase(repository as never, suppliers as never),
    repository,
  };
}

describe('R3: update use-case replaces items or applies legacy changes to the first', () => {
  it.each(['BORRADOR', 'RECHAZADA'] as const)(
    'replaces the whole ordered collection while status %s stays unchanged',
    async (status) => {
      const order = multiLineOrder(status);
      const { useCase, repository } = useCaseFor(order);
      const input = Object.assign(new UpdateOdcDto(), {
        items: [second, first],
      });

      const updated = await useCase.execute(ODC_ID, input, actor);

      expect(updated.items).toEqual([second, first]);
      expect(updated.totalCents).toBe(8500);
      expect(updated.description).toBe('Arena');
      expect(updated.status).toBe(status);
      expect(repository.update).toHaveBeenCalledWith(updated);
    },
  );

  it('keeps the other lines during a legacy scalar partial update', async () => {
    const order = multiLineOrder();
    const { useCase } = useCaseFor(order);

    const updated = await useCase.execute(ODC_ID, { quantity: 4 }, actor);

    expect(updated.items).toEqual([{ ...first, quantity: 4 }, second]);
    expect(updated.totalCents).toBe(11000);
    expect(updated.quantity).toBe(4);
  });
});
