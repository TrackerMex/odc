import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RejectOdcDto } from './reject-odc.dto';

async function validateNestedPayload(
  payload: Record<string, unknown>,
): Promise<string[]> {
  const dto = plainToInstance(RejectOdcDto, payload);
  const errors = await validate(dto);
  return errors.map((error) => error.property);
}

describe('R3: RejectOdcDto requires a non-empty rejectionReason', () => {
  it('accepts a valid payload', async () => {
    await expect(
      validateNestedPayload({ rejectionReason: 'Presupuesto excedido' }),
    ).resolves.toEqual([]);
  });

  it('rejects a payload missing rejectionReason', async () => {
    await expect(validateNestedPayload({})).resolves.toContain(
      'rejectionReason',
    );
  });

  it('rejects an empty string rejectionReason', async () => {
    await expect(
      validateNestedPayload({ rejectionReason: '' }),
    ).resolves.toContain('rejectionReason');
  });

  it('rejects a non-string rejectionReason', async () => {
    await expect(
      validateNestedPayload({ rejectionReason: 42 }),
    ).resolves.toContain('rejectionReason');
  });
});
