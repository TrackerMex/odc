import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UploadInvoiceDto } from './upload-invoice.dto';

async function validatePayload(
  payload: Record<string, unknown>,
): Promise<string[]> {
  const dto = plainToInstance(UploadInvoiceDto, payload);
  const errors = await validate(dto);
  return errors.map((error) => error.property);
}

describe('R1: UploadInvoiceDto requires warehouseEntryDate and keeps invoiceNumber/invoiceDate/observations optional', () => {
  it('rejects a payload without warehouseEntryDate', async () => {
    await expect(validatePayload({})).resolves.toContain(
      'warehouseEntryDate',
    );
  });

  it('rejects an empty warehouseEntryDate', async () => {
    await expect(
      validatePayload({ warehouseEntryDate: '' }),
    ).resolves.toContain('warehouseEntryDate');
  });

  it('rejects a non-date warehouseEntryDate', async () => {
    await expect(
      validatePayload({ warehouseEntryDate: 'not-a-date' }),
    ).resolves.toContain('warehouseEntryDate');
  });

  it('accepts a valid warehouseEntryDate with no optional fields', async () => {
    await expect(
      validatePayload({ warehouseEntryDate: '2026-07-21' }),
    ).resolves.toEqual([]);
  });

  it('accepts a valid warehouseEntryDate with all optional fields present', async () => {
    await expect(
      validatePayload({
        warehouseEntryDate: '2026-07-21',
        invoiceNumber: 'F-001',
        invoiceDate: '2026-07-20',
        observations: 'Entrega parcial',
      }),
    ).resolves.toEqual([]);
  });

  it('rejects a non-string invoiceNumber', async () => {
    await expect(
      validatePayload({ warehouseEntryDate: '2026-07-21', invoiceNumber: 123 }),
    ).resolves.toContain('invoiceNumber');
  });

  it('rejects a non-date invoiceDate', async () => {
    await expect(
      validatePayload({
        warehouseEntryDate: '2026-07-21',
        invoiceDate: 'not-a-date',
      }),
    ).resolves.toContain('invoiceDate');
  });

  it('rejects a non-string observations', async () => {
    await expect(
      validatePayload({ warehouseEntryDate: '2026-07-21', observations: 123 }),
    ).resolves.toContain('observations');
  });
});
