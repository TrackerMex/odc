import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateOdcDto } from './update-odc.dto';

const lines = [
  { description: 'Cemento', quantity: 2, unit: 'bulto', unitPriceCents: 1250 },
  { description: 'Arena', quantity: 3, unit: 'm3', unitPriceCents: 2000 },
];

async function errorsFor(payload: Record<string, unknown>) {
  return validate(plainToInstance(UpdateOdcDto, payload), { whitelist: true });
}

describe('R3: update DTO treats items as a nonempty full replacement', () => {
  it('accepts a replacement collection or partial legacy scalar fields', async () => {
    await expect(errorsFor({ items: lines })).resolves.toEqual([]);
    await expect(errorsFor({ quantity: 4 })).resolves.toEqual([]);
  });

  it('rejects an empty replacement collection', async () => {
    const errors = await errorsFor({ items: [] });

    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects a payload that mixes replacement items with legacy scalars', async () => {
    const errors = await errorsFor({ items: lines, quantity: 4 });

    expect(errors.length).toBeGreaterThan(0);
  });
});
