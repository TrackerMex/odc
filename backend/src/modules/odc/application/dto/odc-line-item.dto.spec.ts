import { plainToInstance } from 'class-transformer';
import { ValidationError, validate } from 'class-validator';
import { CreateOdcDto } from './create-odc.dto';

function flatten(errors: ValidationError[]): ValidationError[] {
  return errors.flatMap((error) => [error, ...flatten(error.children ?? [])]);
}

async function itemErrors(item: Record<string, unknown>) {
  const dto = plainToInstance(CreateOdcDto, {
    items: [item],
    supplier: 'Proveedor',
  });
  return flatten(await validate(dto, { whitelist: true }));
}

describe('R4: nested line-item input validates fields and integer bounds', () => {
  it.each(['description', 'unit'] as const)(
    'rejects whitespace-only %s values',
    async (field) => {
      const item = {
        description: 'Material',
        quantity: 1,
        unit: 'pza',
        unitPriceCents: 100,
        [field]: '   ',
      };

      const errors = await itemErrors(item);

      expect(errors.some((error) => error.property === field)).toBe(true);
    },
  );

  it.each([
    ['quantity', 0],
    ['quantity', 2_147_483_648],
    ['quantity', 1.5],
    ['unitPriceCents', 0],
    ['unitPriceCents', 2_147_483_648],
    ['unitPriceCents', '100'],
  ] as const)('rejects invalid %s value %p', async (field, value) => {
    const item = {
      description: 'Material',
      quantity: 1,
      unit: 'pza',
      unitPriceCents: 100,
      [field]: value,
    };

    const errors = await itemErrors(item);

    expect(errors.some((error) => error.property === field)).toBe(true);
  });
});
