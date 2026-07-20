import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UploadPaymentEvidenceDto } from './upload-payment-evidence.dto';

async function validatePayload(
  payload: Record<string, unknown>,
): Promise<string[]> {
  const dto = plainToInstance(UploadPaymentEvidenceDto, payload);
  const errors = await validate(dto);
  return errors.map((error) => error.property);
}

describe('R1: UploadPaymentEvidenceDto keeps evidenceReference optional', () => {
  it('accepts a payload without evidenceReference', async () => {
    await expect(validatePayload({})).resolves.toEqual([]);
  });

  it('accepts a payload with evidenceReference as a string', async () => {
    await expect(
      validatePayload({ evidenceReference: 'REF-EV-001' }),
    ).resolves.toEqual([]);
  });

  it('rejects a payload with a non-string evidenceReference', async () => {
    await expect(
      validatePayload({ evidenceReference: 12345 }),
    ).resolves.toContain('evidenceReference');
  });
});
