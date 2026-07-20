import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateOdcDto } from './create-odc.dto';

function validPayload(): Record<string, unknown> {
  return {
    description: 'Cemento gris 50kg',
    quantity: 10,
    unit: 'bulto',
    unitPriceCents: 18550,
    supplier: 'CEMEX',
    comments: 'Entrega en obra',
  };
}

async function validateNestedPayload(
  payload: Record<string, unknown>,
): Promise<string[]> {
  const dto = plainToInstance(CreateOdcDto, payload);
  const errors = await validate(dto);
  return errors.map((error) => error.property);
}

describe('R8: create payload validation rejects invalid T1 data with 400', () => {
  it('accepts a valid T1 payload', async () => {
    await expect(validateNestedPayload(validPayload())).resolves.toEqual([]);
  });

  it('accepts a payload without the optional comments', async () => {
    const payload = validPayload();
    delete payload.comments;

    await expect(validateNestedPayload(payload)).resolves.toEqual([]);
  });

  it.each(['description', 'quantity', 'unit', 'unitPriceCents', 'supplier'])(
    'rejects a payload missing the required field %s',
    async (field) => {
      const payload = validPayload();
      delete payload[field];

      await expect(validateNestedPayload(payload)).resolves.toContain(field);
    },
  );

  it.each(['description', 'unit', 'supplier'])(
    'rejects an empty string in %s',
    async (field) => {
      const payload = { ...validPayload(), [field]: '' };

      await expect(validateNestedPayload(payload)).resolves.toContain(field);
    },
  );

  it.each([0, -3, 1.5, '10'])(
    'rejects quantity when it is %p instead of a positive integer',
    async (quantity) => {
      const payload = { ...validPayload(), quantity };

      await expect(validateNestedPayload(payload)).resolves.toContain(
        'quantity',
      );
    },
  );

  it.each([0, -100, 10.5, '18550'])(
    'rejects unitPriceCents when it is %p instead of a positive integer',
    async (unitPriceCents) => {
      const payload = { ...validPayload(), unitPriceCents };

      await expect(validateNestedPayload(payload)).resolves.toContain(
        'unitPriceCents',
      );
    },
  );

  it('rejects a non-string comments value', async () => {
    const payload = { ...validPayload(), comments: 42 };

    await expect(validateNestedPayload(payload)).resolves.toContain('comments');
  });
});

describe('R2: the create DTO never declares totalCents and whitelist strips it', () => {
  it('does not declare totalCents as a property of the DTO', () => {
    const dto = plainToInstance(CreateOdcDto, validPayload());

    expect(Object.keys(dto)).not.toContain('totalCents');
  });

  it('strips a smuggled totalCents when validated with whitelist', async () => {
    const dto = plainToInstance(CreateOdcDto, {
      ...validPayload(),
      totalCents: 1,
    });

    const errors = await validate(dto, { whitelist: true });

    expect(errors).toEqual([]);
    expect(dto).not.toHaveProperty('totalCents');
  });
});
