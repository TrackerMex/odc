import { CreateOdcDto } from '../dto/create-odc.dto';
import { CreateDraftUseCase } from './create-draft.usecase';

const actor = { userId: 'ops-user', role: 'DIRECTOR_OPS' as const };
const items = [
  { description: 'Cemento', quantity: 2, unit: 'bulto', unitPriceCents: 1250 },
  { description: 'Arena', quantity: 3, unit: 'm3', unitPriceCents: 2000 },
];

describe('R2: create use-case persists normalized line items as a draft', () => {
  it('persists all lines, their aggregate total, and the existing opening history', async () => {
    const repository = {
      create: jest.fn().mockImplementation((order) => Promise.resolve(order)),
    };
    const suppliers = {
      findByName: jest.fn().mockResolvedValue({ id: 'supplier-1', name: 'Proveedor' }),
    };
    const useCase = new CreateDraftUseCase(repository as never, suppliers as never);
    const input = Object.assign(new CreateOdcDto(), {
      items,
      supplier: 'Proveedor',
      comments: 'Entregar temprano',
    });

    const created = await useCase.execute(input, actor);
    const [order, history] = repository.create.mock.calls[0];

    expect(order.items).toEqual(items);
    expect(order.totalCents).toBe(8500);
    expect(order.description).toBe('Cemento');
    expect(order.supplier).toBe('Proveedor');
    expect(order.comments).toBe('Entregar temprano');
    expect(order.status).toBe('BORRADOR');
    expect(history.toStatus).toBe('BORRADOR');
    expect(created.items).toEqual(items);
  });
});
