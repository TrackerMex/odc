import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateOdcDto } from './update-odc.dto';

async function validateUpdatePayload(
  payload: Record<string, unknown>,
): Promise<string[]> {
  const dto = plainToInstance(UpdateOdcDto, payload);
  const errors = await validate(dto);
  return errors.map((error) => error.property);
}

describe('R8: update payload validation accepts partial T1 fields and rejects invalid ones', () => {
  it('accepts an empty payload (every field optional for PATCH)', async () => {
    await expect(validateUpdatePayload({})).resolves.toEqual([]);
  });

  it('accepts a single valid field', async () => {
    await expect(validateUpdatePayload({ quantity: 5 })).resolves.toEqual([]);
  });

  it.each([0, -3, 1.5, '10'])(
    'rejects quantity %p when present but not a positive integer',
    async (quantity) => {
      await expect(validateUpdatePayload({ quantity })).resolves.toContain(
        'quantity',
      );
    },
  );

  it('rejects an empty description when present', async () => {
    await expect(validateUpdatePayload({ description: '' })).resolves.toContain(
      'description',
    );
  });

  it('rejects a non-integer unitPriceCents when present', async () => {
    await expect(
      validateUpdatePayload({ unitPriceCents: 99.9 }),
    ).resolves.toContain('unitPriceCents');
  });
});

describe('R2: the update DTO never declares totalCents and whitelist strips it', () => {
  it('strips a smuggled totalCents when validated with whitelist', async () => {
    const dto = plainToInstance(UpdateOdcDto, { totalCents: 1 });

    const errors = await validate(dto, { whitelist: true });

    expect(errors).toEqual([]);
    expect(dto).not.toHaveProperty('totalCents');
  });
});
