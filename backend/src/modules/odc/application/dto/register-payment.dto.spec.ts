import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterPaymentDto } from './register-payment.dto';

async function validateNestedPayload(
  payload: Record<string, unknown>,
): Promise<string[]> {
  const dto = plainToInstance(RegisterPaymentDto, payload);
  const errors = await validate(dto);
  return errors.map((error) => error.property);
}

const VALID_PAYLOAD = {
  paymentDate: '2026-07-20',
  paymentMethod: 'Transferencia',
};

describe('R1: RegisterPaymentDto requires paymentDate and paymentMethod, keeps paymentReference/paymentNotes optional', () => {
  it('accepts a payload with only the required fields', async () => {
    await expect(validateNestedPayload(VALID_PAYLOAD)).resolves.toEqual([]);
  });

  it('accepts a payload with the optional fields present', async () => {
    await expect(
      validateNestedPayload({
        ...VALID_PAYLOAD,
        paymentReference: 'REF-001',
        paymentNotes: 'Pago parcial',
      }),
    ).resolves.toEqual([]);
  });

  it('rejects a payload missing paymentDate', async () => {
    await expect(
      validateNestedPayload({ paymentMethod: VALID_PAYLOAD.paymentMethod }),
    ).resolves.toContain('paymentDate');
  });

  it('rejects a payload with paymentDate in a non-ISO-date format', async () => {
    await expect(
      validateNestedPayload({ ...VALID_PAYLOAD, paymentDate: 'not-a-date' }),
    ).resolves.toContain('paymentDate');
  });

  it('rejects a payload missing paymentMethod', async () => {
    await expect(
      validateNestedPayload({ paymentDate: VALID_PAYLOAD.paymentDate }),
    ).resolves.toContain('paymentMethod');
  });

  it('rejects a payload with an empty paymentMethod', async () => {
    await expect(
      validateNestedPayload({ ...VALID_PAYLOAD, paymentMethod: '' }),
    ).resolves.toContain('paymentMethod');
  });
});
