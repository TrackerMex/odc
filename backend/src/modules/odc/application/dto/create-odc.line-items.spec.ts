import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateOdcDto } from './create-odc.dto';

const items = [
  { description: 'Cemento', quantity: 2, unit: 'bulto', unitPriceCents: 1250 },
  { description: 'Arena', quantity: 3, unit: 'm3', unitPriceCents: 2000 },
];

async function errorsFor(payload: Record<string, unknown>) {
  return validate(plainToInstance(CreateOdcDto, payload), { whitelist: true });
}

describe('R2: create DTO accepts either line items or the legacy scalar contract', () => {
  it('accepts a complete items collection with supplier and comments', async () => {
    await expect(
      errorsFor({ items, supplier: 'Proveedor', comments: 'Entregar temprano' }),
    ).resolves.toEqual([]);
  });

  it('continues accepting the complete legacy scalar contract', async () => {
    await expect(
      errorsFor({
        description: 'Cemento',
        quantity: 2,
        unit: 'bulto',
        unitPriceCents: 1250,
        supplier: 'Proveedor',
      }),
    ).resolves.toEqual([]);
  });

  it('rejects a payload that mixes items with legacy line fields', async () => {
    const errors = await errorsFor({
      items,
      description: 'Legado',
      quantity: 1,
      unit: 'pza',
      unitPriceCents: 10,
      supplier: 'Proveedor',
    });

    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects an empty items collection', async () => {
    const errors = await errorsFor({ items: [], supplier: 'Proveedor' });

    expect(errors.length).toBeGreaterThan(0);
  });
});
