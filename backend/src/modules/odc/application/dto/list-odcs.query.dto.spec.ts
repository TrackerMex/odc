import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListOdcsQueryDto } from './list-odcs.query.dto';

async function validateQuery(
  payload: Record<string, unknown>,
): Promise<string[]> {
  const dto = plainToInstance(ListOdcsQueryDto, payload);
  const errors = await validate(dto);
  return errors.map((error) => error.property);
}

describe('R12: list query validation for status and page', () => {
  it('accepts an empty query', async () => {
    await expect(validateQuery({})).resolves.toEqual([]);
  });

  it.each(['BORRADOR', 'PENDIENTE_ADMIN', 'RECHAZADA', 'COMPLETADA'])(
    'accepts the machine status %s as filter',
    async (status) => {
      await expect(validateQuery({ status })).resolves.toEqual([]);
    },
  );

  it('rejects a status outside the 8 machine values', async () => {
    await expect(validateQuery({ status: 'INVALIDO' })).resolves.toContain(
      'status',
    );
  });

  it('accepts a positive integer page as query string', async () => {
    await expect(validateQuery({ page: '2' })).resolves.toEqual([]);
  });

  it.each(['0', '-1', 'abc', '1.5'])(
    'rejects the non positive-integer page %s',
    async (page) => {
      await expect(validateQuery({ page })).resolves.toContain('page');
    },
  );
});
